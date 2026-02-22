import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/** Recupera tutti gli ingredienti (condivisi tra utenti). */
export function useIngredients(searchTerm = '') {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;

    return useQuery({
        queryKey: ['ingredients', searchTerm],
        queryFn: async () => {
            let query = supabase
                .from('ingredients')
                .select('id, name, category')
                .order('name');

            if (searchTerm) {
                query = query.ilike('name', `%${searchTerm}%`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        },
        enabled: Boolean(userId),
    });
}

/** Crea un nuovo ingrediente nel dizionario globale. */
export function useCreateIngredient() {
    const qc = useQueryClient();
    const { currentUser } = useAuth();

    return useMutation({
        mutationFn: async ({ name, category }) => {
            const { data, error } = await supabase
                .from('ingredients')
                .insert({ user_id: currentUser.id, name, category: category || 'Altro' })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ingredients'] });
        },
    });
}

/** Modifica nome e/o categoria di un ingrediente. */
export function useUpdateIngredient() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, name, category }) => {
            const updates = {};
            if (name !== undefined) updates.name = name;
            if (category !== undefined) updates.category = category;
            const { error } = await supabase
                .from('ingredients')
                .update(updates)
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ingredients'] });
            qc.invalidateQueries({ queryKey: ['groceryList'] });
            qc.invalidateQueries({ queryKey: ['groceryExtras'] });
        },
    });
}

/** Elimina un ingrediente dal dizionario. */
export function useDeleteIngredient() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from('ingredients')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['ingredients'] });
            qc.invalidateQueries({ queryKey: ['groceryList'] });
            qc.invalidateQueries({ queryKey: ['groceryExtras'] });
        },
    });
}

export const INGREDIENT_CATEGORIES = [
    'Frutta e verdura',
    'Semi e frutta secca',
    'Legumi e cereali',
    'Dispensa salata',
    'Latte e derivati',
    'Banco frigo',
    'Carne e pesce',
    'Dispensa dolce',
    'Surgelati',
    'Snack',
    'Utilities home',
    'Utilities persona',
];
