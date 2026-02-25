import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useExpenses(projectId) {
    return useQuery({
        queryKey: ['expenses', projectId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('project_id', projectId)
                .order('expense_date', { ascending: false })
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data || [];
        },
        enabled: Boolean(projectId),
    });
}

export function useAddExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (expense) => {
            const { data, error } = await supabase
                .from('expenses')
                .insert(expense)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['expenses', data.project_id] });
        },
    });
}

export function useUpdateExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }) => {
            const { data, error } = await supabase
                .from('expenses')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['expenses', data.project_id] });
        },
    });
}

export function useDeleteExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, projectId }) => {
            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return projectId;
        },
        onSuccess: (projectId) => {
            qc.invalidateQueries({ queryKey: ['expenses', projectId] });
        },
    });
}

/**
 * Compute balances from expense list, grouped by currency.
 * split_type: 'split' = 50/50, 'full' = entire amount owed by the other person.
 * Returns: { EUR: { total: 120, G: 100, L: 20, owed: { from: 'L', to: 'G', amount: 40 } }, ... }
 */
export function computeBalances(expenses) {
    const byCurrency = {};

    for (const exp of expenses) {
        const cur = exp.currency || 'EUR';
        if (!byCurrency[cur]) byCurrency[cur] = { total: 0, G: 0, L: 0, fairG: 0, fairL: 0 };
        const amount = Number(exp.amount);
        const splitType = exp.split_type || 'split';

        if (exp.is_settlement) {
            // Settlement: paid_by is the person paying back debt.
            // Only add to their "paid" total — NOT to fair share.
            // This shifts their balance (paid − fair) upward, reducing their debt.
            byCurrency[cur][exp.paid_by] += amount;
        } else {
            byCurrency[cur].total += amount;
            byCurrency[cur][exp.paid_by] += amount;

            if (splitType === 'full') {
                // Entire expense is for the OTHER person's account
                // So the payer's fair share is 0, the other's fair share is the full amount
                const other = exp.paid_by === 'G' ? 'L' : 'G';
                byCurrency[cur][`fair${other}`] += amount;
            } else {
                // 50/50 split
                byCurrency[cur].fairG += amount / 2;
                byCurrency[cur].fairL += amount / 2;
            }
        }
    }

    const result = {};
    for (const [cur, data] of Object.entries(byCurrency)) {
        // Balance = what you paid − what you should have paid
        const gBalance = data.G - data.fairG;
        const lBalance = data.L - data.fairL;

        let owed = null;
        if (Math.abs(gBalance) > 0.01) {
            if (gBalance > 0) {
                owed = { from: 'L', to: 'G', amount: Math.abs(gBalance) };
            } else {
                owed = { from: 'G', to: 'L', amount: Math.abs(gBalance) };
            }
        }

        result[cur] = { total: data.total, G: data.G, L: data.L, owed };
    }

    return result;
}

/**
 * Compute monthly stats from expense list.
 * Returns: [{ month: '2026-02', total: 500, G: 300, L: 200, expenses: [...] }, ...]
 */
export function computeMonthlyStats(expenses) {
    const byMonth = {};

    for (const exp of expenses) {
        if (exp.is_settlement) continue; // skip settlements for stats
        const month = exp.expense_date?.slice(0, 7) || 'unknown';
        if (!byMonth[month]) byMonth[month] = { month, total: 0, G: 0, L: 0, count: 0 };
        const amount = Number(exp.amount);
        byMonth[month].total += amount;
        byMonth[month][exp.paid_by] += amount;
        byMonth[month].count += 1;
    }

    return Object.values(byMonth).sort((a, b) => b.month.localeCompare(a.month));
}
