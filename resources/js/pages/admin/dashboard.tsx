import { Head, Link } from '@inertiajs/react';
import { Users, Wrench, Calendar, CreditCard, ArrowRight, BarChart3, UserCheck, UserX, Tag } from 'lucide-react';

import AdminLayout from '@/layouts/admin-layout';

interface Stats {
    total_users: number; total_clients: number; total_artisans: number;
    total_categories: number; total_devis: number; total_reservations: number;
    total_paiements: number; revenus_total: number; commission_total: number;
    users_actifs: number; users_suspendus: number;
}
interface RecentUser { id: number; nom: string; prenom: string; email: string; type_utilisateur: string; statut: string; date_inscription: string; }
interface RecentReservation { id: number; statut: string; montant_total: number | null; created_at: string; client: { user: { nom: string; prenom: string } | null } | null; artisan: { user: { nom: string; prenom: string } | null } | null; }
interface Props { stats: Stats; recent_users: RecentUser[]; recent_reservations: RecentReservation[]; }

const typeColors: Record<string, string> = {
    client:  'bg-amber-100 text-amber-800',
    artisan: 'bg-orange-100 text-orange-800',
    admin:   'bg-purple-100 text-purple-800',
};
const statutColors: Record<string, string> = {
    actif:    'bg-emerald-100 text-emerald-800',
    suspendu: 'bg-yellow-100 text-yellow-800',
    banni:    'bg-red-100 text-red-800',
};
const reservationColors: Record<string, string> = {
    en_attente: 'bg-amber-100 text-amber-800',
    confirme:   'bg-emerald-100 text-emerald-800',
    confirmee:  'bg-emerald-100 text-emerald-800',
    en_cours:   'bg-blue-100 text-blue-800',
    termine:    'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]',
    terminee:   'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]',
    annule:     'bg-red-100 text-red-800',
    annulee:    'bg-red-100 text-red-800',
};

