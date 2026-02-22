import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Fetch checked grocery item keys for a given week.
 * Returns a Set of item_key strings for fast lookups.
 */
export function useGroceryChecked(weekStart) {
    return useQuery({
        queryKey: ['groceryChecked', weekStart],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('grocery_checked')
                .select('item_key')
                .eq('week_start', weekStart);

            if (error) throw error;
            const set = {};
            for (const row of data || []) {
                set[row.item_key] = true;
            }
            return set;
        },
        enabled: Boolean(weekStart),
    });
}

/**
 * Toggle a grocery item's checked state for a given week.
 * If checked → insert row. If unchecked → delete row.
 */
export function useToggleGroceryChecked() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: async ({ itemKey, weekStart, checked }) => {
            if (checked) {
                // Insert (upsert to be safe)
                const { error } = await supabase
                    .from('grocery_checked')
                    .upsert(
                        { item_key: itemKey, week_start: weekStart },
                        { onConflict: 'item_key,week_start' }
                    );
                if (error) throw error;
            } else {
                // Delete
                const { error } = await supabase
                    .from('grocery_checked')
                    .delete()
                    .eq('item_key', itemKey)
                    .eq('week_start', weekStart);
                if (error) throw error;
            }
        },
        onMutate: async ({ itemKey, weekStart, checked }) => {
            // Optimistic update
            const key = ['groceryChecked', weekStart];
            await qc.cancelQueries({ queryKey: key });
            const prev = qc.getQueryData(key) || {};
            const next = { ...prev };
            if (checked) {
                next[itemKey] = true;
            } else {
                delete next[itemKey];
            }
            qc.setQueryData(key, next);
            return { prev };
        },
        onError: (_err, { weekStart }, ctx) => {
            if (ctx?.prev) {
                qc.setQueryData(['groceryChecked', weekStart], ctx.prev);
            }
        },
        onSettled: (_data, _err, { weekStart }) => {
            qc.invalidateQueries({ queryKey: ['groceryChecked', weekStart] });
        },
    });
}
