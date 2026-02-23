import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { useExpenses, useAddExpense, useUpdateExpense, useDeleteExpense, computeBalances, computeMonthlyStats } from '@/hooks/useExpenses';
import ExpenseFormModal from '@/components/ExpenseFormModal';
import SettleDebtModal from '@/components/SettleDebtModal';
import { ArrowLeft, Plus, Trash2, Edit2, Handshake, BarChart3, Receipt } from 'lucide-react';

export default function ProjectDetailPage() {
    const { id: projectId } = useParams();
    const navigate = useNavigate();
    const { data: projects = [] } = useProjects();
    const project = projects.find((p) => p.id === projectId);
    const { data: expenses = [], isLoading } = useExpenses(projectId);
    const addExpense = useAddExpense();
    const updateExpense = useUpdateExpense();
    const deleteExpense = useDeleteExpense();

    const [tab, setTab] = useState('expenses'); // 'expenses' | 'stats'
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [showSettle, setShowSettle] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const balances = useMemo(() => computeBalances(expenses), [expenses]);
    const monthlyStats = useMemo(() => computeMonthlyStats(expenses), [expenses]);
    const currencies = Object.keys(balances);

    const hasDebt = currencies.some((c) => balances[c].owed);

    const handleSaveExpense = async (data) => {
        if (data.id) {
            await updateExpense.mutateAsync(data);
        } else {
            await addExpense.mutateAsync({ ...data, project_id: projectId });
        }
        setShowExpenseForm(false);
        setEditingExpense(null);
    };

    const handleSettle = async ({ amount, currency, paid_by }) => {
        await addExpense.mutateAsync({
            project_id: projectId,
            title: 'Saldo debito',
            amount,
            currency,
            paid_by,
            expense_date: new Date().toISOString().slice(0, 10),
            is_settlement: true,
        });
        setShowSettle(false);
    };

    const handleDelete = (id) => {
        if (confirmDeleteId === id) {
            deleteExpense.mutate({ id, projectId });
            setConfirmDeleteId(null);
        } else {
            setConfirmDeleteId(id);
            setTimeout(() => setConfirmDeleteId(null), 3000);
        }
    };

    const formatMonth = (m) => {
        const [y, mo] = m.split('-');
        const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        return `${months[parseInt(mo) - 1]} ${y}`;
    };

    return (
        <div className="max-w-lg mx-auto px-4 pt-4 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <button
                    onClick={() => navigate('/conti')}
                    className="p-2 rounded-xl hover:bg-slate-700 transition-colors"
                >
                    <ArrowLeft size={20} className="text-slate-400" />
                </button>
                <h1 className="text-xl font-extrabold text-white truncate flex-1">
                    {project?.name || 'Progetto'}
                </h1>
            </div>

            {/* Balance banner */}
            <div className="bg-slate-800/60 border border-slate-600/50 rounded-2xl p-4 mb-4">
                {currencies.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center">Nessuna spesa ancora</p>
                ) : (
                    <div className="space-y-2">
                        {currencies.map((cur) => {
                            const b = balances[cur];
                            return (
                                <div key={cur}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs text-slate-400 font-semibold">
                                            Totale: {b.total.toFixed(2)} {cur}
                                        </span>
                                        {b.owed ? (
                                            <span className="text-xs font-bold text-amber-400">
                                                {b.owed.from} deve {b.owed.amount.toFixed(2)} {cur} a {b.owed.to}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-green-400">Pari ✓</span>
                                        )}
                                    </div>
                                    {/* Bar chart */}
                                    <div className="flex gap-1 h-2">
                                        <div
                                            className="bg-blue-500/60 rounded-full"
                                            style={{ width: `${b.total > 0 ? (b.G / b.total) * 100 : 50}%` }}
                                            title={`G: ${b.G.toFixed(2)}`}
                                        />
                                        <div
                                            className="bg-pink-500/60 rounded-full"
                                            style={{ width: `${b.total > 0 ? (b.L / b.total) * 100 : 50}%` }}
                                            title={`L: ${b.L.toFixed(2)}`}
                                        />
                                    </div>
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-blue-400 font-semibold">G: {b.G.toFixed(2)}</span>
                                        <span className="text-[10px] text-pink-400 font-semibold">L: {b.L.toFixed(2)}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-4">
                <button
                    onClick={() => { setEditingExpense(null); setShowExpenseForm(true); }}
                    className="flex-1 py-3 flex items-center justify-center gap-2 bg-purple-500/15 border border-purple-500/40 text-purple-400 font-semibold rounded-2xl transition-all active:scale-[0.98]"
                >
                    <Plus size={18} />
                    <span>Aggiungi</span>
                </button>
                {hasDebt && (
                    <button
                        onClick={() => setShowSettle(true)}
                        className="py-3 px-4 flex items-center justify-center gap-2 bg-amber-500/15 border border-amber-500/40 text-amber-400 font-semibold rounded-2xl transition-all active:scale-[0.98]"
                    >
                        <Handshake size={16} />
                        <span>Salda</span>
                    </button>
                )}
            </div>

            {/* Tab toggle */}
            <div className="flex gap-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 mb-4">
                <button
                    onClick={() => setTab('expenses')}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'expenses'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-slate-400 hover:text-slate-300'
                        }`}
                >
                    <Receipt size={14} /> Spese
                </button>
                <button
                    onClick={() => setTab('stats')}
                    className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'stats'
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-slate-400 hover:text-slate-300'
                        }`}
                >
                    <BarChart3 size={14} /> Statistiche
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* EXPENSES TAB */}
            {tab === 'expenses' && !isLoading && (
                <div className="space-y-4">
                    {expenses.length === 0 && (
                        <p className="text-center text-slate-500 py-8">Nessuna spesa. Aggiungi la prima!</p>
                    )}
                    {(() => {
                        const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
                        const grouped = {};
                        for (const exp of expenses) {
                            const m = exp.expense_date?.slice(0, 7) || 'unknown';
                            if (!grouped[m]) grouped[m] = [];
                            grouped[m].push(exp);
                        }
                        const sortedMonths = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

                        return sortedMonths.map((month) => {
                            const [y, mo] = month.split('-');
                            const label = `${monthNames[parseInt(mo) - 1]} ${y}`;
                            return (
                                <div key={month}>
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                                        {label}
                                    </h3>
                                    <div className="space-y-2">
                                        {grouped[month].map((exp) => (
                                            <div
                                                key={exp.id}
                                                className={`bg-slate-800/60 border rounded-xl px-4 py-3 ${exp.is_settlement
                                                        ? 'border-green-500/30 bg-green-500/5'
                                                        : 'border-slate-600/40'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            {exp.is_settlement && (
                                                                <Handshake size={12} className="text-green-400 flex-shrink-0" />
                                                            )}
                                                            <span className="text-sm font-semibold text-white truncate">
                                                                {exp.title}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                                            <span>{exp.expense_date}</span>
                                                            <span className={exp.paid_by === 'G' ? 'text-blue-400' : 'text-pink-400'}>
                                                                {exp.paid_by}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                        <span className={`text-sm font-bold ${exp.is_settlement ? 'text-green-400' : 'text-white'
                                                            }`}>
                                                            {exp.is_settlement ? '+' : ''}{Number(exp.amount).toFixed(2)} {exp.currency}
                                                        </span>
                                                        {!exp.is_settlement && (
                                                            <button
                                                                onClick={() => { setEditingExpense(exp); setShowExpenseForm(true); }}
                                                                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
                                                            >
                                                                <Edit2 size={13} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(exp.id)}
                                                            className={`p-1.5 rounded-lg transition-all ${confirmDeleteId === exp.id
                                                                    ? 'bg-red-500/20 text-red-400'
                                                                    : 'hover:bg-red-500/10 text-slate-600 hover:text-red-400'
                                                                }`}
                                                        >
                                                            {confirmDeleteId === exp.id ? (
                                                                <span className="text-[10px] font-bold">Elimina?</span>
                                                            ) : (
                                                                <Trash2 size={13} />
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        });
                    })()}
                </div>
            )}

            {/* STATS TAB */}
            {tab === 'stats' && !isLoading && (
                <div className="space-y-4">
                    {/* Overall totals */}
                    <div className="bg-slate-800/60 border border-slate-600/50 rounded-2xl p-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Totali Generali
                        </h3>
                        {currencies.length === 0 ? (
                            <p className="text-sm text-slate-500">Nessun dato</p>
                        ) : (
                            currencies.map((cur) => {
                                const b = balances[cur];
                                return (
                                    <div key={cur} className="mb-2 last:mb-0">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-white font-bold">{b.total.toFixed(2)} {cur}</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-blue-400">G: {b.G.toFixed(2)} {cur}</span>
                                            <span className="text-pink-400">L: {b.L.toFixed(2)} {cur}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Monthly breakdown */}
                    <div className="bg-slate-800/60 border border-slate-600/50 rounded-2xl p-4">
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Per Mese
                        </h3>
                        {monthlyStats.length === 0 ? (
                            <p className="text-sm text-slate-500">Nessun dato</p>
                        ) : (
                            <div className="space-y-3">
                                {monthlyStats.map((ms) => (
                                    <div key={ms.month} className="border-b border-slate-700/30 pb-3 last:border-0 last:pb-0">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-bold text-white">{formatMonth(ms.month)}</span>
                                            <span className="text-sm font-bold text-slate-300">{ms.total.toFixed(2)} €</span>
                                        </div>
                                        <div className="flex justify-between text-xs">
                                            <span className="text-blue-400">G: {ms.G.toFixed(2)}</span>
                                            <span className="text-pink-400">L: {ms.L.toFixed(2)}</span>
                                            <span className="text-slate-500">{ms.count} spese</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modals */}
            {showExpenseForm && (
                <ExpenseFormModal
                    expense={editingExpense}
                    onClose={() => { setShowExpenseForm(false); setEditingExpense(null); }}
                    onSave={handleSaveExpense}
                    isPending={addExpense.isPending || updateExpense.isPending}
                />
            )}
            {showSettle && (
                <SettleDebtModal
                    balances={balances}
                    onClose={() => setShowSettle(false)}
                    onSettle={handleSettle}
                    isPending={addExpense.isPending}
                />
            )}
        </div>
    );
}