export default function AdminDashboard({ stats, recent_users, recent_reservations }: Props) {
    return (
        <AdminLayout title="Tableau de bord">
            <Head title="Administration - ArtisanPro" />
            <div className="space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-[hsl(20,14%,12%)]">Tableau de bord</h1>
                        <p className="mt-1 text-[hsl(20,10%,50%)]">Vue d&apos;ensemble de la plateforme ArtisanPro</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-sm font-medium text-emerald-700">Système opérationnel</span>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { href: route('admin.users.index'),        label: 'Utilisateurs',   value: stats.total_users,   sub: `${stats.users_actifs} actifs`,                                          icon: Users,      accent: 'bg-amber-50 border-amber-100 text-amber-600',    hover: 'group-hover:text-amber-600' },
                        { href: route('admin.artisans.index'),     label: 'Artisans',       value: stats.total_artisans, sub: `${stats.total_clients} clients`,                                       icon: Wrench,     accent: 'bg-orange-50 border-orange-100 text-orange-600',  hover: 'group-hover:text-orange-600' },
                        { href: route('admin.reservations.index'), label: 'Réservations',   value: stats.total_reservations, sub: `${stats.total_devis} devis`,                                      icon: Calendar,   accent: 'bg-emerald-50 border-emerald-100 text-emerald-600', hover: 'group-hover:text-emerald-600' },
                        { href: route('admin.paiements.index'),    label: 'Revenus totaux', value: `${stats.revenus_total.toLocaleString('fr-FR')} F`, sub: `${stats.commission_total.toLocaleString('fr-FR')} F commissions`, icon: CreditCard, accent: 'bg-amber-50 border-amber-100 text-amber-600', hover: 'group-hover:text-amber-600' },
                    ].map((kpi) => (
                        <Link key={kpi.label} href={kpi.href}>
                            <div className="group rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-[hsl(20,10%,50%)]">{kpi.label}</p>
                                        <p className="text-2xl font-bold text-[hsl(20,14%,12%)]">{kpi.value}</p>
                                        <p className="text-xs text-[hsl(20,10%,60%)]">{kpi.sub}</p>
                                    </div>
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl border ${kpi.accent}`}>
                                        <kpi.icon className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className={`mt-4 flex items-center gap-1 text-xs font-medium text-[hsl(20,10%,55%)] transition-colors ${kpi.hover}`}>
                                    Voir détails <ArrowRight className="h-3 w-3" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Secondary Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        { label: 'Catégories',         value: stats.total_categories, icon: Tag,       accent: 'bg-violet-50 border-violet-100 text-violet-600',  val: 'text-violet-600' },
                        { label: 'Utilisateurs actifs', value: stats.users_actifs,    icon: UserCheck, accent: 'bg-emerald-50 border-emerald-100 text-emerald-600', val: 'text-emerald-600' },
                        { label: 'Suspendus',           value: stats.users_suspendus, icon: UserX,     accent: 'bg-red-50 border-red-100 text-red-600',            val: 'text-red-600' },
                        { label: 'Transactions',        value: stats.total_paiements, icon: BarChart3, accent: 'bg-amber-50 border-amber-100 text-amber-600',      val: 'text-amber-600' },
                    ].map((s) => (
                        <div key={s.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${s.accent}`}>
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-[hsl(20,10%,50%)]">{s.label}</p>
                                    <p className={`text-xl font-bold ${s.val}`}>{s.value}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Tables */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Users */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-[hsl(30,20%,88%)] px-6 py-4">
                            <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Derniers inscrits</h2>
                            <Link href={route('admin.users.index')} className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
                                Voir tout <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {recent_users.length === 0 ? (
                            <p className="p-6 text-center text-sm text-[hsl(20,10%,55%)]">Aucun utilisateur</p>
                        ) : (
                            <div className="divide-y divide-[hsl(30,20%,92%)]">
                                {recent_users.map((u) => (
                                    <Link key={u.id} href={route('admin.users.show', u.id)}
                                        className="flex items-center justify-between px-6 py-3 hover:bg-[hsl(36,33%,97%)] transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-xs font-bold shrink-0">
                                                {u.prenom.charAt(0)}{u.nom.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-[hsl(20,14%,12%)]">{u.prenom} {u.nom}</p>
                                                <p className="text-xs text-[hsl(20,10%,55%)]">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeColors[u.type_utilisateur] ?? 'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]'}`}>
                                                {u.type_utilisateur}
                                            </span>
                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statutColors[u.statut] ?? 'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]'}`}>
                                                {u.statut}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Reservations */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-[hsl(30,20%,88%)] px-6 py-4">
                            <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Dernières réservations</h2>
                            <Link href={route('admin.reservations.index')} className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1">
                                Voir tout <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        {recent_reservations.length === 0 ? (
                            <p className="p-6 text-center text-sm text-[hsl(20,10%,55%)]">Aucune réservation</p>
                        ) : (
                            <div className="divide-y divide-[hsl(30,20%,92%)]">
                                {recent_reservations.map((r) => (
                                    <div key={r.id} className="flex items-center justify-between px-6 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                                {r.client?.user ? `${r.client.user.prenom} ${r.client.user.nom}` : 'Client'}
                                                <span className="text-[hsl(20,10%,55%)] font-normal mx-1">→</span>
                                                {r.artisan?.user ? `${r.artisan.user.prenom} ${r.artisan.user.nom}` : 'Artisan'}
                                            </p>
                                            <p className="text-xs text-[hsl(20,10%,55%)]">
                                                {new Date(r.created_at).toLocaleDateString('fr-FR')}
                                                {r.montant_total ? ` · ${Number(r.montant_total).toLocaleString('fr-FR')} FCFA` : ''}
                                            </p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${reservationColors[r.statut] ?? 'bg-[hsl(36,30%,93%)] text-[hsl(20,14%,35%)]'}`}>
                                            {r.statut.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                    <h2 className="text-base font-semibold text-[hsl(20,14%,12%)] mb-5">Actions rapides</h2>
                    <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                        {[
                            { href: route('admin.users.index'),        icon: Users,     label: 'Gérer les utilisateurs', accent: 'bg-amber-500',   hover: 'hover:border-amber-200 hover:bg-amber-50', text: 'group-hover:text-amber-700' },
                            { href: route('admin.artisans.index'),     icon: Wrench,    label: 'Gérer les artisans',     accent: 'bg-orange-500',  hover: 'hover:border-orange-200 hover:bg-orange-50', text: 'group-hover:text-orange-700' },
                            { href: route('admin.categories.index'),   icon: Tag,       label: 'Catégories',             accent: 'bg-violet-500',  hover: 'hover:border-violet-200 hover:bg-violet-50', text: 'group-hover:text-violet-700' },
                            { href: route('admin.reservations.index'), icon: Calendar,  label: 'Réservations',           accent: 'bg-emerald-500', hover: 'hover:border-emerald-200 hover:bg-emerald-50', text: 'group-hover:text-emerald-700' },
                            { href: route('admin.paiements.index'),    icon: CreditCard,label: 'Paiements',              accent: 'bg-amber-600',   hover: 'hover:border-amber-200 hover:bg-amber-50', text: 'group-hover:text-amber-700' },
                        ].map((action) => (
                            <Link key={action.label} href={action.href}
                                className={`group flex flex-col items-center gap-3 rounded-xl border border-[hsl(30,20%,88%)] p-4 transition-all ${action.hover}`}>
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.accent} text-white shadow-sm group-hover:scale-110 transition-transform`}>
                                    <action.icon className="h-6 w-6" />
                                </div>
                                <span className={`text-xs font-medium text-[hsl(20,14%,35%)] text-center transition-colors ${action.text}`}>
                                    {action.label}
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
