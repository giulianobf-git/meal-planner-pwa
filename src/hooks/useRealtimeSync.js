import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Subscribe to Supabase Realtime changes on key tables.
 * When ANY row changes (from either user), invalidate the relevant React Query cache.
 *
 * Resource-efficient:
 * - Single WebSocket connection (Supabase multiplexes)
 * - Only invalidates cache keys — no extra fetches until component is mounted
 * - Cleans up subscription on unmount
 */
export function useRealtimeSync() {
    const qc = useQueryClient();

    useEffect(() => {
        const channel = supabase
            .channel('shared-sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_checked' }, () => {
                qc.invalidateQueries({ queryKey: ['groceryChecked'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meal_plan' }, () => {
                qc.invalidateQueries({ queryKey: ['mealPlan'] });
                qc.invalidateQueries({ queryKey: ['groceryList'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'grocery_extras' }, () => {
                qc.invalidateQueries({ queryKey: ['groceryExtras'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, () => {
                qc.invalidateQueries({ queryKey: ['recipes'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ingredients' }, () => {
                qc.invalidateQueries({ queryKey: ['ingredients'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, () => {
                qc.invalidateQueries({ queryKey: ['projects'] });
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => {
                qc.invalidateQueries({ queryKey: ['expenses'] });
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [qc]);
}
