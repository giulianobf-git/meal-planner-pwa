import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecipeDetail, useCreateRecipe, useUpdateRecipe } from '@/hooks/useRecipes';
import { useIngredients, useCreateIngredient, INGREDIENT_CATEGORIES } from '@/hooks/useIngredients';
import { ArrowLeft, Plus, X, Search, Check } from 'lucide-react';

export default function RecipeFormPage() {
    const navigate = useNavigate();
    const { id: editId } = useParams();
    const isEditing = Boolean(editId);

    const { data: existingRecipe } = useRecipeDetail(editId);
    const createRecipe = useCreateRecipe();
    const updateRecipe = useUpdateRecipe();

    const [name, setName] = useState('');
    const [instructions, setInstructions] = useState('');
    const [selectedIngredients, setSelectedIngredients] = useState([]);

    // Popola il form in modalità modifica
    useEffect(() => {
        if (existingRecipe) {
            setName(existingRecipe.name || '');
            setInstructions(existingRecipe.instructions || '');
            setSelectedIngredients(
                (existingRecipe.recipe_ingredients || []).map((ri) => ({
                    ingredientId: ri.ingredients.id,
                    name: ri.ingredients.name,
                    category: ri.ingredients.category,
                    quantity: ri.quantity || '',
                }))
            );
        }
    }, [existingRecipe]);

    // Ricerca ingredienti
    const [ingredientSearch, setIngredientSearch] = useState('');
    const { data: searchResults = [] } = useIngredients(ingredientSearch);
    const [showIngredientDropdown, setShowIngredientDropdown] = useState(false);

    // Modale nuovo ingrediente
    const [showNewIngredientModal, setShowNewIngredientModal] = useState(false);
    const [newIngName, setNewIngName] = useState('');
    const [newIngCategory, setNewIngCategory] = useState('Frutta e verdura');
    const createIngredient = useCreateIngredient();

    const addIngredient = (ing) => {
        if (selectedIngredients.find((s) => s.ingredientId === ing.id)) return;
        setSelectedIngredients((prev) => [
            ...prev,
            { ingredientId: ing.id, name: ing.name, category: ing.category, quantity: '' },
        ]);
        setIngredientSearch('');
        setShowIngredientDropdown(false);
    };

    const removeIngredient = (index) => {
        setSelectedIngredients((prev) => prev.filter((_, i) => i !== index));
    };

    const updateQuantity = (index, qty) => {
        setSelectedIngredients((prev) =>
            prev.map((item, i) => (i === index ? { ...item, quantity: qty } : item))
        );
    };

    const handleCreateNewIngredient = async () => {
        if (!newIngName.trim()) return;
        const newIng = await createIngredient.mutateAsync({ name: newIngName.trim(), category: newIngCategory });
        addIngredient(newIng);
        setShowNewIngredientModal(false);
        setNewIngName('');
        setNewIngCategory('Frutta e verdura');
    };

    const handleSubmit = async () => {
        if (!name.trim()) return;
        const payload = {
            name: name.trim(),
            instructions: instructions.trim(),
            ingredients: selectedIngredients.map((s) => ({
                ingredientId: s.ingredientId,
                quantity: s.quantity,
            })),
        };

        if (isEditing) {
            await updateRecipe.mutateAsync({ id: editId, ...payload });
        } else {
            await createRecipe.mutateAsync(payload);
        }
        navigate('/recipes');
    };

    const isSaving = createRecipe.isPending || updateRecipe.isPending;

    // Filtra ingredienti già selezionati
    const filteredResults = searchResults.filter(
        (ing) => !selectedIngredients.find((s) => s.ingredientId === ing.id)
    );

    return (
        <div className="max-w-lg mx-auto px-4 pt-4 pb-4 animate-fade-in">
            {/* Intestazione */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => navigate('/recipes')}
                    className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={18} />
                </button>
                <h1 className="text-xl font-extrabold text-white">
                    {isEditing ? 'Modifica Ricetta' : 'Nuova Ricetta'}
                </h1>
            </div>

            <div className="space-y-5">
                {/* Nome */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Nome Ricetta
                    </label>
                    <input
                        type="text"
                        placeholder="es. Insalata di pollo"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700/50 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50 transition-colors"
                    />
                </div>

                {/* Istruzioni */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Istruzioni (opzionale)
                    </label>
                    <textarea
                        placeholder="Come preparare..."
                        value={instructions}
                        onChange={(e) => setInstructions(e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-slate-800 border border-slate-700/50 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50 transition-colors resize-none"
                    />
                </div>

                {/* Ingredienti */}
                <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 block">
                        Ingredienti
                    </label>

                    {/* Input di ricerca */}
                    <div className="relative mb-3">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Cerca ingredienti..."
                            value={ingredientSearch}
                            onChange={(e) => {
                                setIngredientSearch(e.target.value);
                                setShowIngredientDropdown(true);
                            }}
                            onFocus={() => setShowIngredientDropdown(true)}
                            className="w-full pl-9 pr-4 py-2.5 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50"
                        />

                        {/* Dropdown */}
                        {showIngredientDropdown && ingredientSearch.length > 0 && (
                            <div className="absolute top-full mt-1 left-0 right-0 z-20 bg-slate-700 border border-slate-600 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                                {filteredResults.map((ing) => (
                                    <button
                                        key={ing.id}
                                        onClick={() => addIngredient(ing)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-600/50 text-left transition-colors"
                                    >
                                        <span className="text-sm text-white">{ing.name}</span>
                                        <span className="text-[10px] text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded-full">{ing.category}</span>
                                    </button>
                                ))}
                                {/* Opzione crea nuovo */}
                                <button
                                    onClick={() => {
                                        setNewIngName(ingredientSearch);
                                        setShowNewIngredientModal(true);
                                        setShowIngredientDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-green-500/10 text-left transition-colors border-t border-slate-600/50"
                                >
                                    <Plus size={14} className="text-green-400" />
                                    <span className="text-sm text-green-400 font-medium">
                                        Crea &quot;{ingredientSearch}&quot;
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Chiudi dropdown cliccando fuori */}
                    {showIngredientDropdown && (
                        <div className="fixed inset-0 z-10" onClick={() => setShowIngredientDropdown(false)} />
                    )}

                    {/* Lista ingredienti selezionati */}
                    {selectedIngredients.length > 0 && (
                        <div className="space-y-1.5">
                            {selectedIngredients.map((ing, index) => (
                                <div key={ing.ingredientId} className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/30 rounded-xl px-3 py-2">
                                    <span className="text-sm text-slate-300 flex-1 truncate">{ing.name}</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        placeholder="Qtà (es. 2, 200g)"
                                        value={ing.quantity}
                                        onChange={(e) => updateQuantity(index, e.target.value)}
                                        className="w-28 px-2 py-1.5 bg-slate-700/50 border border-slate-600/50 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-green-500/50"
                                    />
                                    <button
                                        onClick={() => removeIngredient(index)}
                                        className="p-1 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pulsante Salva */}
                <button
                    onClick={handleSubmit}
                    disabled={!name.trim() || isSaving}
                    className="w-full py-3.5 bg-green-500 disabled:bg-slate-700 text-white disabled:text-slate-500 font-bold rounded-2xl transition-all active:scale-[0.98]"
                >
                    {isSaving ? 'Salvataggio...' : isEditing ? 'Salva Modifiche' : 'Crea Ricetta'}
                </button>
            </div>

            {/* Modale Nuovo Ingrediente */}
            {showNewIngredientModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNewIngredientModal(false)} />
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
                                onClick={() => setShowNewIngredientModal(false)}
                                className="flex-1 py-2.5 bg-slate-700 text-slate-300 font-semibold rounded-xl transition-all"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleCreateNewIngredient}
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
