import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Lock, ArrowRight, AlertCircle, UtensilsCrossed } from 'lucide-react';

const PLAYERS = [
    { id: 'g', name: 'G', emoji: '👨‍🍳', gradient: 'from-green-500 to-emerald-600' },
    { id: 'l', name: 'L', emoji: '👩‍🍳', gradient: 'from-violet-500 to-purple-600' },
];

export default function LoginPage() {
    const { login, currentUser } = useAuth();
    const navigate = useNavigate();
    const [selectedUser, setSelectedUser] = useState(null);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(false);

    // If already logged in, redirect
    if (currentUser) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async () => {
        if (!selectedUser || pin.length !== 4) return;
        setChecking(true);
        setError('');
        try {
            const success = await login(selectedUser.id, pin);
            if (success) {
                navigate('/', { replace: true });
            } else {
                setError('Wrong PIN. Try again.');
                setPin('');
            }
        } catch {
            setError('Connection error.');
        } finally {
            setChecking(false);
        }
    };

    const handlePinChange = (val) => {
        const digits = val.replace(/\D/g, '').slice(0, 4);
        setPin(digits);
        setError('');
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-5">
            {/* Logo */}
            <div className="mb-10 text-center animate-fade-in">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/25">
                    <UtensilsCrossed className="text-white" size={28} />
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">Meal Planner</h1>
                <p className="text-sm text-slate-400 font-medium mt-1">Who&apos;s cooking?</p>
            </div>

            {/* Player Selection */}
            {!selectedUser ? (
                <div className="w-full max-w-sm space-y-3 animate-slide-up">
                    {PLAYERS.map((player) => (
                        <button
                            key={player.id}
                            onClick={() => setSelectedUser(player)}
                            className="w-full flex items-center gap-4 p-5 bg-slate-800 border border-slate-700/50 hover:border-green-500/30 rounded-2xl transition-all active:scale-[0.98] text-left group"
                        >
                            <div className={`w-14 h-14 bg-gradient-to-br ${player.gradient} rounded-xl flex items-center justify-center text-2xl shadow-lg`}>
                                {player.emoji}
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-lg text-white">{player.name}</p>
                                <p className="text-xs text-slate-400 font-medium">Tap to sign in</p>
                            </div>
                            <ArrowRight size={20} className="text-slate-500 group-hover:text-green-400 transition-colors" />
                        </button>
                    ))}
                </div>
            ) : (
                <div className="w-full max-w-sm animate-slide-up">
                    {/* Selected player */}
                    <div className="text-center mb-8">
                        <div className={`w-20 h-20 bg-gradient-to-br ${selectedUser.gradient} rounded-2xl flex items-center justify-center text-4xl mx-auto mb-3 shadow-xl`}>
                            {selectedUser.emoji}
                        </div>
                        <p className="font-bold text-xl text-white">Hey, {selectedUser.name}!</p>
                    </div>

                    {/* PIN input */}
                    <div className="space-y-4">
                        <div className="relative">
                            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={4}
                                autoFocus
                                className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 focus:border-green-500 rounded-2xl outline-none font-mono text-xl tracking-[0.5em] text-center text-white placeholder-slate-500"
                                placeholder="• • • •"
                                value={pin}
                                onChange={(e) => handlePinChange(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-sm font-semibold px-1">
                                <AlertCircle size={14} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSubmit}
                            disabled={pin.length !== 4 || checking}
                            className="w-full py-4 bg-green-500 disabled:bg-slate-700 text-white disabled:text-slate-500 font-bold rounded-2xl transition-all active:scale-95"
                        >
                            {checking ? 'Checking...' : 'Enter'}
                        </button>

                        <button
                            onClick={() => { setSelectedUser(null); setPin(''); setError(''); }}
                            className="w-full text-center text-sm text-slate-400 font-semibold py-2 hover:text-slate-200 transition-colors"
                        >
                            ← Switch user
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
