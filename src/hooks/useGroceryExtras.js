import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Recupera gli articoli extra (non da ricette) per una settimana.
 * Fa due query separate per evitare problemi con FK join di PostgREST.
 */
export function useGroceryExtras(weekStart) {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;

    return useQuery({
        queryKey: ['groceryExtras', userId, weekStart],
        queryFn: async () => {
            // 1. Fetch extras per questa settimana
            const { data: extras, error: extrasError } = await supabase
                .from('grocery_extras')
                .select('id, ingredient_id, week_start')
                .eq('user_id', userId)
                .eq('week_start', weekStart);

            if (extrasError) throw extrasError;
            if (!extras || extras.length === 0) return [];

            // 2. Fetch dettagli ingredienti
            const ingredientIds = [...new Set(extras.map((e) => e.ingredient_id))];
            const { data: ingredients, error: ingError } = await supabase
                .from('ingredients')
                .select('id, name, category')
                .in('id', ingredientIds);

            if (ingError) throw ingError;

            const ingMap = {};
            for (const ing of ingredients || []) {
                ingMap[ing.id] = ing;
            }

            // 3. Unisci
            return extras.map((row) => ({
                id: row.id,
                ingredientId: row.ingredient_id,
                name: ingMap[row.ingredient_id]?.name || '',
                category: ingMap[row.ingredient_id]?.category || 'Altro',
                isExtra: true,
            }));
        },
        enabled: Boolean(userId && weekStart),
    });
}

/** Aggiungi un prodotto alla lista della spesa per la settimana. */
export function useAddGroceryExtra() {
    const qc = useQueryClient();
    const { currentUser } = useAuth();

    return useMutation({
        mutationFn: async ({ ingredientId, weekStart }) => {
            const { data, error } = await supabase
                .from('grocery_extras')
                .insert({
                    user_id: currentUser.id,
                    ingredient_id: ingredientId,
                    week_start: weekStart,
                })
                .select('id')
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groceryExtras'] });
        },
    });
}

/** Rimuovi un articolo extra dalla lista della spesa. */
export function useDeleteGroceryExtra() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('grocery_extras')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groceryExtras'] });
        },
    });
}
