import { useState } from 'react';
import { X } from 'lucide-react';

export default function SettleDebtModal({ onClose, onSettle, balances, isPending }) {
    // Find currencies with outstanding debts
    const debts = Object.entries(balances)
        .filter(([, b]) => b.owed)
        .map(([cur, b]) => ({ currency: cur, ...b.owed }));

    const [selectedCur, setSelectedCur] = useState(debts[0]?.currency || 'EUR');
    const [amount, setAmount] = useState('');

    const currentDebt = debts.find((d) => d.currency === selectedCur);
    const maxAmount = currentDebt?.amount || 0;

    const handleSettle = () => {
        const val = Number(amount);
        if (val <= 0 || !currentDebt) return;
        onSettle({
            amount: val,
            currency: selectedCur,
            paid_by: currentDebt.from, // the person who owes pays back
        });
    };

    if (debts.length === 0) {
        return (
            <div className="fixed top-0 left-0 right-0 z-[60]" style={{ height: '100vh' }}>
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
                <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col bg-slate-800 items-center justify-center"
                    style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <p className="text-lg font-bold text-green-400 mb-4">Siete pari! ✓</p>
                    <button onClick={onClose} className="px-6 py-3 bg-slate-700 text-white font-bold rounded-xl">
                        Chiudi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[60]" style={{ height: '100vh' }}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div
                className="absolute top-0 left-0 right-0 bottom-0 flex flex-col bg-slate-800"
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">Salda Debito</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {/* Debt summary */}
                    <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                        <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Debiti aperti</p>
                        {debts.map((d) => (
                            <p key={d.currency} className="text-sm font-bold text-amber-300">
                                {d.from} deve {d.amount.toFixed(2)} {d.currency} a {d.to}
                            </p>
                        ))}
                    </div>

                    {/* Currency selector (if multiple) */}
                    {debts.length > 1 && (
                        <div>
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                                Valuta
                            </label>
                            <div className="flex gap-2">
                                {debts.map((d) => (
                                    <button
                                        key={d.currency}
                                        onClick={() => { setSelectedCur(d.currency); setAmount(''); }}
                                        className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${selectedCur === d.currency
                                                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-400'
                                                : 'bg-slate-700/40 border border-slate-600/40 text-slate-400'
                                            }`}
                                    >
                                        {d.currency}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                            Importo da saldare ({selectedCur})
                        </label>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            min="0"
                            max={maxAmount}
                            placeholder={`Max: ${maxAmount.toFixed(2)}`}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                        />
                        <button
                            onClick={() => setAmount(maxAmount.toFixed(2))}
                            className="mt-2 text-xs text-purple-400 font-semibold hover:text-purple-300"
                        >
                            Salda tutto ({maxAmount.toFixed(2)} {selectedCur})
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-700/50 flex-shrink-0">
                    <button
                        onClick={handleSettle}
                        disabled={!amount || Number(amount) <= 0 || isPending}
                        className="w-full py-3.5 bg-purple-500 disabled:bg-slate-700 text-white disabled:text-slate-500 font-bold rounded-2xl transition-all active:scale-[0.98]"
                    >
                        {isPending ? 'Salvataggio...' : `Salda ${amount || '0'} ${selectedCur}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
