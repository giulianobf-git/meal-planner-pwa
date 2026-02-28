import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Fetch all weekly results, ordered newest first.
 */
export function useWeeklyResults() {
    return useQuery({
        queryKey: ['weeklyResults'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('weekly_results')
                .select('*')
                .order('week_start', { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });
}

/**
 * Finalize a week: insert a row into weekly_results.
 */
export function useFinalizeWeek() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ week_start, g_points, l_points }) => {
            let winner = 'Pareggio';
            if (g_points > l_points) winner = 'G';
            else if (l_points > g_points) winner = 'L';

            const { data, error } = await supabase
                .from('weekly_results')
                .upsert(
                    { week_start, g_points, l_points, winner },
                    { onConflict: 'week_start' }
                )
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['weeklyResults'] });
        },
    });
}

/**
 * Check if a week should be finalized.
 * A week is finalizable if current time > that week's Sunday 18:00 (6PM).
 */
export function shouldFinalizeWeek(mondayStr) {
    const monday = new Date(mondayStr + 'T00:00:00');
    const sundayCutoff = new Date(monday);
    sundayCutoff.setDate(monday.getDate() + 6); // Sunday
    sundayCutoff.setHours(18, 0, 0, 0);
    return new Date() > sundayCutoff;
}

/**
 * Get Monday of the current week.
 */
export function getCurrentMonday() {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Monday = 1
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    return monday.toISOString().slice(0, 10);
}

/**
 * Get the 7 date strings (YYYY-MM-DD) for a week starting on the given Monday.
 */
export function getWeekDatesFromMonday(mondayStr) {
    const dates = [];
    const d = new Date(mondayStr + 'T00:00:00');
    for (let i = 0; i < 7; i++) {
        const day = new Date(d);
        day.setDate(d.getDate() + i);
        dates.push(day.toISOString().slice(0, 10));
    }
    return dates;
}
