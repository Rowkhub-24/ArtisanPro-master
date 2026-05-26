import { Head, Link, router } from '@inertiajs/react';
import { Search, Filter, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { FormEventHandler } from 'react';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/admin-layout';

interface Reservation {
    id: number; statut: string; montant_total: number | null; created_at: string;
    client: { user: { nom: string; prenom: string; email: string } | null } | null;
    artisan: { metier: string; user: { nom: string; prenom: string } | null } | null;
}
interface Stats { total: number; en_attente: number; en_cours: number; termine: number; annule: number; }
interface Paginated<T> { data: T[]; links: { url: string | null; label: string; active: boolean }[]; meta: { current_page: number; last_page: number; total: number }; }
interface Props { reservations: Paginated<Reservation>; stats: Stats; filters: { q?: string; statut?: string }; }

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ElementType }> = {
    en_attente: { label: 'En attente', bg: 'bg-amber-100',   text: 'text-amber-800',   icon: Clock },
    confirme:   { label: 'Confirmé',   bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle },
    confirmee:  { label: 'Confirmée',  bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle },
    en_cours:   { label: 'En cours',   bg: 'bg-blue-100',    text: 'text-blue-800',    icon: Clock },
    termine:    { label: 'Terminé',    bg: 'bg-[hsl(36,30%,93%)]', text: 'text-[hsl(20,14%,35%)]', icon: CheckCircle },
    terminee:   { label: 'Terminée',   bg: 'bg-[hsl(36,30%,93%)]', text: 'text-[hsl(20,14%,35%)]', icon: CheckCircle },
    annule:     { label: 'Annulé',     bg: 'bg-red-100',     text: 'text-red-800',     icon: XCircle },
    annulee:    { label: 'Annulée',    bg: 'bg-red-100',     text: 'text-red-800',     icon: XCircle },
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
                    <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">Réservations</h1>
                    <p className="text-sm text-[hsl(20,10%,50%)] mt-1">{reservations.meta.total} réservations au total</p>
                </div>

                {/* Stats */}
                <div className="grid gap-3 md:grid-cols-5">
                    {[
                        { label: 'Total',      value: stats.total,      bg: 'bg-[hsl(36,30%,93%)]',  border: 'border-[hsl(30,20%,82%)]', color: 'text-[hsl(20,14%,12%)]' },
                        { label: 'En attente', value: stats.en_attente, bg: 'bg-amber-50',            border: 'border-amber-200',          color: 'text-amber-700' },
                        { label: 'En cours',   value: stats.en_cours,   bg: 'bg-blue-50',             border: 'border-blue-200',           color: 'text-blue-700' },
                        { label: 'Terminées',  value: stats.termine,    bg: 'bg-emerald-50',          border: 'border-emerald-200',        color: 'text-emerald-700' },
                        { label: 'Annulées',   value: stats.annule,     bg: 'bg-red-50',              border: 'border-red-200',            color: 'text-red-700' },
                    ].map((s) => (
                        <div key={s.label} className={`rounded-xl border ${s.border} ${s.bg} p-4 text-center`}>
                            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                            <p className="text-xs text-[hsl(20,10%,50%)] mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-4">
                    <form onSubmit={submit} className="flex flex-wrap gap-3">
                        <div className="relative flex-1 min-w-48">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(20,10%,55%)]" />
                            <Input name="q" defaultValue={filters.q} placeholder="Nom du client..."
                                className="pl-9 rounded-xl border-[hsl(30,20%,82%)] focus:border-amber-400" />
                        </div>
                        <select name="statut" defaultValue={filters.statut ?? ''}
                            className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-sm text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none">
                            <option value="">Tous les statuts</option>
                            {Object.entries(statusConfig).filter(([k]) => !k.endsWith('ee') || k === 'confirmee').map(([k, v]) => (
                                <option key={k} value={k}>{v.label}</option>
                            ))}
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
                                    {['Client', 'Artisan', 'Statut', 'Montant', 'Date'].map((h) => (
                                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[hsl(30,20%,92%)]">
                                {reservations.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-[hsl(20,10%,55%)]">
                                            <Calendar className="h-10 w-10 mx-auto mb-3 text-[hsl(30,20%,75%)]" />
                                            Aucune réservation trouvée
                                        </td>
                                    </tr>
                                ) : (
                                    reservations.data.map((r) => {
                                        const sc = statusConfig[r.statut] ?? statusConfig.en_attente;
                                        const Icon = sc.icon;
                                        return (
                                            <tr key={r.id} className="hover:bg-[hsl(36,33%,97%)] transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-[hsl(20,14%,12%)]">{r.client?.user ? `${r.client.user.prenom} ${r.client.user.nom}` : 'N/A'}</p>
                                                    <p className="text-xs text-[hsl(20,10%,55%)]">{r.client?.user?.email}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-medium text-[hsl(20,14%,12%)]">{r.artisan?.metier ?? 'N/A'}</p>
                                                    <p className="text-xs text-[hsl(20,10%,55%)]">{r.artisan?.user ? `${r.artisan.user.prenom} ${r.artisan.user.nom}` : ''}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}>
                                                        <Icon className="h-3 w-3" />{sc.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-[hsl(20,14%,12%)]">
                                                    {r.montant_total ? `${Number(r.montant_total).toLocaleString('fr-FR')} F` : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-[hsl(20,10%,55%)]">
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
                        <div className="flex items-center justify-between border-t border-[hsl(30,20%,88%)] px-6 py-4">
                            <p className="text-sm text-[hsl(20,10%,50%)]">Page {reservations.meta.current_page} sur {reservations.meta.last_page}</p>
                            <div className="flex gap-1">
                                {reservations.links.map((l, i) =>
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
