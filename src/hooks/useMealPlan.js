import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/dates';

/**
 * Fetch meal plans for a given week (Mon–Sun).
 * Returns a map: { "YYYY-MM-DD": { lunch: {...}, dinner: {...} } }
 */
export function useMealPlan(weekDates) {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;
    const startDate = weekDates.length > 0 ? formatDate(weekDates[0]) : null;
    const endDate = weekDates.length > 0 ? formatDate(weekDates[6]) : null;

    return useQuery({
        queryKey: ['mealPlan', userId, startDate, endDate],
        queryFn: async () => {
            if (!userId || !startDate || !endDate) return {};

            const { data, error } = await supabase
                .from('meal_plan')
                .select(`
          id,
          target_date,
          slot_type,
          recipe_id,
          recipes (id, name)
        `)
                .eq('user_id', userId)
                .gte('target_date', startDate)
                .lte('target_date', endDate);

            if (error) throw error;

            // Build a map: { "2026-02-23": { lunch: { ...mealPlanRow }, dinner: null } }
            const map = {};
            for (const date of weekDates) {
                const key = formatDate(date);
                map[key] = { lunch: null, dinner: null };
            }
            for (const row of data || []) {
                const key = row.target_date;
                if (map[key]) {
                    map[key][row.slot_type] = row;
                }
            }
            return map;
        },
        enabled: Boolean(userId && startDate && endDate),
    });
}

/** Add a single meal to the plan. */
export function useAddMeal() {
    const qc = useQueryClient();
    const { currentUser } = useAuth();

    return useMutation({
        mutationFn: async ({ recipeId, targetDate, slotType }) => {
            const { data, error } = await supabase
                .from('meal_plan')
                .upsert(
                    {
                        user_id: currentUser.id,
                        recipe_id: recipeId,
                        target_date: targetDate,
                        slot_type: slotType,
                    },
                    { onConflict: 'user_id,target_date,slot_type' }
                )
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['mealPlan'] }),
    });
}

/** Bulk-assign a recipe to multiple day+slot combos. */
export function useBulkAssignMeals() {
    const qc = useQueryClient();
    const { currentUser } = useAuth();

    return useMutation({
        mutationFn: async ({ recipeId, assignments }) => {
            // assignments: [{ targetDate: 'YYYY-MM-DD', slotType: 'lunch'|'dinner' }, ...]
            const rows = assignments.map((a) => ({
                user_id: currentUser.id,
                recipe_id: recipeId,
                target_date: a.targetDate,
                slot_type: a.slotType,
            }));

            const { error } = await supabase
                .from('meal_plan')
                .upsert(rows, { onConflict: 'user_id,target_date,slot_type' });

            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['mealPlan'] }),
    });
}

/** Remove a meal from the plan. */
export function useRemoveMeal() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (mealPlanId) => {
            const { error } = await supabase
                .from('meal_plan')
                .delete()
                .eq('id', mealPlanId);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['mealPlan'] }),
    });
}
