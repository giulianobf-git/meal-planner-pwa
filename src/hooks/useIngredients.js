import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

/** Recupera tutti gli ingredienti dell'utente corrente. */
export function useIngredients(searchTerm = '') {
    const { currentUser } = useAuth();
    const userId = currentUser?.id;

    return useQuery({
        queryKey: ['ingredients', userId, searchTerm],
        queryFn: async () => {
            let query = supabase
                .from('ingredients')
                .select('id, name, category')
                .eq('user_id', userId)
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
