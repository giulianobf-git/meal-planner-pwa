import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Recupera gli articoli extra (non da ricette) per una settimana.
 * Restituisce gli extras con dati ingrediente (nome, categoria).
 */
export function useGroceryExtras(weekStart) {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;

    return useQuery({
        queryKey: ['groceryExtras', userId, weekStart],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('grocery_extras')
                .select('id, quantity, week_start, ingredients(id, name, category)')
                .eq('user_id', userId)
                .eq('week_start', weekStart);

            if (error) throw error;
            return (data || []).map((row) => ({
                id: row.id,
                ingredientId: row.ingredients?.id,
                name: row.ingredients?.name || '',
                category: row.ingredients?.category || 'Altro',
                quantity: row.quantity || '',
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
        mutationFn: async ({ ingredientId, quantity, weekStart }) => {
            const { data, error } = await supabase
                .from('grocery_extras')
                .insert({
                    user_id: currentUser.id,
                    ingredient_id: ingredientId,
                    quantity: quantity || '',
                    week_start: weekStart,
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['groceryExtras'] });
            qc.invalidateQueries({ queryKey: ['groceryList'] });
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
            qc.invalidateQueries({ queryKey: ['groceryList'] });
        },
    });
}
