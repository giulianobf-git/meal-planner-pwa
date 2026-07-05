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

/** Crea un nuovo ingrediente nel dizionario globale.
 *  Controlla duplicati (case-insensitive) prima di inserire.
 *  Se esiste già, lancia un errore con code 'DUPLICATE' e l'ingrediente esistente. */
export function useCreateIngredient() {
    const qc = useQueryClient();
    const { currentUser } = useAuth();

    return useMutation({
        mutationFn: async ({ name, category }) => {
            const trimmedName = name.trim();

            // Case-insensitive duplicate check
            const { data: existing, error: checkError } = await supabase
                .from('ingredients')
                .select('id, name, category')
                .ilike('name', trimmedName)
                .limit(1);

            if (checkError) throw checkError;

            if (existing && existing.length > 0) {
                const err = new Error(`"${existing[0].name}" esiste già!`);
                err.code = 'DUPLICATE';
                err.existingIngredient = existing[0];
                throw err;
            }

            const { data, error } = await supabase
                .from('ingredients')
                .insert({ user_id: currentUser.id, name: trimmedName, category: category || 'Altro' })
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

/** Modifica nome e/o categoria di un ingrediente.
 *  Controlla duplicati (case-insensitive) se il nome viene modificato. */
export function useUpdateIngredient() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, name, category }) => {
            const updates = {};
            if (name !== undefined) {
                const trimmedName = name.trim();
                // Case-insensitive duplicate check (exclude self)
                const { data: existing, error: checkError } = await supabase
                    .from('ingredients')
                    .select('id, name')
                    .ilike('name', trimmedName)
                    .neq('id', id)
                    .limit(1);

                if (checkError) throw checkError;

                if (existing && existing.length > 0) {
                    const err = new Error(`"${existing[0].name}" esiste già!`);
                    err.code = 'DUPLICATE';
                    throw err;
                }
                updates.name = trimmedName;
            }
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
