import { useState, useMemo, useEffect, useCallback } from 'react';
import { useGroceryList } from '@/hooks/useGroceryList';
import { useGroceryExtras, useAddGroceryExtra, useDeleteGroceryExtra } from '@/hooks/useGroceryExtras';
import { useGroceryChecked, useToggleGroceryChecked } from '@/hooks/useGroceryChecked';
import { useIngredients, useCreateIngredient, useUpdateIngredient, useDeleteIngredient, INGREDIENT_CATEGORIES } from '@/hooks/useIngredients';
import { getDefaultMonday, getWeekDates, prevWeek, nextWeek, formatDate, monthYearLabel } from '@/lib/dates';
import { ChevronLeft, ChevronRight, ShoppingCart, Check, Plus, Settings, Search, X, Edit2, Trash2 } from 'lucide-react';

// Ordine fisso delle categorie
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

/* ─── Toast Component ─── */
function Toast({ message, onDone }) {
    useEffect(() => {
        const t = setTimeout(onDone, 1800);
        return () => clearTimeout(t);
    }, [onDone]);

    return (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[70] animate-fade-in">
            <div className="bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2">
                <Check size={16} />
                {message}
            </div>
        </div>
    );
}

export default function GroceryPage() {
    const [monday, setMonday] = useState(() => getDefaultMonday());
    const weekDates = useMemo(() => getWeekDates(monday), [monday]);
    const weekStart = formatDate(weekDates[0]);
    const { data: groceryMap = {}, isLoading } = useGroceryList(weekDates);
    const { data: extras = [] } = useGroceryExtras(weekStart);
    const { data: checkedItems = {} } = useGroceryChecked(weekStart);
    const toggleChecked = useToggleGroceryChecked();
    const [toast, setToast] = useState(null);

    // Hidden items (recipe ingredients removed for this week, persisted in localStorage)
    const hiddenKey = `grocery_hidden_${weekStart}`;
    const [hiddenItems, setHiddenItems] = useState(() => {
        try { return JSON.parse(localStorage.getItem(hiddenKey) || '{}'); } catch { return {}; }
    });
    useEffect(() => {
        localStorage.setItem(hiddenKey, JSON.stringify(hiddenItems));
    }, [hiddenKey, hiddenItems]);
    // Reset hidden state when week changes
    useEffect(() => {
        try { setHiddenItems(JSON.parse(localStorage.getItem(hiddenKey) || '{}')); } catch { setHiddenItems({}); }
    }, [hiddenKey]);

    // Modals
    const [showManageModal, setShowManageModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const toggleItem = (id) => {
        toggleChecked.mutate({ itemKey: id, weekStart, checked: !checkedItems[id] });
    };

    const showToast = useCallback((msg) => setToast(msg), []);
    const hideToast = useCallback(() => setToast(null), []);

    const deleteExtra = useDeleteGroceryExtra();

    const handleRemoveItem = (item) => {
        if (item.isExtra) {
            deleteExtra.mutate(item.id);
        } else {
            // Hide recipe item for this week
            setHiddenItems((prev) => ({ ...prev, [item.id]: true }));
        }
    };

    // Merge recipe items + extras into one map, filtering hidden
    const mergedMap = useMemo(() => {
        const map = {};
        for (const [cat, items] of Object.entries(groceryMap)) {
            const visible = items.filter((item) => !hiddenItems[item.id]);
            if (visible.length > 0) {
                map[cat] = visible.map((item) => ({ ...item, isExtra: false }));
            }
        }
        for (const extra of extras) {
            const cat = extra.category || 'Altro';
            if (!map[cat]) map[cat] = [];
            map[cat].push(extra);
        }
        for (const cat in map) {
            map[cat].sort((a, b) => a.name.localeCompare(b.name));
        }
        return map;
    }, [groceryMap, extras, hiddenItems]);

    const categories = CATEGORY_ORDER.filter((cat) => mergedMap[cat]?.length > 0);
    const extraCategories = Object.keys(mergedMap)
        .filter((cat) => !CATEGORY_ORDER.includes(cat) && mergedMap[cat]?.length > 0)
        .sort();
    const allCategories = [...categories, ...extraCategories];

    const totalItems = allCategories.reduce((sum, cat) => sum + (mergedMap[cat]?.length || 0), 0);
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;

    return (
        <div className="max-w-lg mx-auto px-4 pt-4 pb-4 animate-fade-in">
            {/* Toast */}
            {toast && <Toast message={toast} onDone={hideToast} />}

            {/* Intestazione */}
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-extrabold text-white">Lista della Spesa</h1>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowManageModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-all"
                    >
                        <Settings size={14} />
                        <span>Gestisci</span>
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/25 font-semibold text-xs rounded-xl transition-all"
                    >
                        <Plus size={14} />
                        <span>Aggiungi</span>
                    </button>
                </div>
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
                    <p className="text-xs text-slate-500 mt-1">Assegna ricette al planner o aggiungi prodotti manualmente.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {allCategories.map((category) => (
                        <div key={category}>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="h-px flex-1 bg-slate-700/50" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    {category}
                                </span>
                                <div className="h-px flex-1 bg-slate-700/50" />
                            </div>

                            <div className="space-y-1">
                                {mergedMap[category].map((item) => {
                                    const itemKey = item.isExtra ? `extra-${item.id}` : item.id;
                                    const isChecked = checkedItems[itemKey];
                                    return (
                                        <div
                                            key={itemKey}
                                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${isChecked
                                                ? 'bg-green-500/10 border border-green-500/20'
                                                : 'bg-slate-800/60 border border-slate-700/30'
                                                }`}
                                        >
                                            {/* Checkbox */}
                                            <button
                                                onClick={() => toggleItem(itemKey)}
                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${isChecked ? 'bg-green-500 border-green-500' : 'border-slate-600'
                                                    }`}
                                            >
                                                {isChecked && <Check size={14} className="text-white" />}
                                            </button>

                                            {/* Nome */}
                                            <span className={`text-sm font-medium flex-1 transition-all ${isChecked ? 'text-slate-500 line-through' : 'text-white'
                                                }`}>
                                                {item.name}
                                                {item.isExtra && (
                                                    <span className="ml-1.5 text-[9px] font-bold text-amber-400/70 bg-amber-400/10 px-1.5 py-0.5 rounded-full align-middle">
                                                        +
                                                    </span>
                                                )}
                                            </span>

                                            {/* Rimuovi */}
                                            <button
                                                onClick={() => handleRemoveItem(item)}
                                                className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showManageModal && (
                <ManageIngredientsModal onClose={() => setShowManageModal(false)} />
            )}

            {showAddModal && (
                <AddProductModal
                    weekStart={weekStart}
                    onClose={() => setShowAddModal(false)}
                    onAdded={(name) => showToast(`"${name}" aggiunto!`)}
                />
            )}
        </div>
    );
}

/* ─── Modale Gestisci Ingredienti ─── */
function ManageIngredientsModal({ onClose }) {
    const [search, setSearch] = useState('');
    const { data: ingredients = [] } = useIngredients(search);
    const updateIngredient = useUpdateIngredient();
    const deleteIngredient = useDeleteIngredient();
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    // Lock body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const startEdit = (ing) => {
        setEditingId(ing.id);
        setEditName(ing.name);
        setEditCategory(ing.category);
        setConfirmDeleteId(null);
    };

    const saveEdit = async () => {
        if (!editName.trim()) return;
        await updateIngredient.mutateAsync({ id: editingId, name: editName.trim(), category: editCategory });
        setEditingId(null);
    };

    const handleDelete = (ing) => {
        if (confirmDeleteId === ing.id) {
            // Second tap — actually delete
            deleteIngredient.mutate(ing.id);
            setConfirmDeleteId(null);
        } else {
            // First tap — ask for confirmation
            setConfirmDeleteId(ing.id);
            setEditingId(null);
        }
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
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">Gestisci Prodotti</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="px-5 pt-4 flex-shrink-0">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Cerca prodotti..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {ingredients.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">Nessun prodotto trovato.</p>
                    ) : (
                        ingredients.map((ing) => (
                            <div key={ing.id}>
                                {editingId === ing.id ? (
                                    <div className="bg-slate-700/50 rounded-xl p-3 space-y-2">
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded-lg text-sm text-white outline-none focus:border-green-500/50"
                                            autoFocus
                                        />
                                        <select
                                            value={editCategory}
                                            onChange={(e) => setEditCategory(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded-lg text-sm text-white outline-none appearance-none"
                                        >
                                            {INGREDIENT_CATEGORIES.map((cat) => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="flex-1 py-2 bg-slate-600 text-slate-300 font-semibold text-xs rounded-lg"
                                            >
                                                Annulla
                                            </button>
                                            <button
                                                onClick={saveEdit}
                                                disabled={!editName.trim() || updateIngredient.isPending}
                                                className="flex-1 py-2 bg-green-500 disabled:bg-slate-600 text-white font-semibold text-xs rounded-lg"
                                            >
                                                {updateIngredient.isPending ? 'Salvataggio...' : 'Salva'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-3 rounded-xl hover:bg-slate-700/30 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white truncate">{ing.name}</p>
                                            <p className="text-[10px] text-slate-500 font-medium">{ing.category}</p>
                                        </div>
                                        <button
                                            onClick={() => startEdit(ing)}
                                            className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(ing)}
                                            className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${confirmDeleteId === ing.id
                                                ? 'bg-red-500/20 text-red-400'
                                                : 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                                                }`}
                                        >
                                            <Trash2 size={14} />
                                            {confirmDeleteId === ing.id && (
                                                <span className="text-[10px] font-bold">Elimina?</span>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Modale Aggiungi Prodotto ─── */
function AddProductModal({ weekStart, onClose, onAdded }) {
    const [search, setSearch] = useState('');
    const { data: ingredients = [] } = useIngredients(search);
    const addExtra = useAddGroceryExtra();
    const createIngredient = useCreateIngredient();

    const [showCreate, setShowCreate] = useState(false);
    const [newName, setNewName] = useState('');
    const [newCategory, setNewCategory] = useState('Utilities home');

    // Lock body scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleAdd = async (ing) => {
        await addExtra.mutateAsync({ ingredientId: ing.id, weekStart });
        onAdded(ing.name);
    };

    const handleCreate = async () => {
        if (!newName.trim()) return;
        const newIng = await createIngredient.mutateAsync({ name: newName.trim(), category: newCategory });
        await addExtra.mutateAsync({ ingredientId: newIng.id, weekStart });
        onAdded(newName.trim());
        setShowCreate(false);
        setNewName('');
        setNewCategory('Utilities home');
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
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/50 flex-shrink-0">
                    <h2 className="text-lg font-bold text-white">Aggiungi alla Spesa</h2>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-700 transition-colors">
                        <X size={18} className="text-slate-400" />
                    </button>
                </div>

                <div className="px-5 pt-4 flex-shrink-0">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Cerca prodotti..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setShowCreate(false); }}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {(() => {
                        // Group ingredients by category
                        const grouped = {};
                        for (const ing of ingredients) {
                            const cat = ing.category || 'Altro';
                            if (!grouped[cat]) grouped[cat] = [];
                            grouped[cat].push(ing);
                        }
                        const orderedCats = CATEGORY_ORDER.filter(c => grouped[c]);
                        const extraCats = Object.keys(grouped).filter(c => !CATEGORY_ORDER.includes(c)).sort();
                        const allCats = [...orderedCats, ...extraCats];

                        if (allCats.length === 0 && !search) {
                            return <p className="text-sm text-slate-500 text-center py-8">Cerca un prodotto o creane uno nuovo.</p>;
                        }

                        return allCats.map(cat => (
                            <div key={cat} className="mb-2">
                                <div className="flex items-center gap-2 mb-1.5 mt-2">
                                    <div className="h-px flex-1 bg-slate-700/50" />
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{cat}</span>
                                    <div className="h-px flex-1 bg-slate-700/50" />
                                </div>
                                {grouped[cat].map(ing => (
                                    <button
                                        key={ing.id}
                                        onClick={() => handleAdd(ing)}
                                        disabled={addExtra.isPending}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-700/50 transition-colors active:scale-[0.99]"
                                    >
                                        <div className="w-7 h-7 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <Plus size={13} className="text-green-400" />
                                        </div>
                                        <p className="text-sm font-medium text-white truncate">{ing.name}</p>
                                    </button>
                                ))}
                            </div>
                        ));
                    })()}

                    {search.length > 0 && (
                        <button
                            onClick={() => { setNewName(search); setShowCreate(true); }}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-green-500/10 transition-colors border border-dashed border-green-500/30 mt-2"
                        >
                            <div className="w-8 h-8 bg-green-500/15 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Plus size={14} className="text-green-400" />
                            </div>
                            <span className="text-sm font-medium text-green-400">
                                Crea &quot;{search}&quot; e aggiungi
                            </span>
                        </button>
                    )}
                </div>

                {showCreate && (
                    <div className="px-5 py-4 border-t border-slate-700/50 flex-shrink-0 space-y-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase">Nuovo Prodotto</p>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white outline-none focus:border-green-500/50"
                            placeholder="Nome prodotto"
                        />
                        <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full px-3 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white outline-none appearance-none"
                        >
                            {INGREDIENT_CATEGORIES.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCreate(false)}
                                className="flex-1 py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-xl"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={!newName.trim() || createIngredient.isPending || addExtra.isPending}
                                className="flex-1 py-2.5 bg-green-500 disabled:bg-slate-700 text-white font-semibold rounded-xl active:scale-95"
                            >
                                {createIngredient.isPending ? 'Creazione...' : 'Crea e Aggiungi'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
