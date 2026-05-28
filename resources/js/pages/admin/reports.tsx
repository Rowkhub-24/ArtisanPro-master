import { Head } from '@inertiajs/react';
import {
    Users, Wrench, Calendar, CreditCard, Star, AlertTriangle,
    TrendingUp, CheckCircle, BarChart3,
} from 'lucide-react';
import AdminLayout from '@/layouts/admin-layout';

interface Kpis {
    total_users: number;
    total_artisans: number;
    total_clients: number;
    total_reservations: number;
    reservations_terminees: number;
    total_paiements: number;
    revenus_total: number;
    total_avis: number;
    note_moyenne_plateforme: number;
    total_litiges: number;
    litiges_ouverts: number;
    litiges_resolus: number;
}

interface MoisData { mois: string; total?: number; nb: number; clients?: number; artisans?: number; }
interface StatutData { statut: string; nb: number; }
interface ArtisanTop { nom: string; metier: string; note_moyenne: number; badge: string; reservations_count: number; }
interface MethodeData { methode: string; nb: number; total: number; }

interface Props {
    kpis: Kpis;
    revenus_par_mois: MoisData[];
    inscriptions_par_mois: MoisData[];
    reservations_par_statut: StatutData[];
    top_artisans: ArtisanTop[];
    methodes_paiement: MethodeData[];
}

const badgeColors: Record<string, string> = {
    elite:    'bg-purple-100 text-purple-800',
    certifie: 'bg-amber-100 text-amber-800',
    aucun:    'bg-gray-100 text-gray-600',
};

const statutColors: Record<string, string> = {
    en_cours:  'bg-blue-100 text-blue-800',
    en_attente:'bg-amber-100 text-amber-800',
    confirmee: 'bg-emerald-100 text-emerald-800',
    confirme:  'bg-emerald-100 text-emerald-800',
    terminee:  'bg-gray-100 text-gray-700',
    termine:   'bg-gray-100 text-gray-700',
    annulee:   'bg-red-100 text-red-800',
    annule:    'bg-red-100 text-red-800',
    litige:    'bg-orange-100 text-orange-800',
};

