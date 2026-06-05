import { Head, Link, router } from '@inertiajs/react';
import { Filter, CreditCard, TrendingUp, Clock, Download } from 'lucide-react';
import { FormEventHandler } from 'react';
import AdminLayout from '@/layouts/admin-layout';

interface Paiement {
    id: number; montant: number; commission: number;
    type_transaction: string; methode_paiement: string; statut: string;
    reference_transaction: string; date_paiement: string;
    user: { nom: string; prenom: string; email: string } | null;
    reservation: { artisan: { user: { nom: string; prenom: string } | null } | null } | null;
}
interface Stats { total_transactions: number; revenus_total: number; commission_total: number; en_attente: number; }
interface Paginated<T> { data: T[]; links: { url: string | null; label: string; active: boolean }[]; meta: { current_page: number; last_page: number; total: number }; }
interface Props { paiements: Paginated<Paiement>; stats: Stats; filters: { statut?: string }; }

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
    en_attente: { label: 'En attente', bg: 'bg-amber-100',   text: 'text-amber-800' },
    reussi:     { label: 'Réussi',     bg: 'bg-emerald-100', text: 'text-emerald-800' },
    complete:   { label: 'Complété',   bg: 'bg-emerald-100', text: 'text-emerald-800' },
    echoue:     { label: 'Échoué',     bg: 'bg-red-100',     text: 'text-red-800' },
    echec:      { label: 'Échoué',     bg: 'bg-red-100',     text: 'text-red-800' },
    rembourse:  { label: 'Remboursé',  bg: 'bg-blue-100',    text: 'text-blue-800' },
    annule:     { label: 'Annulé',     bg: 'bg-gray-100',    text: 'text-gray-700' },
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

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">Paiements & Transactions</h1>
                        <p className="text-sm text-[hsl(20,10%,50%)] mt-1">{paiements.meta.total} transactions</p>
                    </div>
                    <a
                        href={route('admin.paiements.export')}
                        className="inline-flex items-center gap-2 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,14%,35%)] hover:bg-[hsl(36,33%,97%)] transition-colors"
                    >
                        <Download className="h-4 w-4" /> Exporter CSV
                    </a>
                </div>

                {/* KPIs */}
                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        { label: 'Transactions',   value: stats.total_transactions,                              icon: CreditCard, accent: 'bg-amber-50 border-amber-100 text-amber-600',   val: 'text-amber-600' },
                        { label: 'Revenus totaux', value: `${stats.revenus_total.toLocaleString('fr-FR')} F`,    icon: TrendingUp, accent: 'bg-emerald-50 border-emerald-100 text-emerald-600', val: 'text-emerald-600' },
                        { label: 'Commissions',    value: `${stats.commission_total.toLocaleString('fr-FR')} F`, icon: TrendingUp, accent: 'bg-orange-50 border-orange-100 text-orange-600',  val: 'text-orange-600' },
                        { label: 'En attente',     value: stats.en_attente,                                      icon: Clock,      accent: 'bg-yellow-50 border-yellow-100 text-yellow-600',  val: 'text-yellow-600' },
                    ].map((kpi) => (
                        <div key={kpi.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${kpi.accent}`}>
                                    <kpi.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-[hsl(20,10%,50%)]">{kpi.label}</p>
                                    <p className={`text-lg font-bold ${kpi.val}`}>{kpi.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-4">
                    <form onSubmit={submit} className="flex gap-3">
                        <select name="statut" defaultValue={filters.statut ?? ''}
                            className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-sm text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none">
                            <option value="">Tous les statuts</option>
                            <option value="en_attente">En attente</option>
                            <option value="reussi">Réussi</option>
                            <option value="complete">Complété</option>
                            <option value="echoue">Échoué</option>
                            <option value="rembourse">Remboursé</option>
                            <option value="annule">Annulé</option>
                        </select>
                        <button type="submit"
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm shadow-sm transition-all">
                            <Filter className="h-4 w-4" /> Filtrer
                        </button>
                    </form>
                </div>

                {/* Table */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)]">
                                    {['Référence', 'Client', 'Artisan', 'Montant', 'Commission', 'Méthode', 'Statut', 'Date'].map((h) => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[hsl(30,20%,92%)]">
                                {paiements.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-[hsl(20,10%,55%)]">
                                            <CreditCard className="h-10 w-10 mx-auto mb-3 text-[hsl(30,20%,75%)]" />
                                            Aucune transaction
                                        </td>
                                    </tr>
                                ) : (
                                    paiements.data.map((p) => {
                                        const sc = statusConfig[p.statut] ?? statusConfig.en_attente;
                                        return (
                                            <tr key={p.id} className="hover:bg-[hsl(36,33%,97%)] transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-[hsl(20,10%,50%)]">{p.reference_transaction}</td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-[hsl(20,14%,12%)]">{p.user ? `${p.user.prenom} ${p.user.nom}` : 'N/A'}</p>
                                                </td>
                                                <td className="px-6 py-4 text-[hsl(20,10%,45%)] text-xs">
                                                    {p.reservation?.artisan?.user ? `${p.reservation.artisan.user.prenom} ${p.reservation.artisan.user.nom}` : '—'}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-[hsl(20,14%,12%)]">{Number(p.montant).toLocaleString('fr-FR')} F</td>
                                                <td className="px-6 py-4 font-medium text-amber-600">{Number(p.commission).toLocaleString('fr-FR')} F</td>
                                                <td className="px-6 py-4 text-[hsl(20,10%,50%)] text-xs">{p.methode_paiement}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}>{sc.label}</span>
                                                </td>
                                                <td className="px-6 py-4 text-xs text-[hsl(20,10%,55%)]">
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
                        <div className="flex items-center justify-between border-t border-[hsl(30,20%,88%)] px-6 py-4">
                            <p className="text-sm text-[hsl(20,10%,50%)]">Page {paiements.meta.current_page} sur {paiements.meta.last_page}</p>
                            <div className="flex gap-1">
                                {paiements.links.map((l, i) =>
                                    l.url ? (
                                        <Link key={i} href={l.url} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${l.active ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' : 'text-[hsl(20,14%,35%)] hover:bg-[hsl(36,33%,97%)]'}`}
                                            dangerouslySetInnerHTML={{ __html: l.label }} />
                                    ) : (
                                        <span key={i} className="px-3 py-1.5 text-sm text-[hsl(20,10%,65%)]" dangerouslySetInnerHTML={{ __html: l.label }} />
                                    )
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
