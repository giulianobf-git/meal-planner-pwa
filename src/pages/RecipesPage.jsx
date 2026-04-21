import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes, useDeleteRecipe } from '@/hooks/useRecipes';
import { Plus, Search, ChefHat, Trash2, Edit2 } from 'lucide-react';
import LinkifyText from '@/components/LinkifyText';

export default function RecipesPage() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const { data: recipes = [], isLoading } = useRecipes(search);
    const deleteRecipe = useDeleteRecipe();

    const handleDelete = (e, id) => {
        e.stopPropagation();
        if (window.confirm('Eliminare questa ricetta?')) {
            deleteRecipe.mutate(id);
        }
    };

    return (
        <div className="max-w-lg mx-auto px-4 pt-4 pb-4 animate-fade-in">
            <div className="flex items-center justify-between mb-5">
                <h1 className="text-xl font-extrabold text-white">Ricette</h1>
                <button
                    onClick={() => navigate('/recipes/new')}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-green-500 text-white font-semibold text-sm rounded-xl transition-all active:scale-95 shadow-lg shadow-green-500/20"
                >
                    <Plus size={16} />
                    <span>Nuova</span>
                </button>
            </div>

            {/* Cerca */}
            <div className="relative mb-4">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                    type="text"
                    placeholder="Cerca per nome o ingrediente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700/50 rounded-2xl text-sm text-white placeholder-slate-500 outline-none focus:border-green-500/50 transition-colors"
                />
            </div>

            {/* Caricamento */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : recipes.length === 0 ? (
                <div className="text-center py-16">
                    <ChefHat size={48} className="mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">
                        {search ? 'Nessuna ricetta trovata.' : 'Nessuna ricetta. Crea la prima!'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {recipes.map((recipe) => (
                        <div
                            key={recipe.id}
                            onClick={() => navigate(`/recipes/${recipe.id}/edit`)}
                            className="flex items-center gap-3 p-4 bg-slate-800/60 border border-slate-700/30 rounded-2xl hover:bg-slate-800 transition-all cursor-pointer group active:scale-[0.99]"
                        >
                            <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <ChefHat size={18} className="text-green-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{recipe.name}</p>
                                {recipe.instructions && (
                                    <p className="text-xs text-slate-500 truncate mt-0.5">
                                        <LinkifyText text={recipe.instructions} />
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); navigate(`/recipes/${recipe.id}/edit`); }}
                                    className="p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                    aria-label="Modifica ricetta"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(e, recipe.id)}
                                    className="p-2 rounded-lg hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                                    aria-label="Elimina ricetta"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
