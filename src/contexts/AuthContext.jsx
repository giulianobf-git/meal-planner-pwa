import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const PLAYERS = {
    g: { id: 'g', name: 'G' },
    l: { id: 'l', name: 'L' },
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [authChecked, setAuthChecked] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('meal_current_user');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (PLAYERS[parsed.id]) {
                    setCurrentUser(PLAYERS[parsed.id]);
                }
            } catch { /* ignore */ }
        }
        setAuthChecked(true);
    }, []);

    const login = async (userId, pin) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('user_id, display_name, pin')
                .eq('user_id', userId)
                .single();

            if (error || !data || data.pin !== pin) {
                // Offline fallback
                const pins = { g: '2610', l: '0803' };
                if (pins[userId] !== pin) return false;
                const user = PLAYERS[userId];
                setCurrentUser(user);
                localStorage.setItem('meal_current_user', JSON.stringify(user));
                return true;
            }

            const user = { id: data.user_id, name: data.display_name };
            setCurrentUser(user);
            localStorage.setItem('meal_current_user', JSON.stringify(user));
            return true;
        } catch {
            // Offline fallback
            const pins = { g: '2610', l: '0803' };
            if (pins[userId] !== pin) return false;
            const user = PLAYERS[userId];
            setCurrentUser(user);
            localStorage.setItem('meal_current_user', JSON.stringify(user));
            return true;
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('meal_current_user');
    };

    return (
        <AuthContext.Provider value={{ currentUser, authChecked, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
