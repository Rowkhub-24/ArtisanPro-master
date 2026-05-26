import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Tag, X, Check } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';

interface Category { id: number; nom: string; icone: string | null; description: string | null; artisans_count: number; }
interface Props { categories: Category[]; }

export default function AdminCategoriesIndex({ categories }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const createForm = useForm({ nom: '', icone: '', description: '' });
    const editForm = useForm({ nom: '', icone: '', description: '' });

    const startEdit = (c: Category) => {
        setEditId(c.id);
        editForm.setData({ nom: c.nom, icone: c.icone ?? '', description: c.description ?? '' });
    };

    const submitCreate = (e: React.FormEvent) => {
        e.preventDefault();
        createForm.post(route('admin.categories.store'), {
            onSuccess: () => { createForm.reset(); setShowForm(false); },
        });
    };

    const submitEdit = (e: React.FormEvent, id: number) => {
        e.preventDefault();
        editForm.patch(route('admin.categories.update', id), { onSuccess: () => setEditId(null) });
    };

    const destroy = (id: number) => {
        if (confirm('Supprimer cette catégorie ?')) router.delete(route('admin.categories.destroy', id));
    };

    const inputCls = "rounded-xl border border-[hsl(30,20%,82%)] bg-white focus:border-amber-400 focus:outline-none";

    return (
        <AdminLayout title="Catégories">
            <Head title="Catégories - Admin ArtisanPro" />
            <div className="space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">Catégories</h1>
                        <p className="text-sm text-[hsl(20,10%,50%)] mt-1">{categories.length} catégories</p>
                    </div>
                    <button onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2.5 text-sm shadow-sm transition-all">
                        <Plus className="h-4 w-4" />
                        Nouvelle catégorie
                    </button>
                </div>

                {/* Create Form */}
                {showForm && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                        <h2 className="text-base font-semibold text-amber-900 mb-4">Nouvelle catégorie</h2>
                        <form onSubmit={submitCreate} className="grid gap-4 md:grid-cols-4">
                            <div className="space-y-1">
                                <Label className="text-xs text-[hsl(20,10%,45%)]">Icône (emoji)</Label>
                                <Input value={createForm.data.icone} onChange={e => createForm.setData('icone', e.target.value)} placeholder="🔧" className={`${inputCls} text-center`} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-[hsl(20,10%,45%)]">Nom *</Label>
                                <Input value={createForm.data.nom} onChange={e => createForm.setData('nom', e.target.value)} placeholder="Plomberie" required className={inputCls} />
                                {createForm.errors.nom && <p className="text-xs text-red-600">{createForm.errors.nom}</p>}
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-[hsl(20,10%,45%)]">Description</Label>
                                <Input value={createForm.data.description} onChange={e => createForm.setData('description', e.target.value)} placeholder="Description courte" className={inputCls} />
                            </div>
                            <div className="flex items-end gap-2">
                                <button type="submit" disabled={createForm.processing}
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm shadow-sm transition-all disabled:opacity-60">
                                    <Check className="h-4 w-4" /> Créer
                                </button>
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-sm text-[hsl(20,14%,35%)] hover:bg-[hsl(36,33%,97%)] transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Categories Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((c) => (
                        <div key={c.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-shadow p-5">
                            {editId === c.id ? (
                                <form onSubmit={(e) => submitEdit(e, c.id)} className="space-y-3">
                                    <div className="flex gap-2">
                                        <Input value={editForm.data.icone} onChange={e => editForm.setData('icone', e.target.value)} placeholder="🔧" className={`w-16 ${inputCls} text-center`} />
                                        <Input value={editForm.data.nom} onChange={e => editForm.setData('nom', e.target.value)} required className={`flex-1 ${inputCls}`} />
                                    </div>
                                    <Input value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} placeholder="Description" className={inputCls} />
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={editForm.processing}
                                            className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-3 py-1.5 text-xs transition-colors disabled:opacity-60">
                                            <Check className="h-3.5 w-3.5" /> Sauver
                                        </button>
                                        <button type="button" onClick={() => setEditId(null)}
                                            className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-1.5 text-xs text-[hsl(20,14%,35%)] hover:bg-[hsl(36,33%,97%)] transition-colors">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-2xl">
                                                {c.icone ?? '🔧'}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-[hsl(20,14%,12%)]">{c.nom}</h3>
                                                <p className="text-xs text-[hsl(20,10%,50%)]">{c.artisans_count} artisan{c.artisans_count > 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => startEdit(c)}
                                                className="h-8 w-8 flex items-center justify-center rounded-xl border border-[hsl(30,20%,82%)] text-[hsl(20,10%,50%)] hover:text-amber-600 hover:border-amber-200 transition-colors">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => destroy(c.id)}
                                                className="h-8 w-8 flex items-center justify-center rounded-xl border border-[hsl(30,20%,82%)] text-[hsl(20,10%,50%)] hover:text-red-600 hover:border-red-200 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                    {c.description && <p className="text-xs text-[hsl(20,10%,50%)] line-clamp-2 mb-3">{c.description}</p>}
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 flex-1 rounded-full bg-[hsl(36,30%,93%)] overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${Math.min((c.artisans_count / 10) * 100, 100)}%` }} />
                                        </div>
                                        <span className="text-xs font-medium text-[hsl(20,10%,50%)]">{c.artisans_count}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
