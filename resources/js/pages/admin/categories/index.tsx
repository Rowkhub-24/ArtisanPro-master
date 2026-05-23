import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Tag, X, Check } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/admin-layout';

interface Category {
    id: number;
    nom: string;
    icone: string | null;
    description: string | null;
    artisans_count: number;
}

interface Props { categories: Category[] }

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
        editForm.patch(route('admin.categories.update', id), {
            onSuccess: () => setEditId(null),
        });
    };

    const destroy = (id: number) => {
        if (confirm('Supprimer cette catégorie ?')) {
            router.delete(route('admin.categories.destroy', id));
        }
    };

    return (
        <AdminLayout title="Catégories">
            <Head title="Catégories - Admin ArtisanPro" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Catégories</h1>
                        <p className="text-sm text-gray-500 mt-1">{categories.length} catégories</p>
                    </div>
                    <Button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="mr-2 h-4 w-4" />
                        Nouvelle catégorie
                    </Button>
                </div>

                {/* Create Form */}
                {showForm && (
                    <Card className="border-blue-200 shadow-md bg-blue-50">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base text-blue-900">Nouvelle catégorie</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitCreate} className="grid gap-4 md:grid-cols-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-600">Icône (emoji)</Label>
                                    <Input value={createForm.data.icone} onChange={e => createForm.setData('icone', e.target.value)} placeholder="🔧" className="border-gray-200 bg-white" />
                                </div>
                                <div className="space-y-1 md:col-span-1">
                                    <Label className="text-xs text-gray-600">Nom *</Label>
                                    <Input value={createForm.data.nom} onChange={e => createForm.setData('nom', e.target.value)} placeholder="Plomberie" required className="border-gray-200 bg-white" />
                                    {createForm.errors.nom && <p className="text-xs text-red-600">{createForm.errors.nom}</p>}
                                </div>
                                <div className="space-y-1 md:col-span-1">
                                    <Label className="text-xs text-gray-600">Description</Label>
                                    <Input value={createForm.data.description} onChange={e => createForm.setData('description', e.target.value)} placeholder="Description courte" className="border-gray-200 bg-white" />
                                </div>
                                <div className="flex items-end gap-2">
                                    <Button type="submit" disabled={createForm.processing} className="bg-blue-600 hover:bg-blue-700">
                                        <Check className="mr-1.5 h-4 w-4" />
                                        Créer
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-gray-300">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Categories Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categories.map((c) => (
                        <Card key={c.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                            <CardContent className="p-5">
                                {editId === c.id ? (
                                    <form onSubmit={(e) => submitEdit(e, c.id)} className="space-y-3">
                                        <div className="flex gap-2">
                                            <Input value={editForm.data.icone} onChange={e => editForm.setData('icone', e.target.value)} placeholder="🔧" className="w-16 border-gray-200 text-center" />
                                            <Input value={editForm.data.nom} onChange={e => editForm.setData('nom', e.target.value)} required className="flex-1 border-gray-200" />
                                        </div>
                                        <Input value={editForm.data.description} onChange={e => editForm.setData('description', e.target.value)} placeholder="Description" className="border-gray-200" />
                                        <div className="flex gap-2">
                                            <Button type="submit" size="sm" disabled={editForm.processing} className="bg-green-600 hover:bg-green-700">
                                                <Check className="mr-1 h-3.5 w-3.5" />
                                                Sauver
                                            </Button>
                                            <Button type="button" size="sm" variant="outline" onClick={() => setEditId(null)} className="border-gray-200">
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-2xl">
                                                    {c.icone ?? '🔧'}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{c.nom}</h3>
                                                    <p className="text-xs text-gray-500">{c.artisans_count} artisan{c.artisans_count > 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button size="sm" variant="outline" onClick={() => startEdit(c)} className="h-8 w-8 p-0 border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200">
                                                    <Pencil className="h-3.5 w-3.5" />
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => destroy(c.id)} className="h-8 w-8 p-0 border-gray-200 text-gray-500 hover:text-red-600 hover:border-red-200">
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        {c.description && <p className="text-xs text-gray-500 line-clamp-2">{c.description}</p>}
                                        <div className="mt-3 flex items-center gap-2">
                                            <div className="h-1.5 flex-1 rounded-full bg-gray-100 overflow-hidden">
                                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${Math.min((c.artisans_count / 10) * 100, 100)}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-gray-500">{c.artisans_count}</span>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
}
