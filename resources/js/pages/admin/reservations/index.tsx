import { Head, Link, router } from '@inertiajs/react';
import { Search, Filter, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';

interface Reservation {
    id: number;
    statut: string;
    montant_total: number | null;
    created_at: string;
    client: { user: { nom: string; prenom: string; email: string } | null } | null;
    artisan: { metier: string; user: { nom: string; prenom: string } | null } | null;
}

interface Stats {
    total: number;
    en_attente: number;
    en_cours: number;
    termine: number;
    annule: number;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Props {
    reservations: Paginated<Reservation>;
    stats: Stats;
    filters: { q?: string; statut?: string };
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    confirme:   { label: 'Confirmé',   color: 'bg-green-100 text-green-800',  icon: CheckCircle },
    en_cours:   { label: 'En cours',   color: 'bg-blue-100 text-blue-800',    icon: Clock },
    termine:    { label: 'Terminé',    color: 'bg-gray-100 text-gray-800',    icon: CheckCircle },
    annule:     { label: 'Annulé',     color: 'bg-red-100 text-red-800',      icon: XCircle },
};

export default function AdminReservationsIndex({ reservations, stats, filters }: Props) {
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        router.get(route('admin.reservations.index'), Object.fromEntries(fd), { preserveState: true });
    };

    return (
        <AdminLayout title="Réservations">
            <Head title="Réservations - Admin ArtisanPro" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Réservations</h1>
                    <p className="text-sm text-gray-500 mt-1">{reservations.meta.total} réservations au total</p>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:grid-cols-5">
                    {[
                        { label: 'Total',      value: stats.total,      color: 'text-gray-900',   bg: 'bg-gray-50',    border: 'border-gray-200' },
                        { label: 'En attente', value: stats.en_attente, color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-200' },
                        { label: 'En cours',   value: stats.en_cours,   color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
                        { label: 'Terminées',  value: stats.termine,    color: 'text-green-700',  bg: 'bg-green-50',   border: 'border-green-200' },
                        { label: 'Annulées',   value: stats.annule,     color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200' },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4 text-center`}>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4">
                        <form onSubmit={submit} className="flex flex-wrap gap-3">
                            <div className="relative flex-1 min-w-48">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input name="q" defaultValue={filters.q} placeholder="Nom du client..." className="pl-9 border-gray-200" />
                            </div>
                            <select name="statut" defaultValue={filters.statut ?? ''} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none">
                                <option value="">Tous les statuts</option>
                                {Object.entries(statusConfig).map(([k, v]) => (
                                    <option key={k} value={k}>{v.label}</option>
                                ))}
                            </select>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                                <Filter className="mr-2 h-4 w-4" />
                                Filtrer
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Table */}
                <Card className="border-0 shadow-sm bg-white overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Artisan</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reservations.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                            <Calendar className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                            Aucune réservation trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    reservations.data.map((r) => {
                                        const sc = statusConfig[r.statut] ?? statusConfig.en_attente;
                                        const Icon = sc.icon;
                                        return (
                                            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900">
                                                        {r.client?.user ? `${r.client.user.prenom} ${r.client.user.nom}` : 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{r.client?.user?.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900">{r.artisan?.metier ?? 'N/A'}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {r.artisan?.user ? `${r.artisan.user.prenom} ${r.artisan.user.nom}` : ''}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`text-xs flex items-center gap-1 w-fit ${sc.color}`}>
                                                        <Icon className="h-3 w-3" />
                                                        {sc.label}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {r.montant_total ? `${Number(r.montant_total).toLocaleString('fr-FR')} F` : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {new Date(r.created_at).toLocaleDateString('fr-FR')}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {reservations.meta.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                            <p className="text-sm text-gray-500">Page {reservations.meta.current_page} sur {reservations.meta.last_page}</p>
                            <div className="flex gap-1">
                                {reservations.links.map((l, i) =>
                                    l.url ? (
                                        <Link key={i} href={l.url} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${l.active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
                                            dangerouslySetInnerHTML={{ __html: l.label }} />
                                    ) : (
                                        <span key={i} className="px-3 py-1.5 text-sm text-gray-300" dangerouslySetInnerHTML={{ __html: l.label }} />
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </AdminLayout>
    );
}
