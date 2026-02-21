import { useState, useMemo } from 'react';
import { useGroceryList } from '@/hooks/useGroceryList';
import { getDefaultMonday, getWeekDates, prevWeek, nextWeek, formatDate, monthYearLabel } from '@/lib/dates';
import { ChevronLeft, ChevronRight, ShoppingCart, Check, Plus } from 'lucide-react';
import { useCreateIngredient, INGREDIENT_CATEGORIES } from '@/hooks/useIngredients';

// Ordine fisso delle categorie nella lista della spesa
const CATEGORY_ORDER = [
    'Frutta e verdura',
    'Semi e frutta secca',
    'Legumi e cereali',
    'Dispensa salata',
    'Latte e derivati',
    'Banco frigo',
    'Carne e pesce',
    'Dispensa dolce',
    'Surgelati',
    'Snack',
    'Utilities home',
    'Utilities persona',
];

export default function GroceryPage() {
    const [monday, setMonday] = useState(() => getDefaultMonday());
    const weekDates = useMemo(() => getWeekDates(monday), [monday]);
    const { data: groceryMap = {}, isLoading } = useGroceryList(weekDates);
    const [checkedItems, setCheckedItems] = useState({});

    // Crea ingrediente al volo dalla vista spesa
    const [showNewIngModal, setShowNewIngModal] = useState(false);
    const [newIngName, setNewIngName] = useState('');
    const [newIngCategory, setNewIngCategory] = useState('Frutta e verdura');
    const createIngredient = useCreateIngredient();

    const toggleItem = (id) => {
        setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    // Ordina le categorie secondo l'ordine fisso
    const categories = CATEGORY_ORDER.filter((cat) => groceryMap[cat]?.length > 0);
    // Aggiungi eventuali categorie non previste nell'ordine
    const extraCategories = Object.keys(groceryMap)
        .filter((cat) => !CATEGORY_ORDER.includes(cat) && groceryMap[cat]?.length > 0)
        .sort();
    const allCategories = [...categories, ...extraCategories];

    const totalItems = allCategories.reduce((sum, cat) => sum + (groceryMap[cat]?.length || 0), 0);
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;

    const handleCreateIngredient = async () => {
        if (!newIngName.trim()) return;
        await createIngredient.mutateAsync({ name: newIngName.trim(), category: newIngCategory });
        setShowNewIngModal(false);
        setNewIngName('');
        setNewIngCategory('Frutta e verdura');
    };

    return (
        <div className="max-w-lg mx-auto px-4 pt-4 pb-4 animate-fade-in">
            {/* Intestazione */}
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-extrabold text-white">Lista della Spesa</h1>
                <button
                    onClick={() => setShowNewIngModal(true)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all"
                >
                    <Plus size={14} />
                    <span>Ingrediente</span>
                </button>
            </div>

            {/* Navigazione settimana */}
            <div className="flex items-center justify-between mb-4 bg-slate-800 rounded-2xl px-4 py-3">
                <button
                    onClick={() => { setMonday(prevWeek(monday)); setCheckedItems({}); }}
                    className="p-2 rounded-xl hover:bg-slate-700 active:bg-slate-600 transition-colors"
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
                    onClick={() => { setMonday(nextWeek(monday)); setCheckedItems({}); }}
                    className="p-2 rounded-xl hover:bg-slate-700 active:bg-slate-600 transition-colors"
                >
                    <ChevronRight size={20} className="text-slate-300" />
                </button>
            </div>

            {/* Progresso */}
            {totalItems > 0 && (
                <div className="mb-4 bg-slate-800 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-slate-400">Progresso Spesa</span>
                        <span className="text-xs font-bold text-green-400">{checkedCount}/{totalItems}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${totalItems > 0 ? (checkedCount / totalItems) * 100 : 0}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Caricamento */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : totalItems === 0 ? (
                <div className="text-center py-16">
                    <ShoppingCart size={48} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">Nessun articolo.</p>
                    <p className="text-xs text-slate-500 mt-1">Assegna ricette al planner per generare la lista.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {allCategories.map((category) => (
                        <div key={category}>
                            {/* Header categoria */}
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-px flex-1 bg-slate-700/50" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {category}
                                </span>
                                <div className="h-px flex-1 bg-slate-700/50" />
                            </div>

                            {/* Articoli */}
                            <div className="space-y-1">
                                {groceryMap[category].map((item) => {
                                    const isChecked = checkedItems[item.id];
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => toggleItem(item.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-[0.99] ${isChecked
                                                ? 'bg-green-500/10 border border-green-500/20'
                                                : 'bg-slate-800/60 border border-slate-700/30 hover:bg-slate-800'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-green-500 border-green-500' : 'border-slate-600'
                                                }`}>
                                                {isChecked && <Check size={14} className="text-white" />}
                                            </div>

                                            {/* Nome */}
                                            <span className={`text-sm font-medium flex-1 transition-all ${isChecked ? 'text-slate-500 line-through' : 'text-white'
                                                }`}>
                                                {item.name}
                                            </span>

                                            {/* Quantità */}
                                            {item.totalQuantity && (
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${isChecked
                                                    ? 'bg-slate-700/50 text-slate-500'
                                                    : 'bg-slate-700 text-slate-300'
                                                    }`}>
                                                    {item.totalQuantity}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modale Nuovo Ingrediente */}
            {showNewIngModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewIngModal(false)} />
                    <div className="relative w-full max-w-sm mx-4 bg-slate-800 rounded-3xl p-5 animate-scale-in">
                        <h3 className="text-lg font-bold text-white mb-4">Nuovo Ingrediente</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-semibold text-slate-400 mb-1 block">Nome</label>
                                <input
                                    type="text"
                                    value={newIngName}
                                    onChange={(e) => setNewIngName(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white outline-none focus:border-green-500/50"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-slate-400 mb-1 block">Categoria</label>
                                <select
                                    value={newIngCategory}
                                    onChange={(e) => setNewIngCategory(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white outline-none focus:border-green-500/50 appearance-none"
                                >
                                    {INGREDIENT_CATEGORIES.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-5">
                            <button
                                onClick={() => setShowNewIngModal(false)}
                                className="flex-1 py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleCreateIngredient}
                                disabled={!newIngName.trim() || createIngredient.isPending}
                                className="flex-1 py-2.5 bg-green-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-all active:scale-95"
                            >
                                {createIngredient.isPending ? 'Creazione...' : 'Crea'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
