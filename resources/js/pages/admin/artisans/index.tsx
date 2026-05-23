import { Head, Link, router } from '@inertiajs/react';
import { Search, Filter, Eye, Star, MapPin, Award } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';

interface ArtisanRow {
    id: number;
    metier: string;
    note_moyenne: number;
    badge: string;
    zone_intervention: string | null;
    tarifs_horaire: number | null;
    user: { id: number; nom: string; prenom: string; email: string; statut: string } | null;
    categories: { id: number; nom: string }[];
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Props {
    artisans: Paginated<ArtisanRow>;
    filters: { q?: string; badge?: string };
}

const badgeConfig: Record<string, { label: string; color: string }> = {
    elite:    { label: '⭐ Élite',     color: 'bg-purple-100 text-purple-800' },
    certifie: { label: '✓ Certifié',  color: 'bg-blue-100 text-blue-800' },
    aucun:    { label: 'Standard',    color: 'bg-gray-100 text-gray-700' },
};

export default function AdminArtisansIndex({ artisans, filters }: Props) {
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        router.get(route('admin.artisans.index'), Object.fromEntries(fd), { preserveState: true });
    };

    const updateBadge = (artisanId: number, badge: string) => {
        router.patch(route('admin.artisans.badge', artisanId), { badge }, { preserveScroll: true });
    };

    return (
        <AdminLayout title="Artisans">
            <Head title="Artisans - Admin ArtisanPro" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Artisans</h1>
                        <p className="text-sm text-gray-500 mt-1">{artisans.meta.total} artisans inscrits</p>
                    </div>
                </div>

                {/* Filters */}
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4">
                        <form onSubmit={submit} className="flex flex-wrap gap-3">
                            <div className="relative flex-1 min-w-48">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input name="q" defaultValue={filters.q} placeholder="Métier, nom..." className="pl-9 border-gray-200" />
                            </div>
                            <select name="badge" defaultValue={filters.badge ?? ''} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none">
                                <option value="">Tous les badges</option>
                                <option value="elite">Élite</option>
                                <option value="certifie">Certifié</option>
                                <option value="aucun">Standard</option>
                            </select>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtrer
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {artisans.data.length === 0 ? (
                        <div className="col-span-3 rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                            <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">Aucun artisan trouvé</p>
                        </div>
                    ) : (
                        artisans.data.map((a) => {
                            const bc = badgeConfig[a.badge] ?? badgeConfig.aucun;
                            return (
                                <Card key={a.id} className="border-0 shadow-sm bg-white hover:shadow-md transition-shadow">
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-sm font-bold shrink-0">
                                                    {a.user?.prenom?.charAt(0)}{a.user?.nom?.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{a.metier}</p>
                                                    <p className="text-xs text-gray-500">{a.user?.prenom} {a.user?.nom}</p>
                                                </div>
                                            </div>
                                            <Badge className={`text-xs ${bc.color}`}>{bc.label}</Badge>
                                        </div>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-1.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`h-3.5 w-3.5 ${i < Math.floor(Number(a.note_moyenne)) ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                                                ))}
                                                <span className="text-xs font-medium text-gray-700 ml-1">{Number(a.note_moyenne).toFixed(1)}</span>
                                            </div>
                                            {a.zone_intervention && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    {a.zone_intervention}
                                                </div>
                                            )}
                                            <div className="flex flex-wrap gap-1">
                                                {a.categories.slice(0, 3).map((c) => (
                                                    <span key={c.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{c.nom}</span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link href={route('admin.artisans.show', a.id)} className="flex-1">
                                                <Button size="sm" variant="outline" className="w-full border-gray-200 text-gray-700 hover:bg-gray-50">
                                                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                                                    Voir
                                                </Button>
                                            </Link>
                                            <select
                                                value={a.badge}
                                                onChange={(e) => updateBadge(a.id, e.target.value)}
                                                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-blue-500 focus:outline-none"
                                            >
                                                <option value="aucun">Standard</option>
                                                <option value="certifie">Certifié</option>
                                                <option value="elite">Élite</option>
                                            </select>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Pagination */}
                {artisans.meta.last_page > 1 && (
                    <div className="flex justify-center gap-1">
                        {artisans.links.map((l, i) =>
                            l.url ? (
                                <Link key={i} href={l.url} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${l.active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
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
