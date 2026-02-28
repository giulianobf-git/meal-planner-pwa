import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

/**
 * Fetch daily checks for a given set of dates (both users).
 */
export function useDailyChecks(weekDates) {
    return useQuery({
        queryKey: ['dailyChecks', weekDates?.[0]],
        queryFn: async () => {
            if (!weekDates?.length) return [];
            const { data, error } = await supabase
                .from('daily_checks')
                .select('*')
                .in('date', weekDates)
                .order('date');
            if (error) throw error;
            return data || [];
        },
        enabled: Boolean(weekDates?.length),
    });
}

/**
 * Upsert a daily check row. Uses Supabase's onConflict on (date, user_name).
 */
export function useUpsertCheck() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (check) => {
            const { data, error } = await supabase
                .from('daily_checks')
                .upsert(check, { onConflict: 'date,user_name' })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dailyChecks'] });
        },
    });
}

/**
 * Get a check row for a specific date + user from the array, or return defaults.
 */
export function getCheckForDay(checks, date, user) {
    const found = checks.find((c) => c.date === date && c.user_name === user);
    return found || {
        date,
        user_name: user,
        breakfast: false,
        lunch: false,
        dinner: false,
        trained: false,
        snack_level: 'none',
    };
}

/**
 * Compute points for a single check row.
 */
export function computeDayPoints(check) {
    let pts = 0;
    if (check.breakfast) pts += 1;
    if (check.lunch) pts += 1;
    if (check.dinner) pts += 1;
    if (check.trained) pts += 2;
    if (check.snack_level === 'sgarro') pts -= 1;
    if (check.snack_level === 'sgarro_extra') pts -= 2;
    return pts;
}

/**
 * Compute total weekly points for each user from an array of check rows.
 * Returns { G: number, L: number }
 */
export function computeWeekPoints(checks) {
    const result = { G: 0, L: 0 };
    for (const check of checks) {
        if (check.user_name === 'G' || check.user_name === 'L') {
            result[check.user_name] += computeDayPoints(check);
        }
    }
    return result;
}
