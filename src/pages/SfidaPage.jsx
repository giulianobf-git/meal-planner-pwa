import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDailyChecks, useUpsertCheck, getCheckForDay, computeDayPoints, computeWeekPoints } from '@/hooks/useDailyChecks';
import { useWeeklyResults, useFinalizeWeek, shouldFinalizeWeek, getCurrentMonday, getWeekDatesFromMonday, toLocalDateStr } from '@/hooks/useWeeklyResults';
import { ArrowLeft, Trophy, Dumbbell, UtensilsCrossed, ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_LABELS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const SNACK_OPTIONS = [
    { value: 'none', label: 'No sgarro', pts: 0, color: 'text-green-400 bg-green-500/15 border-green-500/30' },
    { value: 'sgarro', label: 'Sgarro', pts: -1, color: 'text-amber-400 bg-amber-500/15 border-amber-500/30' },
    { value: 'sgarro_extra', label: 'Sgarro extra', pts: -2, color: 'text-red-400 bg-red-500/15 border-red-500/30' },
];

function WinnerBanner({ result }) {
    if (!result) return null;
    const isDraw = result.winner === 'Pareggio';
    return (
        <div className={`rounded-2xl p-4 mb-4 border text-center ${isDraw
            ? 'bg-slate-700/50 border-slate-600/50'
            : 'bg-amber-500/10 border-amber-500/30'
            }`}>
            <div className="text-3xl mb-1">{isDraw ? '🤝' : '🏆'}</div>
            <p className="text-lg font-extrabold text-white">
                {isDraw ? 'Pareggio!' : `${result.winner} vince!`}
            </p>
            <p className="text-sm text-slate-400 mt-1">
                G: {result.g_points} pts — L: {result.l_points} pts
            </p>
        </div>
    );
}

function DayCard({ date, dayLabel, checks, onToggle, isFinalized, isToday }) {
    const gCheck = getCheckForDay(checks, date, 'G');
    const lCheck = getCheckForDay(checks, date, 'L');
    const gPts = computeDayPoints(gCheck);
    const lPts = computeDayPoints(lCheck);

    const toggleField = (user, field, currentVal) => {
        if (isFinalized) return;
        const check = getCheckForDay(checks, date, user);
        onToggle({ ...check, date, user_name: user, [field]: typeof currentVal === 'boolean' ? !currentVal : currentVal });
    };

    const MealRow = ({ user, check, pts }) => (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${user === 'G' ? 'text-blue-400' : 'text-pink-400'}`}>{user}</span>
                <span className="text-[10px] font-bold text-slate-400">{pts} pts</span>
            </div>
            {/* Meal toggles */}
            <div className="flex gap-1.5">
                {[
                    { key: 'breakfast', label: '🍳' },
                    { key: 'lunch', label: '🍝' },
                    { key: 'dinner', label: '🍽️' },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => toggleField(user, key, check[key])}
                        disabled={isFinalized}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border ${check[key]
                            ? 'bg-green-500/20 border-green-500/40 text-green-400'
                            : 'bg-slate-700/40 border-slate-600/30 text-slate-500'
                            } ${isFinalized ? 'opacity-60' : 'active:scale-95'}`}
                    >
                        {label}
                    </button>
                ))}
            </div>
            {/* Gym toggle */}
            <button
                onClick={() => toggleField(user, 'trained', check.trained)}
                disabled={isFinalized}
                className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 ${check.trained
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-400'
                    : 'bg-slate-700/40 border-slate-600/30 text-slate-500'
                    } ${isFinalized ? 'opacity-60' : 'active:scale-95'}`}
            >
                <Dumbbell size={12} /> Gym
            </button>
            {/* Snack selector */}
            <div className="flex gap-1">
                {SNACK_OPTIONS.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => toggleField(user, 'snack_level', opt.value)}
                        disabled={isFinalized}
                        className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all border ${check.snack_level === opt.value
                            ? opt.color
                            : 'bg-slate-700/40 border-slate-600/30 text-slate-500'
                            } ${isFinalized ? 'opacity-60' : 'active:scale-95'}`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <div className={`bg-slate-800/60 border rounded-2xl p-3 ${isToday
            ? 'border-green-500/50 ring-1 ring-green-500/20'
            : 'border-slate-600/50'
            }`}>
            <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-bold ${isToday ? 'text-green-400' : 'text-slate-300'}`}>
                    {dayLabel} {date.slice(8)}
                </span>
                {isToday && <span className="text-[9px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full font-bold">OGGI</span>}
            </div>
            <div className="space-y-3">
                <MealRow user="G" check={gCheck} pts={gPts} />
                <div className="border-t border-slate-700/50" />
                <MealRow user="L" check={lCheck} pts={lPts} />
            </div>
        </div>
    );
}

function HistoryItem({ result }) {
    const weekEnd = new Date(result.week_start + 'T00:00:00');
    weekEnd.setDate(weekEnd.getDate() + 6);
    const formatShort = (d) => `${d.getDate()}/${d.getMonth() + 1}`;
    const start = new Date(result.week_start + 'T00:00:00');
    const isDraw = result.winner === 'Pareggio';

    return (
        <div className="flex items-center justify-between bg-slate-800/60 border border-slate-600/50 rounded-xl px-4 py-3">
            <div>
                <p className="text-xs text-slate-400">{formatShort(start)} – {formatShort(weekEnd)}</p>
                <p className="text-sm font-bold text-white mt-0.5">
                    G: {result.g_points} — L: {result.l_points}
                </p>
            </div>
            <div className="flex items-center gap-1.5">
                {isDraw ? (
                    <span className="text-xs font-bold text-slate-400">🤝 Pari</span>
                ) : (
                    <>
                        <Trophy size={14} className="text-amber-400" />
                        <span className="text-sm font-extrabold text-amber-400">{result.winner}</span>
                    </>
                )}
            </div>
        </div>
    );
}

export default function SfidaPage() {
    const navigate = useNavigate();
    const [mondayStr, setMondayStr] = useState(() => getCurrentMonday());
    const weekDates = useMemo(() => getWeekDatesFromMonday(mondayStr), [mondayStr]);
    const { data: checks = [], isLoading: checksLoading } = useDailyChecks(weekDates);
    const { data: results = [], isLoading: resultsLoading } = useWeeklyResults();
    const upsertCheck = useUpsertCheck();
    const finalizeWeek = useFinalizeWeek();

    const currentMonday = getCurrentMonday();
    const isCurrentWeek = mondayStr === currentMonday;
    const weekResult = results.find((r) => r.week_start === mondayStr);
    const isFinalized = Boolean(weekResult);

    const points = useMemo(() => computeWeekPoints(checks), [checks]);
    const todayStr = toLocalDateStr(new Date());

    // Auto-finalize ONLY the current week after Sunday 6PM
    useEffect(() => {
        if (!checksLoading && !resultsLoading && !isFinalized && isCurrentWeek && shouldFinalizeWeek(mondayStr)) {
            if (checks.length > 0) {
                const pts = computeWeekPoints(checks);
                finalizeWeek.mutate({ week_start: mondayStr, g_points: pts.G, l_points: pts.L });
            }
        }
    }, [checksLoading, resultsLoading, isFinalized, isCurrentWeek, mondayStr, checks]);

    const handleToggle = (check) => {
        upsertCheck.mutate(check);
    };

    const prevWeek = () => {
        const d = new Date(mondayStr + 'T00:00:00');
        d.setDate(d.getDate() - 7);
        setMondayStr(toLocalDateStr(d));
    };

    const nextWeek = () => {
        const d = new Date(mondayStr + 'T00:00:00');
        d.setDate(d.getDate() + 7);
        setMondayStr(toLocalDateStr(d));
    };

    // Stats
    const gWins = results.filter((r) => r.winner === 'G').length;
    const lWins = results.filter((r) => r.winner === 'L').length;

    return (
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex items-center gap-2">
                    <Trophy size={22} className="text-amber-400" />
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Sfida</h1>
                </div>
            </div>

            {/* Overall score */}
            {results.length > 0 && (
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-center">
                        <p className="text-2xl font-extrabold text-blue-400">{gWins}</p>
                        <p className="text-[10px] font-bold text-blue-400/70 uppercase">Vittorie G</p>
                    </div>
                    <div className="flex-1 bg-pink-500/10 border border-pink-500/30 rounded-xl p-3 text-center">
                        <p className="text-2xl font-extrabold text-pink-400">{lWins}</p>
                        <p className="text-[10px] font-bold text-pink-400/70 uppercase">Vittorie L</p>
                    </div>
                </div>
            )}

            {/* Week navigation */}
            <div className="flex items-center justify-between mb-4 bg-slate-800 rounded-2xl px-4 py-3">
                <button onClick={prevWeek} className="p-2 rounded-xl hover:bg-slate-700 active:bg-slate-600 transition-colors">
                    <ChevronLeft size={20} className="text-slate-300" />
                </button>
                <div className="text-center">
                    <p className="text-sm font-bold text-white">Settimana</p>
                    <p className="text-[11px] text-slate-400 font-medium">
                        {weekDates[0]?.slice(8)}/{parseInt(weekDates[0]?.slice(5, 7))} – {weekDates[6]?.slice(8)}/{parseInt(weekDates[6]?.slice(5, 7))}
                    </p>
                </div>
                <button onClick={nextWeek} className="p-2 rounded-xl hover:bg-slate-700 active:bg-slate-600 transition-colors">
                    <ChevronRight size={20} className="text-slate-300" />
                </button>
            </div>

            {/* Points bar */}
            <div className="flex items-center gap-3 mb-4 bg-slate-800/60 border border-slate-600/50 rounded-xl p-3">
                <div className="flex-1 text-center">
                    <span className="text-lg font-extrabold text-blue-400">{points.G}</span>
                    <span className="text-[10px] text-blue-400/70 ml-1">pts G</span>
                </div>
                <div className="text-slate-600 font-bold">vs</div>
                <div className="flex-1 text-center">
                    <span className="text-lg font-extrabold text-pink-400">{points.L}</span>
                    <span className="text-[10px] text-pink-400/70 ml-1">pts L</span>
                </div>
            </div>

            {/* Winner banner (if finalized) */}
            {isFinalized && <WinnerBanner result={weekResult} />}

            {/* Loading */}
            {checksLoading && (
                <div className="flex justify-center py-8">
                    <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Day cards */}
            {!checksLoading && (
                <div className="space-y-3">
                    {weekDates.map((date, i) => (
                        <DayCard
                            key={date}
                            date={date}
                            dayLabel={DAY_LABELS[i]}
                            checks={checks}
                            onToggle={handleToggle}
                            isFinalized={isFinalized}
                            isToday={date === todayStr}
                        />
                    ))}
                </div>
            )}

            {/* History */}
            {results.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Storico</h2>
                    <div className="space-y-2">
                        {results.map((r) => (
                            <HistoryItem key={r.id} result={r} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
