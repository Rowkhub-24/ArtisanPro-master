import { Head, Link, router } from '@inertiajs/react';
import { Filter, CreditCard, TrendingUp, CheckCircle, Clock, Download } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';

interface Paiement {
    id: number;
    montant: number;
    commission: number;
    type_transaction: string;
    methode_paiement: string;
    statut: string;
    reference_transaction: string;
    date_paiement: string;
    user: { nom: string; prenom: string; email: string } | null;
    reservation: { artisan: { user: { nom: string; prenom: string } | null } | null } | null;
}

interface Stats {
    total_transactions: number;
    revenus_total: number;
    commission_total: number;
    en_attente: number;
}

interface Paginated<T> {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    meta: { current_page: number; last_page: number; total: number };
}

interface Props {
    paiements: Paginated<Paiement>;
    stats: Stats;
    filters: { statut?: string };
}

const statusConfig: Record<string, { label: string; color: string }> = {
    en_attente: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
    complete:   { label: 'Complété',   color: 'bg-green-100 text-green-800' },
    echoue:     { label: 'Échoué',     color: 'bg-red-100 text-red-800' },
    rembourse:  { label: 'Remboursé',  color: 'bg-blue-100 text-blue-800' },
};

export default function AdminPaiementsIndex({ paiements, stats, filters }: Props) {
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        router.get(route('admin.paiements.index'), Object.fromEntries(fd), { preserveState: true });
    };

    return (
        <AdminLayout title="Paiements">
            <Head title="Paiements - Admin ArtisanPro" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Paiements & Transactions</h1>
                        <p className="text-sm text-gray-500 mt-1">{paiements.meta.total} transactions</p>
                    </div>
                    <Button variant="outline" className="border-gray-200">
                        <Download className="mr-2 h-4 w-4" />
                        Exporter
                    </Button>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        { label: 'Transactions',    value: stats.total_transactions,                          icon: CreditCard,  color: 'text-blue-600',   bg: 'bg-blue-50' },
                        { label: 'Revenus totaux',  value: `${stats.revenus_total.toLocaleString('fr-FR')} F`, icon: TrendingUp,  color: 'text-green-600',  bg: 'bg-green-50' },
                        { label: 'Commissions',     value: `${stats.commission_total.toLocaleString('fr-FR')} F`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                        { label: 'En attente',      value: stats.en_attente,                                  icon: Clock,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
                    ].map((kpi) => (
                        <Card key={kpi.label} className="border-0 shadow-sm bg-white">
                            <CardContent className="p-5">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${kpi.bg}`}>
                                        <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">{kpi.label}</p>
                                        <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Filter */}
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-4">
                        <form onSubmit={submit} className="flex gap-3">
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
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Référence</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Client</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Artisan</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Montant</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Commission</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Méthode</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {paiements.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-400">
                                            <CreditCard className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                            Aucune transaction
                                        </td>
                                    </tr>
                                ) : (
                                    paiements.data.map((p) => {
                                        const sc = statusConfig[p.statut] ?? statusConfig.en_attente;
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.reference_transaction}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-gray-900">{p.user ? `${p.user.prenom} ${p.user.nom}` : 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-xs">
                                                    {p.reservation?.artisan?.user ? `${p.reservation.artisan.user.prenom} ${p.reservation.artisan.user.nom}` : '—'}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">{Number(p.montant).toLocaleString('fr-FR')} F</td>
                                                <td className="px-6 py-4 text-indigo-600 font-medium">{Number(p.commission).toLocaleString('fr-FR')} F</td>
                                                <td className="px-6 py-4 text-gray-500 text-xs">{p.methode_paiement}</td>
                                                <td className="px-6 py-4">
                                                    <Badge className={`text-xs ${sc.color}`}>{sc.label}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-500">
                                                    {new Date(p.date_paiement).toLocaleDateString('fr-FR')}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {paiements.meta.last_page > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
                            <p className="text-sm text-gray-500">Page {paiements.meta.current_page} sur {paiements.meta.last_page}</p>
                            <div className="flex gap-1">
                                {paiements.links.map((l, i) =>
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
