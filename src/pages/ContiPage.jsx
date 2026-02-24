import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject, useDeleteProject, useToggleArchiveProject } from '@/hooks/useProjects';
import { useExpenses, computeBalances } from '@/hooks/useExpenses';
import { Wallet, Plus, Trash2, ChevronRight, FolderOpen, Archive, ChevronDown } from 'lucide-react';

/* Small helper: fetch expenses for a single project card */
function ProjectCard({ project, onClick }) {
    const { data: expenses = [] } = useExpenses(project.id);
    const balances = useMemo(() => computeBalances(expenses), [expenses]);
    const currencies = Object.keys(balances);

    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-slate-800/60 border border-slate-600/50 rounded-2xl p-4 transition-all active:scale-[0.98] hover:bg-slate-800"
        >
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FolderOpen size={18} className={project.is_default ? 'text-green-400' : 'text-slate-400'} />
                    <h3 className="text-base font-bold text-white truncate">{project.name}</h3>
                    {project.is_default && (
                        <span className="text-[10px] font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex-shrink-0">Default</span>
                    )}
                </div>
                <ChevronRight size={18} className="text-slate-500 flex-shrink-0" />
            </div>

            {currencies.length === 0 ? (
                <p className="text-xs text-slate-500">Nessuna spesa</p>
            ) : (
                <div className="space-y-1">
                    {currencies.map((cur) => {
                        const b = balances[cur];
                        return (
                            <div key={cur} className="flex items-center justify-between">
                                <span className="text-xs text-slate-400">
                                    Totale: {b.total.toFixed(2)} {cur}
                                </span>
                                {b.owed ? (
                                    <span className="text-xs font-bold text-amber-400">
                                        {b.owed.from} deve {b.owed.amount.toFixed(2)} {cur}
                                    </span>
                                ) : (
                                    <span className="text-xs text-green-400 font-semibold">Pari ✓</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </button>
    );
}

export default function ContiPage() {
    const navigate = useNavigate();
    const { data: projects = [], isLoading } = useProjects();
    const createProject = useCreateProject();
    const deleteProject = useDeleteProject();
    const archiveProject = useToggleArchiveProject();
    const [showNew, setShowNew] = useState(false);
    const [newName, setNewName] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [showArchived, setShowArchived] = useState(false);

    const activeProjects = projects.filter((p) => !p.is_archived);
    const archivedProjects = projects.filter((p) => p.is_archived);

    const handleCreate = async () => {
        const trimmed = newName.trim();
        if (!trimmed) return;
        await createProject.mutateAsync({ name: trimmed });
        setNewName('');
        setShowNew(false);
    };

    const handleDelete = async (id) => {
        if (confirmDeleteId === id) {
            await deleteProject.mutateAsync(id);
            setConfirmDeleteId(null);
        } else {
            setConfirmDeleteId(id);
            setTimeout(() => setConfirmDeleteId(null), 3000);
        }
    };

    const handleArchive = async (id, archived) => {
        await archiveProject.mutateAsync({ id, is_archived: archived });
    };

    return (
        <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                        <Wallet size={22} className="text-purple-400" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-white tracking-tight">Conti</h1>
                </div>
                <button
                    onClick={() => setShowNew(!showNew)}
                    className="p-2.5 bg-purple-500/15 border border-purple-500/30 text-purple-400 rounded-xl hover:bg-purple-500/25 transition-all active:scale-95"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* New project input */}
            {showNew && (
                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        placeholder="Nome progetto..."
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        autoFocus
                        className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-sm text-white placeholder-slate-500 outline-none focus:border-purple-500/50"
                    />
                    <button
                        onClick={handleCreate}
                        disabled={!newName.trim() || createProject.isPending}
                        className="px-5 py-3 bg-purple-500 disabled:bg-slate-700 text-white disabled:text-slate-500 font-bold rounded-xl transition-all active:scale-95"
                    >
                        Crea
                    </button>
                </div>
            )}

            {/* Loading */}
            {isLoading && (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Active project list */}
            <div className="space-y-3">
                {activeProjects.map((project) => (
                    <div key={project.id} className="relative">
                        <ProjectCard
                            project={project}
                            onClick={() => navigate(`/conti/${project.id}`)}
                        />
                        <div className="absolute top-3 right-12 flex gap-1">
                            {!project.is_default && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleArchive(project.id, true); }}
                                    className="p-2 rounded-lg text-slate-600 hover:text-purple-400 hover:bg-purple-500/10 transition-all"
                                    title="Archivia"
                                >
                                    <Archive size={14} />
                                </button>
                            )}
                            {!project.is_default && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}
                                    className={`p-2 rounded-lg transition-all ${confirmDeleteId === project.id
                                        ? 'bg-red-500/20 text-red-400'
                                        : 'text-slate-600 hover:text-red-400 hover:bg-red-500/10'
                                        }`}
                                >
                                    {confirmDeleteId === project.id ? (
                                        <span className="text-xs font-bold">Elimina?</span>
                                    ) : (
                                        <Trash2 size={14} />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!isLoading && activeProjects.length === 0 && (
                <p className="text-center text-slate-500 py-12">Nessun progetto attivo.</p>
            )}

            {/* Archived section */}
            {archivedProjects.length > 0 && (
                <div className="mt-6">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-300 mb-3 transition-colors"
                    >
                        <Archive size={14} />
                        <span>Archiviati ({archivedProjects.length})</span>
                        <ChevronDown size={14} className={`transition-transform ${showArchived ? 'rotate-180' : ''}`} />
                    </button>

                    {showArchived && (
                        <div className="space-y-3">
                            {archivedProjects.map((project) => (
                                <div key={project.id} className="relative opacity-70">
                                    <ProjectCard
                                        project={project}
                                        onClick={() => navigate(`/conti/${project.id}`)}
                                    />
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleArchive(project.id, false); }}
                                        className="absolute top-3 right-12 p-2 rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-all"
                                        title="Ripristina"
                                    >
                                        <Archive size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
