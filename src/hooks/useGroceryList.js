import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/dates';

/**
 * Derive an aggregated, categorized grocery list from the week's meal plan.
 * Shared between users.
 */
export function useGroceryList(weekDates) {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;
    const startDate = weekDates.length > 0 ? formatDate(weekDates[0]) : null;
    const endDate = weekDates.length > 0 ? formatDate(weekDates[6]) : null;

    return useQuery({
        queryKey: ['groceryList', startDate, endDate],
        queryFn: async () => {
            if (!startDate || !endDate) return {};

            // Get all meal plan entries for the week, joined with recipe_ingredients and ingredients
            const { data, error } = await supabase
                .from('meal_plan')
                .select(`
          recipe_id,
          recipes (
            recipe_ingredients (
              quantity,
              ingredients (id, name, category)
            )
          )
        `)
                .gte('target_date', startDate)
                .lte('target_date', endDate);

            if (error) throw error;

            // Aggregate by ingredient
            const ingredientMap = {};

            for (const mealEntry of data || []) {
                const recipeIngredients = mealEntry.recipes?.recipe_ingredients || [];
                for (const ri of recipeIngredients) {
                    const ing = ri.ingredients;
                    if (!ing) continue;

                    if (!ingredientMap[ing.id]) {
                        ingredientMap[ing.id] = {
                            id: ing.id,
                            name: ing.name,
                            category: ing.category || 'Other',
                            quantities: [],
                        };
                    }
                    if (ri.quantity) {
                        ingredientMap[ing.id].quantities.push(ri.quantity);
                    }
                }
            }

            // Parse and aggregate quantities
            const items = Object.values(ingredientMap).map((item) => {
                const totalQuantity = aggregateQuantities(item.quantities);
                return { ...item, totalQuantity };
            });

            // Group by category
            const grouped = {};
            for (const item of items) {
                if (!grouped[item.category]) grouped[item.category] = [];
                grouped[item.category].push(item);
            }

            // Sort items within each category
            for (const cat in grouped) {
                grouped[cat].sort((a, b) => a.name.localeCompare(b.name));
            }

            return grouped;
        },
        enabled: Boolean(userId && startDate && endDate),
    });
}

/**
 * Try to parse and sum numeric quantities.
 * e.g. ["2", "3"] → "5", ["200g", "100g"] → "300g", ["1 cup", "2 tbsp"] → "1 cup, 2 tbsp"
 */
function aggregateQuantities(quantities) {
    if (quantities.length === 0) return '';
    if (quantities.length === 1) return quantities[0];

    // Try pure numeric aggregation
    const numericRegex = /^(\d+(?:\.\d+)?)\s*(.*)$/;
    const parsed = quantities.map((q) => {
        const match = q.match(numericRegex);
        if (match) return { num: parseFloat(match[1]), unit: match[2].trim().toLowerCase() };
        return null;
    });

    // If all parsed and same unit
    if (parsed.every((p) => p !== null)) {
        const unitGroups = {};
        for (const p of parsed) {
            const unit = p.unit || '';
            unitGroups[unit] = (unitGroups[unit] || 0) + p.num;
        }

        const parts = Object.entries(unitGroups).map(([unit, num]) => {
            const display = Number.isInteger(num) ? num.toString() : num.toFixed(1);
            return unit ? `${display} ${unit}` : display;
        });

        return parts.join(', ');
    }

    // Fallback: join with commas
    return quantities.join(', ');
}