function formatMois(mois: string): string {
    const [year, month] = mois.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

function BarChart({ data, valueKey, labelKey, color = 'bg-amber-500' }: {
    data: Record<string, unknown>[];
    valueKey: string;
    labelKey: string;
    color?: string;
}) {
    const max = Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
    return (
        <div className="space-y-2">
            {data.map((d, i) => {
                const val = Number(d[valueKey]) || 0;
                const pct = (val / max) * 100;
                return (
                    <div key={i} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-16 shrink-0 text-right">{String(d[labelKey])}</span>
                        <div className="flex-1 h-6 bg-gray-100 rounded-lg overflow-hidden">
                            <div
                                className={`h-full ${color} rounded-lg transition-all duration-500 flex items-center justify-end pr-2`}
                                style={{ width: `${pct}%` }}
                            >
                                {pct > 20 && (
                                    <span className="text-xs font-semibold text-white">
                                        {val.toLocaleString('fr-FR')}
                                    </span>
                                )}
                            </div>
                        </div>
                        {pct <= 20 && (
                            <span className="text-xs font-semibold text-gray-700 w-16">{val.toLocaleString('fr-FR')}</span>
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function AdminReports({
    kpis,
    revenus_par_mois,
    inscriptions_par_mois,
    reservations_par_statut,
    top_artisans,
    methodes_paiement,
}: Props) {
    const tauxCompletion = kpis.total_reservations > 0
        ? Math.round((kpis.reservations_terminees / kpis.total_reservations) * 100)
        : 0;

    const tauxResolutionLitiges = kpis.total_litiges > 0
        ? Math.round((kpis.litiges_resolus / kpis.total_litiges) * 100)
        : 0;

    return (
        <AdminLayout title="Rapports">
            <Head title="Rapports - ArtisanPro" />
            <div className="space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">Rapports & Analytiques</h1>
                    <p className="text-sm text-[hsl(20,10%,50%)] mt-1">Vue d'ensemble des performances de la plateforme</p>
                </div>

                {/* KPI Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Utilisateurs',    value: kpis.total_users,    sub: `${kpis.total_artisans} artisans · ${kpis.total_clients} clients`, icon: Users,       color: 'bg-amber-50 border-amber-100 text-amber-600' },
                        { label: 'Réservations',    value: kpis.total_reservations, sub: `${tauxCompletion}% taux de complétion`, icon: Calendar,    color: 'bg-blue-50 border-blue-100 text-blue-600' },
                        { label: 'Revenus totaux',  value: `${kpis.revenus_total.toLocaleString('fr-FR')} F`, sub: `${kpis.total_paiements} transactions`, icon: CreditCard,  color: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                        { label: 'Note plateforme', value: `${kpis.note_moyenne_plateforme}/5`, sub: `${kpis.total_avis} avis`, icon: Star,         color: 'bg-orange-50 border-orange-100 text-orange-600' },
                    ].map((kpi) => (
                        <div key={kpi.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs text-gray-500">{kpi.label}</p>
                                    <p className="text-2xl font-bold text-[hsl(20,14%,12%)] mt-1">{kpi.value}</p>
                                    <p className="text-xs text-gray-400 mt-1">{kpi.sub}</p>
                                </div>
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${kpi.color}`}>
                                    <kpi.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Secondary KPIs */}
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-600">
                                <AlertTriangle className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Litiges</p>
                                <p className="text-xl font-bold text-[hsl(20,14%,12%)]">{kpis.total_litiges}</p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                                <span className="text-red-600">Ouverts</span>
                                <span className="font-semibold">{kpis.litiges_ouverts}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-emerald-600">Résolus</span>
                                <span className="font-semibold">{kpis.litiges_resolus}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-gray-500">Taux résolution</span>
                                <span className="font-semibold">{tauxResolutionLitiges}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                                <CheckCircle className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500">Réservations terminées</p>
                                <p className="text-xl font-bold text-[hsl(20,14%,12%)]">{kpis.reservations_terminees}</p>
                            </div>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" style={{ width: `${tauxCompletion}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">{tauxCompletion}% des réservations complétées</p>
                    </div>

                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                <TrendingUp className="h-4 w-4" />
                            </div>
                            <p className="text-xs text-gray-500 font-medium">Méthodes de paiement</p>
                        </div>
                        <div className="space-y-1.5">
                            {methodes_paiement.slice(0, 4).map((m) => (
                                <div key={m.methode} className="flex justify-between text-xs">
                                    <span className="text-gray-600 capitalize">{m.methode.replace('_', ' ')}</span>
                                    <span className="font-semibold">{m.nb} ({m.total.toLocaleString('fr-FR')} F)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Charts Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Revenus par mois */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <h2 className="text-base font-semibold text-[hsl(20,14%,12%)] mb-5 flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-amber-500" />
                            Revenus — 6 derniers mois
                        </h2>
                        {revenus_par_mois.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
                        ) : (
                            <BarChart
                                data={revenus_par_mois.map(d => ({ ...d, mois: formatMois(d.mois) }))}
                                valueKey="total"
                                labelKey="mois"
                                color="bg-gradient-to-r from-amber-400 to-orange-500"
                            />
                        )}
                    </div>

                    {/* Inscriptions par mois */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <h2 className="text-base font-semibold text-[hsl(20,14%,12%)] mb-5 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Inscriptions — 6 derniers mois
                        </h2>
                        {inscriptions_par_mois.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
                        ) : (
                            <BarChart
                                data={inscriptions_par_mois.map(d => ({ ...d, mois: formatMois(d.mois) }))}
                                valueKey="nb"
                                labelKey="mois"
                                color="bg-blue-500"
                            />
                        )}
                    </div>
                </div>

                {/* Bottom Row */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Réservations par statut */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <h2 className="text-base font-semibold text-[hsl(20,14%,12%)] mb-5 flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-emerald-500" />
                            Réservations par statut
                        </h2>
                        {reservations_par_statut.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
                        ) : (
                            <div className="space-y-2">
                                {reservations_par_statut.map((r) => (
                                    <div key={r.statut} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statutColors[r.statut] ?? 'bg-gray-100 text-gray-600'}`}>
                                            {r.statut.replace('_', ' ')}
                                        </span>
                                        <span className="text-sm font-bold text-[hsl(20,14%,12%)]">{r.nb}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Top artisans */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                        <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4 flex items-center gap-2">
                            <Wrench className="h-4 w-4 text-amber-500" />
                            <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Top 10 artisans</h2>
                        </div>
                        {top_artisans.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-8">Aucune donnée</p>
                        ) : (
                            <div className="divide-y divide-[hsl(30,20%,92%)]">
                                {top_artisans.map((a, i) => (
                                    <div key={i} className="flex items-center justify-between px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                                            <div>
                                                <p className="text-sm font-medium text-[hsl(20,14%,12%)]">{a.nom}</p>
                                                <p className="text-xs text-gray-400">{a.metier}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <span className="text-xs text-gray-500">{a.reservations_count} rés.</span>
                                            <div className="flex items-center gap-1">
                                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                <span className="text-xs font-bold">{Number(a.note_moyenne).toFixed(1)}</span>
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badgeColors[a.badge] ?? 'bg-gray-100 text-gray-600'}`}>
                                                {a.badge}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
