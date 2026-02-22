import { useState } from 'react';
import { useBulkAssignMeals } from '@/hooks/useMealPlan';
import { useRecipes } from '@/hooks/useRecipes';
import { formatDate, shortDayLabel } from '@/lib/dates';
import { X, Search, Check, ChefHat } from 'lucide-react';

export default function BulkAssignModal({ weekDates, onClose }) {
    const [search, setSearch] = useState('');
    const { data: recipes = [] } = useRecipes(search);
    const bulkAssign = useBulkAssignMeals();
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [selectedSlots, setSelectedSlots] = useState({});

    const toggleSlot = (date, slot) => {
        const key = `${formatDate(date)}|${slot}`;
        setSelectedSlots((prev) => {
            const next = { ...prev };
            if (next[key]) delete next[key];
            else next[key] = true;
            return next;
        });
    };

    const handleAssign = async () => {
        if (!selectedRecipe || Object.keys(selectedSlots).length === 0) return;

        const assignments = Object.keys(selectedSlots).map((key) => {
            const [targetDate, slotType] = key.split('|');
            return { targetDate, slotType };
        });

        await bulkAssign.mutateAsync({ recipeId: selectedRecipe.id, assignments });
        onClose();
    };

    return (
        <div className="fixed top-0 left-0 right-0 z-[60]" style={{ height: '100vh' }}>
            {/* Sfondo */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            {/* Modale — full-screen fixed, immune to iOS keyboard viewport changes */}
            <div
                className="absolute top-0 left-0 right-0 bottom-0 flex flex-col bg-slate-800"
                style={{
                    paddingTop: 'env(safe-area-inset-top, 0px)',
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                {/* Intestazione */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">Aggiungi Pasti</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                {/* Contenuto scrollabile */}
                <div
                    className="flex-1 overflow-y-auto px-5 py-4 space-y-5"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {/* Step 1: Scegli una ricetta */}
                    <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            1. Scegli una ricetta
                        </p>
                        <div className="relative mb-3">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Cerca ricette..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50"
                            />
                        </div>

                        {recipes.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-4">Nessuna ricetta trovata. Creane una prima!</p>
                        ) : (
                            <div className="space-y-1 max-h-48 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                                {recipes.map((recipe) => (
                                    <button
                                        key={recipe.id}
                                        onClick={() => setSelectedRecipe(recipe)}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${selectedRecipe?.id === recipe.id
                                            ? 'bg-green-500/15 border border-green-500/50'
                                            : 'bg-slate-700/30 border border-slate-500/40 hover:bg-slate-700/60'
                                            }`}
                                    >
                                        <ChefHat size={16} className={selectedRecipe?.id === recipe.id ? 'text-green-400' : 'text-slate-500'} />
                                        <span className={`text-sm font-medium truncate ${selectedRecipe?.id === recipe.id ? 'text-green-400' : 'text-slate-300'}`}>
                                            {recipe.name}
                                        </span>
                                        {selectedRecipe?.id === recipe.id && (
                                            <Check size={16} className="text-green-400 ml-auto flex-shrink-0" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Step 2: Seleziona giorni e slot */}
                    {selectedRecipe && (
                        <div className="animate-fade-in">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                2. Seleziona giorni e pasti
                            </p>
                            <div className="space-y-1.5">
                                {weekDates.map((date) => {
                                    const dateStr = formatDate(date);
                                    return (
                                        <div key={dateStr} className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-slate-400 w-12 flex-shrink-0">
                                                {shortDayLabel(date)}
                                            </span>
                                            {['lunch', 'dinner'].map((slot) => {
                                                const key = `${dateStr}|${slot}`;
                                                const checked = Boolean(selectedSlots[key]);
                                                return (
                                                    <button
                                                        key={key}
                                                        onClick={() => toggleSlot(date, slot)}
                                                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${checked
                                                            ? 'bg-green-500/20 border border-green-500/60 text-green-400'
                                                            : 'bg-slate-700/40 border border-slate-500/40 text-slate-400 hover:bg-slate-700/60'
                                                            }`}
                                                    >
                                                        {slot === 'lunch' ? '🌤 Pranzo' : '🌙 Cena'}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-slate-700/50 flex-shrink-0">
                    <button
                        onClick={handleAssign}
                        disabled={!selectedRecipe || Object.keys(selectedSlots).length === 0 || bulkAssign.isPending}
                        className="w-full py-3.5 bg-green-500 disabled:bg-slate-700 text-white disabled:text-slate-500 font-bold rounded-2xl transition-all active:scale-[0.98]"
                    >
                        {bulkAssign.isPending ? 'Salvataggio...' : `Assegna a ${Object.keys(selectedSlots).length} slot`}
                    </button>
                </div>
            </div>
        </div>
    );
}
