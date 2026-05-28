import { Head, router, useForm } from '@inertiajs/react';
import { Building2, Plus, Pencil, Trash2, Globe, Mail, Phone, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';

interface Partenaire {
    id: number;
    nom_fournisseur: string;
    description: string | null;
    contact_email: string;
    contact_telephone: string;
    logo_url: string | null;
    site_web: string | null;
    type: string | null;
    actif: boolean;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Props {
    partenaires: Paginated<Partenaire>;
}

type FormData = {
    nom_fournisseur: string;
    description: string;
    contact_email: string;
    contact_telephone: string;
    logo_url: string;
    site_web: string;
    type: string;
    actif: boolean;
};

const emptyForm: FormData = {
    nom_fournisseur: '',
    description: '',
    contact_email: '',
    contact_telephone: '',
    logo_url: '',
    site_web: '',
    type: '',
    actif: true,
};

export default function AdminPartenairesIndex({ partenaires }: Props) {
    const [showForm, setShowForm] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);

    const { data, setData, post, patch, reset, processing, errors } = useForm<FormData>(emptyForm);

    const openCreate = () => {
        reset();
        Object.assign(data, emptyForm);
        setEditId(null);
        setShowForm(true);
    };

    const openEdit = (p: Partenaire) => {
        setData({
            nom_fournisseur: p.nom_fournisseur,
            description: p.description ?? '',
            contact_email: p.contact_email,
            contact_telephone: p.contact_telephone,
            logo_url: p.logo_url ?? '',
            site_web: p.site_web ?? '',
            type: p.type ?? '',
            actif: p.actif,
        });
        setEditId(p.id);
        setShowForm(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editId) {
            patch(route('admin.partenaires.update', editId), {
                onSuccess: () => { setShowForm(false); setEditId(null); },
            });
        } else {
            post(route('admin.partenaires.store'), {
                onSuccess: () => { setShowForm(false); reset(); },
            });
        }
    };

    const destroy = (id: number) => {
        if (confirm('Supprimer ce partenaire ?')) {
            router.delete(route('admin.partenaires.destroy', id), { preserveScroll: true });
        }
    };

    const toggleActif = (id: number) => {
        router.patch(route('admin.partenaires.actif', id), {}, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Partenaires">
            <Head title="Partenaires - Admin ArtisanPro" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Partenaires & Fournisseurs</h1>
                        <p className="text-sm text-gray-500 mt-1">{partenaires.meta.total} partenaires</p>
                    </div>
                    <Button onClick={openCreate} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400">
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter
                    </Button>
                </div>

                {/* Form modal */}
                {showForm && (
                    <Card className="rounded-2xl border border-amber-200 shadow-md bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="font-semibold text-gray-900">{editId ? 'Modifier le partenaire' : 'Nouveau partenaire'}</h2>
                                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                                    <Input value={data.nom_fournisseur} onChange={e => setData('nom_fournisseur', e.target.value)} placeholder="Nom du partenaire" className="border-gray-200" />
                                    {errors.nom_fournisseur && <p className="text-xs text-red-600 mt-1">{errors.nom_fournisseur}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <Input value={data.type} onChange={e => setData('type', e.target.value)} placeholder="Ex: fournisseur, assureur..." className="border-gray-200" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <Input type="email" value={data.contact_email} onChange={e => setData('contact_email', e.target.value)} placeholder="contact@partenaire.com" className="border-gray-200" />
                                    {errors.contact_email && <p className="text-xs text-red-600 mt-1">{errors.contact_email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
                                    <Input value={data.contact_telephone} onChange={e => setData('contact_telephone', e.target.value)} placeholder="+229 XX XX XX XX" className="border-gray-200" />
                                    {errors.contact_telephone && <p className="text-xs text-red-600 mt-1">{errors.contact_telephone}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Site web</label>
                                    <Input value={data.site_web} onChange={e => setData('site_web', e.target.value)} placeholder="https://..." className="border-gray-200" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                                    <Input value={data.logo_url} onChange={e => setData('logo_url', e.target.value)} placeholder="https://..." className="border-gray-200" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        value={data.description}
                                        onChange={e => setData('description', e.target.value)}
                                        rows={3}
                                        placeholder="Description du partenaire..."
                                        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-amber-400 focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="md:col-span-2 flex items-center justify-between">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={data.actif} onChange={e => setData('actif', e.target.checked)} className="rounded" />
                                        <span className="text-sm text-gray-700">Actif (visible sur le site)</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="border-gray-200">
                                            Annuler
                                        </Button>
                                        <Button type="submit" disabled={processing} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400">
                                            <Check className="mr-1.5 h-4 w-4" />
                                            {editId ? 'Mettre à jour' : 'Créer'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                )}

                {/* Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {partenaires.data.length === 0 ? (
                        <div className="col-span-3 rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Aucun partenaire</p>
                            <Button onClick={openCreate} className="mt-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400">
                                <Plus className="mr-2 h-4 w-4" />
                                Ajouter le premier partenaire
                            </Button>
                        </div>
                    ) : (
                        partenaires.data.map((p) => (
                            <Card key={p.id} className="rounded-2xl border border-[hsl(30,20%,88%)] shadow-sm bg-white hover:shadow-md transition-shadow">
                                <CardContent className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            {p.logo_url ? (
                                                <img src={p.logo_url} alt={p.nom_fournisseur} className="h-10 w-10 rounded-lg object-contain border border-gray-100" />
                                            ) : (
                                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white text-sm font-bold shrink-0">
                                                    {p.nom_fournisseur.charAt(0)}
                                                </div>
                                            )}
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{p.nom_fournisseur}</p>
                                                {p.type && <p className="text-xs text-gray-500 capitalize">{p.type}</p>}
                                            </div>
                                        </div>
                                        <Badge className={p.actif ? 'bg-emerald-100 text-emerald-800 text-xs' : 'bg-gray-100 text-gray-600 text-xs'}>
                                            {p.actif ? 'Actif' : 'Inactif'}
                                        </Badge>
                                    </div>

                                    {p.description && (
                                        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>
                                    )}

                                    <div className="space-y-1.5 mb-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Mail className="h-3.5 w-3.5 shrink-0" />
                                            <span className="truncate">{p.contact_email}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Phone className="h-3.5 w-3.5 shrink-0" />
                                            {p.contact_telephone}
                                        </div>
                                        {p.site_web && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                <Globe className="h-3.5 w-3.5 shrink-0" />
                                                <a href={p.site_web} target="_blank" rel="noopener noreferrer" className="truncate hover:text-amber-600">
                                                    {p.site_web.replace(/^https?:\/\//, '')}
                                                </a>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50">
                                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                                            Modifier
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => toggleActif(p.id)} className={`border-gray-200 ${p.actif ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                                            {p.actif ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => destroy(p.id)} className="border-red-200 text-red-600 hover:bg-red-50">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
