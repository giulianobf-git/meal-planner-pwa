import { useState, useMemo } from 'react';
import { X } from 'lucide-react';

const CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK'];

export default function ExpenseFormModal({ onClose, onSave, expense = null, isPending }) {
    const isEdit = Boolean(expense);
    const [title, setTitle] = useState(expense?.title || '');
    const [amount, setAmount] = useState(expense?.amount?.toString() || '');
    const [paidBy, setPaidBy] = useState(expense?.paid_by || 'G');
    const [currency, setCurrency] = useState(expense?.currency || 'EUR');
    const [date, setDate] = useState(expense?.expense_date || new Date().toISOString().slice(0, 10));

    const canSave = title.trim() && amount && Number(amount) > 0;

    const handleSave = () => {
        if (!canSave) return;
        onSave({
            ...(expense?.id && { id: expense.id }),
            title: title.trim(),
            amount: Number(amount),
            paid_by: paidBy,
            currency,
            expense_date: date,
        });
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-hidden" style={{ height: '100vh', width: '100vw' }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                className="absolute inset-0 flex flex-col bg-slate-800 overflow-hidden"
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">
                        {isEdit ? 'Modifica Spesa' : 'Nuova Spesa'}
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Form */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden px-5 py-5 space-y-5" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {/* Title */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Descrizione
                        </label>
                        <input
                            type="text"
                            placeholder="es. Cena fuori, Supermercato..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                        />
                    </div>

                    {/* Amount + Currency */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                                Importo
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                            />
                        </div>
                        <div className="w-28">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                                Valuta
                            </label>
                            <select
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="w-full px-3 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white outline-none focus:border-purple-500/50 appearance-none"
                            >
                                {CURRENCIES.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Paid By */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Pagato da
                        </label>
                        <div className="flex gap-2">
                            {['G', 'L'].map((user) => (
                                <button
                                    key={user}
                                    onClick={() => setPaidBy(user)}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${paidBy === user
                                        ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                                        : 'bg-slate-700/40 border border-slate-600/40 text-slate-400'
                                        }`}
                                >
                                    {user}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Data
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white outline-none focus:border-purple-500/50"
                            style={{ maxWidth: '100%', boxSizing: 'border-box' }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-700/50 flex-shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={!canSave || isPending}
                        className="w-full py-3.5 bg-purple-500 disabled:bg-slate-700 text-white disabled:text-slate-500 font-bold rounded-2xl transition-all active:scale-[0.98]"
                    >
                        {isPending ? 'Salvataggio...' : isEdit ? 'Salva' : 'Aggiungi Spesa'}
                    </button>
                </div>
            </div>
        </div>
    );
}
