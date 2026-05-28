import { Head, Link, router } from '@inertiajs/react';
import { AlertTriangle, Search, Filter, Eye, Clock, CheckCircle, XCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';

interface LitigeRow {
    id: number;
    description_litige: string;
    date_ouverture: string;
    statut: 'ouvert' | 'en_cours' | 'resolu' | 'clos';
    resolution_details: string | null;
    client: { user: { id: number; nom: string; prenom: string; email: string } | null } | null;
    artisan: { user: { id: number; nom: string; prenom: string } | null } | null;
    reservation: { id: number; statut: string; montant_total: number | null } | null;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Props {
    litiges: Paginated<LitigeRow>;
    stats: { total: number; ouvert: number; en_cours: number; resolu: number; clos: number };
    filters: { q?: string; statut?: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    ouvert:   { label: 'Ouvert',   color: 'bg-red-100 text-red-800 border border-red-200',             icon: <AlertTriangle className="h-3.5 w-3.5" /> },
    en_cours: { label: 'En cours', color: 'bg-amber-100 text-amber-800 border border-amber-200',       icon: <Clock className="h-3.5 w-3.5" /> },
    resolu:   { label: 'Résolu',   color: 'bg-emerald-100 text-emerald-800 border border-emerald-200', icon: <CheckCircle className="h-3.5 w-3.5" /> },
    clos:     { label: 'Clos',     color: 'bg-gray-100 text-gray-700 border border-gray-200',          icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function AdminLitigesIndex({ litiges, stats, filters }: Props) {
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        router.get(route('admin.litiges.index'), Object.fromEntries(fd), { preserveState: true });
    };

    return (
        <AdminLayout title="Litiges">
            <Head title="Litiges - Admin ArtisanPro" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestion des litiges</h1>
                    <p className="text-sm text-gray-500 mt-1">{stats.total} litiges au total</p>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        { label: 'Ouverts',  value: stats.ouvert,   color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
                        { label: 'En cours', value: stats.en_cours, color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
                        { label: 'Résolus',  value: stats.resolu,   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
                        { label: 'Clos',     value: stats.clos,     color: 'text-gray-600',    bg: 'bg-gray-50 border-gray-200' },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-2xl border ${s.bg} p-5`}>
                            <p className="text-sm text-gray-500">{s.label}</p>
                            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <Card className="rounded-2xl border border-[hsl(30,20%,88%)] shadow-sm bg-white">
                    <CardContent className="p-4">
                        <form onSubmit={submit} className="flex flex-wrap gap-3">
                            <div className="relative flex-1 min-w-48">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input name="q" defaultValue={filters.q} placeholder="Nom du client..." className="pl-9 border-gray-200" />
                            </div>
                            <select name="statut" defaultValue={filters.statut ?? ''} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-amber-400 focus:outline-none">
                                <option value="">Tous les statuts</option>
                                <option value="ouvert">Ouvert</option>
                                <option value="en_cours">En cours</option>
                                <option value="resolu">Résolu</option>
                                <option value="clos">Clos</option>
                            </select>
                            <Button type="submit" className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtrer
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                    {litiges.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Aucun litige trouvé</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[hsl(30,20%,92%)]">
                            {litiges.data.map((l) => {
                                const sc = statusConfig[l.statut] ?? statusConfig.ouvert;
                                return (
                                    <div key={l.id} className="p-5 hover:bg-[hsl(36,33%,97%)] transition-colors">
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                    <span className="font-semibold text-gray-900">Litige #{l.id}</span>
                                                    <Badge className={`${sc.color} flex items-center gap-1 text-xs`}>
                                                        {sc.icon}
                                                        {sc.label}
                                                    </Badge>
                                                    <span className="text-xs text-gray-400">
                                                        {new Date(l.date_ouverture).toLocaleDateString('fr-FR')}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                    <span className="font-medium">
                                                        {l.client?.user ? `${l.client.user.prenom} ${l.client.user.nom}` : 'Client inconnu'}
                                                    </span>
                                                    <span className="text-gray-400">vs</span>
                                                    <span className="font-medium">
                                                        {l.artisan?.user ? `${l.artisan.user.prenom} ${l.artisan.user.nom}` : 'Artisan inconnu'}
                                                    </span>
                                                    {l.reservation?.montant_total && (
                                                        <span className="text-gray-400 ml-2">
                                                            · {Number(l.reservation.montant_total).toLocaleString('fr-FR')} FCFA
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2">{l.description_litige}</p>
                                            </div>
                                            <Link href={route('admin.litiges.show', l.id)}>
                                                <Button size="sm" variant="outline" className="border-gray-200 text-gray-700 hover:bg-gray-50 shrink-0">
                                                    <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                    Gérer
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {litiges.meta.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {litiges.links.map((l, i) =>
                            l.url ? (
                                <Link key={i} href={l.url}
                                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${l.active ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                    dangerouslySetInnerHTML={{ __html: l.label }} />
                            ) : (
                                <span key={i} className="px-3 py-1.5 text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: l.label }} />
                            )
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
