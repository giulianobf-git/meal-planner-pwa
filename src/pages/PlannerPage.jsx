import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, LogOut, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMealPlan, useRemoveMeal } from '@/hooks/useMealPlan';
import { getDefaultMonday, getWeekDates, prevWeek, nextWeek, formatDate, shortDayLabel, monthYearLabel, isToday } from '@/lib/dates';
import BulkAssignModal from '@/components/BulkAssignModal';

export default function PlannerPage() {
    const { currentUser, logout } = useAuth();
    const [monday, setMonday] = useState(() => getDefaultMonday());
    const weekDates = useMemo(() => getWeekDates(monday), [monday]);
    const { data: mealPlan, isLoading } = useMealPlan(weekDates);
    const removeMeal = useRemoveMeal();
    const [showBulkModal, setShowBulkModal] = useState(false);

    // Controlla se siamo in "Modalità Meal Prep" (Ven-Dom)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const isMealPrepMode = dayOfWeek === 0 || dayOfWeek >= 5;

    return (
        <div className="max-w-lg mx-auto px-4 pt-4 pb-4 animate-fade-in">
            {/* Intestazione */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-xl font-extrabold text-white">Ciao, {currentUser?.name} 👋</h1>
                    {isMealPrepMode && (
                        <div className="flex items-center gap-1.5 mt-1">
                            <Sparkles size={14} className="text-amber-400" />
                            <span className="text-xs font-semibold text-amber-400">Modalità Meal Prep</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={logout}
                    className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    aria-label="Esci"
                >
                    <LogOut size={18} />
                </button>
            </div>

            {/* Navigazione settimana */}
            <div className="flex items-center justify-between mb-4 bg-slate-800 rounded-2xl px-4 py-3">
                <button
                    onClick={() => setMonday(prevWeek(monday))}
                    className="p-2 rounded-xl hover:bg-slate-700 active:bg-slate-600 transition-colors"
                    aria-label="Settimana precedente"
                >
                    <ChevronLeft size={20} className="text-slate-300" />
                </button>
                <div className="text-center">
                    <p className="text-sm font-bold text-white">{monthYearLabel(monday)}</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                        {formatDate(weekDates[0])} – {formatDate(weekDates[6])}
                    </p>
                </div>
                <button
                    onClick={() => setMonday(nextWeek(monday))}
                    className="p-2 rounded-xl hover:bg-slate-700 active:bg-slate-600 transition-colors"
                    aria-label="Settimana successiva"
                >
                    <ChevronRight size={20} className="text-slate-300" />
                </button>
            </div>

            {/* Pulsante aggiungi pasti */}
            <button
                onClick={() => setShowBulkModal(true)}
                className="w-full mb-4 py-3 flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 font-semibold rounded-2xl transition-all active:scale-[0.98]"
            >
                <Plus size={18} />
                <span>Aggiungi Pasti</span>
            </button>

            {/* Caricamento */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                /* Schede giornaliere */
                <div className="space-y-2">
                    {weekDates.map((date) => {
                        const key = formatDate(date);
                        const dayMeals = mealPlan?.[key] || { lunch: null, dinner: null };
                        const todayFlag = isToday(date);

                        return (
                            <div
                                key={key}
                                className={`rounded-2xl border transition-all ${todayFlag
                                    ? 'bg-green-500/5 border-green-500/20'
                                    : 'bg-slate-800/50 border-slate-700/30'
                                    }`}
                            >
                                {/* Header giorno */}
                                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-700/30">
                                    <span className={`text-sm font-bold ${todayFlag ? 'text-green-400' : 'text-white'}`}>
                                        {shortDayLabel(date)}
                                    </span>
                                    {todayFlag && (
                                        <span className="text-[10px] font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                                            Oggi
                                        </span>
                                    )}
                                </div>

                                {/* Slot */}
                                <div className="divide-y divide-slate-700/20">
                                    {['lunch', 'dinner'].map((slot) => {
                                        const meal = dayMeals[slot];
                                        return (
                                            <div key={slot} className="flex items-center px-4 py-2.5 min-h-[44px]">
                                                <span className="text-[11px] font-semibold text-slate-500 uppercase w-14 flex-shrink-0">
                                                    {slot === 'lunch' ? '🌤 Pranzo' : '🌙 Cena'}
                                                </span>
                                                {meal ? (
                                                    <div className="flex items-center flex-1 min-w-0 ml-2">
                                                        <span className="text-sm font-medium text-slate-200 truncate flex-1">
                                                            {meal.recipes?.name || 'Sconosciuto'}
                                                        </span>
                                                        <button
                                                            onClick={() => removeMeal.mutate(meal.id)}
                                                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
                                                            aria-label="Rimuovi pasto"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-600 italic ml-2">—</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modale assegnazione pasti */}
            {showBulkModal && (
                <BulkAssignModal
                    weekDates={weekDates}
                    onClose={() => setShowBulkModal(false)}
                />
            )}
        </div>
    );
}
