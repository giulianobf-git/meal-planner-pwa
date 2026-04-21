import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/** Fetch all recipes (shared between users), searchable by name or ingredient. */
export function useRecipes(searchTerm = '') {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;

    return useQuery({
        queryKey: ['recipes', searchTerm],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('recipes')
                .select(`id, name, instructions, created_at,
                    recipe_ingredients ( ingredients ( name ) )`)
                .order('name');

            if (error) throw error;
            if (!data) return [];

            if (!searchTerm) return data;

            const term = searchTerm.toLowerCase();
            return data.filter((recipe) => {
                // Match recipe name
                if (recipe.name.toLowerCase().includes(term)) return true;
                // Match any ingredient name
                return recipe.recipe_ingredients?.some((ri) =>
                    ri.ingredients?.name?.toLowerCase().includes(term)
                );
            });
        },
        enabled: Boolean(userId),
    });
}

/** Fetch a single recipe with its ingredients. */
export function useRecipeDetail(recipeId) {
    const { currentUser } = useAuth();

    return useQuery({
        queryKey: ['recipe', recipeId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('recipes')
                .select(`
          id, name, instructions, created_at,
          recipe_ingredients (
            id, quantity,
            ingredients (id, name, category)
          )
        `)
                .eq('id', recipeId)
                .single();
            if (error) throw error;
            return data;
        },
        enabled: Boolean(recipeId && currentUser),
    });
}

/** Create a new recipe along with its ingredients. */
export function useCreateRecipe() {
    const qc = useQueryClient();
    const { currentUser } = useAuth();

    return useMutation({
        mutationFn: async ({ name, instructions, ingredients }) => {
            // 1. Create the recipe
            const { data: recipe, error: recipeErr } = await supabase
                .from('recipes')
                .insert({ user_id: currentUser.id, name, instructions })
                .select()
                .single();
            if (recipeErr) throw recipeErr;

            // 2. Create recipe_ingredients links
            if (ingredients && ingredients.length > 0) {
                const links = ingredients.map((ing) => ({
                    recipe_id: recipe.id,
                    ingredient_id: ing.ingredientId,
                    quantity: ing.quantity || '',
                }));
                const { error: linkErr } = await supabase
                    .from('recipe_ingredients')
                    .insert(links);
                if (linkErr) throw linkErr;
            }

            return recipe;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['recipes'] });
        },
    });
}

/** Update an existing recipe and its ingredients. */
export function useUpdateRecipe() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, name, instructions, ingredients }) => {
            // 1. Update the recipe
            const { error: recipeErr } = await supabase
                .from('recipes')
                .update({ name, instructions })
                .eq('id', id);
            if (recipeErr) throw recipeErr;

            // 2. Delete old recipe_ingredients, then re-insert
            const { error: delErr } = await supabase
                .from('recipe_ingredients')
                .delete()
                .eq('recipe_id', id);
            if (delErr) throw delErr;

            if (ingredients && ingredients.length > 0) {
                const links = ingredients.map((ing) => ({
                    recipe_id: id,
                    ingredient_id: ing.ingredientId,
                    quantity: ing.quantity || '',
                }));
                const { error: linkErr } = await supabase
                    .from('recipe_ingredients')
                    .insert(links);
                if (linkErr) throw linkErr;
            }
        },
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['recipes'] });
            qc.invalidateQueries({ queryKey: ['recipe', vars.id] });
        },
    });
}

/** Delete a recipe. */
export function useDeleteRecipe() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (recipeId) => {
            const { error } = await supabase
                .from('recipes')
                .delete()
                .eq('id', recipeId);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['recipes'] });
            qc.invalidateQueries({ queryKey: ['mealPlan'] });
        },
    });
}
