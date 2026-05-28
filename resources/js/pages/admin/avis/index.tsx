import { Head, Link, router } from '@inertiajs/react';
import { Star, Search, Filter, Eye, EyeOff, Trash2, Flag, MessageSquare } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';

interface AvisRow {
    id: number;
    note: number;
    commentaire: string | null;
    date_avis: string;
    signale: boolean;
    masque: boolean;
    client: { user: { id: number; nom: string; prenom: string; email: string } | null } | null;
    artisan: { user: { id: number; nom: string; prenom: string } | null } | null;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Props {
    avis: Paginated<AvisRow>;
    stats: { total: number; signale: number; masque: number };
    filters: { q?: string; statut?: string };
}

function StarRating({ note }: { note: number }) {
    return (
        <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => (
                <Star key={i} className={`h-3.5 w-3.5 ${i < note ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            ))}
        </div>
    );
}

export default function AdminAvisIndex({ avis, stats, filters }: Props) {
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        router.get(route('admin.avis.index'), Object.fromEntries(fd), { preserveState: true });
    };

    const masquer = (id: number) => {
        router.patch(route('admin.avis.masquer', id), {}, { preserveScroll: true });
    };

    const restaurer = (id: number) => {
        router.patch(route('admin.avis.restaurer', id), {}, { preserveScroll: true });
    };

    const supprimer = (id: number) => {
        if (confirm('Supprimer définitivement cet avis ?')) {
            router.delete(route('admin.avis.supprimer', id), { preserveScroll: true });
        }
    };

    return (
        <AdminLayout title="Modération des avis">
            <Head title="Avis - Admin ArtisanPro" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Modération des avis</h1>
                        <p className="text-sm text-gray-500 mt-1">{stats.total} avis au total</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3">
                    {[
                        { label: 'Total',    value: stats.total,   color: 'text-gray-900',    bg: 'bg-gray-50 border-gray-200' },
                        { label: 'Signalés', value: stats.signale, color: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
                        { label: 'Masqués',  value: stats.masque,  color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200' },
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
                                <Input name="q" defaultValue={filters.q} placeholder="Rechercher dans les commentaires..." className="pl-9 border-gray-200" />
                            </div>
                            <select name="statut" defaultValue={filters.statut ?? ''} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-amber-400 focus:outline-none">
                                <option value="">Tous</option>
                                <option value="signale">Signalés</option>
                                <option value="masque">Masqués</option>
                                <option value="visible">Visibles</option>
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
                    {avis.data.length === 0 ? (
                        <div className="p-12 text-center">
                            <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Aucun avis trouvé</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[hsl(30,20%,92%)]">
                            {avis.data.map((a) => (
                                <div key={a.id} className="p-5 hover:bg-[hsl(36,33%,97%)] transition-colors">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <StarRating note={a.note} />
                                                <span className="font-bold text-gray-900">{a.note}/5</span>
                                                {a.signale && (
                                                    <Badge className="bg-red-100 text-red-800 border border-red-200 text-xs">
                                                        <Flag className="h-3 w-3 mr-1" />
                                                        Signalé
                                                    </Badge>
                                                )}
                                                {a.masque && (
                                                    <Badge className="bg-amber-100 text-amber-800 border border-amber-200 text-xs">
                                                        <EyeOff className="h-3 w-3 mr-1" />
                                                        Masqué
                                                    </Badge>
                                                )}
                                                <span className="text-xs text-gray-400">
                                                    {new Date(a.date_avis).toLocaleDateString('fr-FR')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                                <span className="font-medium">
                                                    {a.client?.user ? `${a.client.user.prenom} ${a.client.user.nom}` : 'Client inconnu'}
                                                </span>
                                                <span className="text-gray-400">→</span>
                                                <span className="font-medium">
                                                    {a.artisan?.user ? `${a.artisan.user.prenom} ${a.artisan.user.nom}` : 'Artisan inconnu'}
                                                </span>
                                            </div>
                                            {a.commentaire && (
                                                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 line-clamp-3">
                                                    {a.commentaire}
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {a.masque ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => restaurer(a.id)}
                                                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    <Eye className="h-3.5 w-3.5 mr-1" />
                                                    Restaurer
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => masquer(a.id)}
                                                    className="border-amber-200 text-amber-700 hover:bg-amber-50"
                                                >
                                                    <EyeOff className="h-3.5 w-3.5 mr-1" />
                                                    Masquer
                                                </Button>
                                            )}
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => supprimer(a.id)}
                                                className="border-red-200 text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {avis.meta.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {avis.links.map((l, i) =>
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
