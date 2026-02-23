import { Outlet, NavLink } from 'react-router-dom';
import { CalendarDays, ChefHat, ShoppingCart, Wallet } from 'lucide-react';

const navItems = [
    { to: '/', icon: CalendarDays, label: 'Planner' },
    { to: '/recipes', icon: ChefHat, label: 'Ricette' },
    { to: '/grocery', icon: ShoppingCart, label: 'Spesa' },
    { to: '/conti', icon: Wallet, label: 'Conti' },
];

export default function Layout() {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            {/* Contenuto principale */}
            <main className="flex-1 pb-safe overflow-auto">
                <Outlet />
            </main>

            {/* Nav fissa in basso */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-lg border-t border-slate-700/50"
                style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
            >
                <div className="flex items-center justify-around max-w-lg mx-auto h-16">
                    {navItems.map(({ to, icon: Icon, label }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={to === '/'}
                            className={({ isActive }) =>
                                `flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-all duration-200 min-w-[64px] ${isActive
                                    ? 'text-green-400'
                                    : 'text-slate-400 active:text-slate-200'
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-green-500/15' : ''}`}>
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                    <span className={`text-[10px] font-semibold ${isActive ? 'text-green-400' : ''}`}>
                                        {label}
                                    </span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
}
