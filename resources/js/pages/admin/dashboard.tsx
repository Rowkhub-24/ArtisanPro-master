import { Head, Link } from '@inertiajs/react';
import {
    Users, Wrench, Calendar, CreditCard,
    ArrowRight, BarChart3, UserCheck, UserX, Tag,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AdminLayout from '@/layouts/admin-layout';

interface Stats {
    total_users: number;
    total_clients: number;
    total_artisans: number;
    total_categories: number;
    total_devis: number;
    total_reservations: number;
    total_paiements: number;
    revenus_total: number;
    commission_total: number;
    users_actifs: number;
    users_suspendus: number;
}

interface RecentUser {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    type_utilisateur: string;
    statut: string;
    date_inscription: string;
}

interface RecentReservation {
    id: number;
    statut: string;
    montant_total: number | null;
    created_at: string;
    client: { user: { nom: string; prenom: string } | null } | null;
    artisan: { user: { nom: string; prenom: string } | null } | null;
}

interface Props {
    stats: Stats;
    recent_users: RecentUser[];
    recent_reservations: RecentReservation[];
}

const typeColors: Record<string, string> = {
    client:  'bg-blue-100 text-blue-800',
    artisan: 'bg-indigo-100 text-indigo-800',
    admin:   'bg-purple-100 text-purple-800',
};

const statutColors: Record<string, string> = {
    actif:    'bg-green-100 text-green-800',
    suspendu: 'bg-yellow-100 text-yellow-800',
    banni:    'bg-red-100 text-red-800',
};

const reservationColors: Record<string, string> = {
    en_attente: 'bg-yellow-100 text-yellow-800',
    confirme:   'bg-green-100 text-green-800',
    en_cours:   'bg-blue-100 text-blue-800',
    termine:    'bg-gray-100 text-gray-800',
    annule:     'bg-red-100 text-red-800',
};

export default function AdminDashboard({ stats, recent_users, recent_reservations }: Props) {
    return (
        <AdminLayout title="Tableau de bord">
            <Head title="Administration - ArtisanPro" />

            <div className="space-y-8">

                {/* ── Page Header ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
                        <p className="mt-1 text-gray-500">Vue d'ensemble de la plateforme ArtisanPro</p>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-2">
                        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium text-green-700">Système opérationnel</span>
                    </div>
                </div>

                {/* ── KPI Cards ───────────────────────────────────────────── */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Link href={route('admin.users.index')}>
                        <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-500">Utilisateurs</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                                        <p className="text-xs text-gray-400">{stats.users_actifs} actifs</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
                                    Voir détails <ArrowRight className="h-3 w-3" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={route('admin.artisans.index')}>
                        <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-500">Artisans</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total_artisans}</p>
                                        <p className="text-xs text-gray-400">{stats.total_clients} clients</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
                                        <Wrench className="h-6 w-6 text-indigo-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-indigo-600 transition-colors">
                                    Voir détails <ArrowRight className="h-3 w-3" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={route('admin.reservations.index')}>
                        <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-500">Réservations</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total_reservations}</p>
                                        <p className="text-xs text-gray-400">{stats.total_devis} devis</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50">
                                        <Calendar className="h-6 w-6 text-emerald-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-emerald-600 transition-colors">
                                    Voir détails <ArrowRight className="h-3 w-3" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href={route('admin.paiements.index')}>
                        <Card className="group border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-gray-500">Revenus totaux</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {stats.revenus_total.toLocaleString('fr-FR')} F
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {stats.commission_total.toLocaleString('fr-FR')} F commissions
                                        </p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50">
                                        <CreditCard className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-gray-400 group-hover:text-amber-600 transition-colors">
                                    Voir détails <ArrowRight className="h-3 w-3" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>

                {/* ── Secondary Stats ─────────────────────────────────────── */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50">
                                    <Tag className="h-5 w-5 text-violet-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Catégories</p>
                                    <p className="text-xl font-bold text-violet-600">{stats.total_categories}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                                    <UserCheck className="h-5 w-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Utilisateurs actifs</p>
                                    <p className="text-xl font-bold text-green-600">{stats.users_actifs}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                                    <UserX className="h-5 w-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Suspendus</p>
                                    <p className="text-xl font-bold text-red-600">{stats.users_suspendus}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-0 shadow-sm bg-white">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Transactions</p>
                                    <p className="text-xl font-bold text-blue-600">{stats.total_paiements}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Tables ──────────────────────────────────────────────── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Users */}
                    <Card className="border-0 shadow-md bg-white">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                            <CardTitle className="text-base font-semibold text-gray-900">Derniers inscrits</CardTitle>
                            <Link
                                href={route('admin.users.index')}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                Voir tout <ArrowRight className="h-3 w-3" />
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recent_users.length === 0 ? (
                                <p className="p-6 text-center text-sm text-gray-400">Aucun utilisateur</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {recent_users.map((u) => (
                                        <Link
                                            key={u.id}
                                            href={route('admin.users.show', u.id)}
                                            className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold shrink-0">
                                                    {u.prenom.charAt(0)}{u.nom.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{u.prenom} {u.nom}</p>
                                                    <p className="text-xs text-gray-400">{u.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Badge className={`text-xs ${typeColors[u.type_utilisateur] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {u.type_utilisateur}
                                                </Badge>
                                                <Badge className={`text-xs ${statutColors[u.statut] ?? 'bg-gray-100 text-gray-700'}`}>
                                                    {u.statut}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Reservations */}
                    <Card className="border-0 shadow-md bg-white">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
                            <CardTitle className="text-base font-semibold text-gray-900">Dernières réservations</CardTitle>
                            <Link
                                href={route('admin.reservations.index')}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                Voir tout <ArrowRight className="h-3 w-3" />
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recent_reservations.length === 0 ? (
                                <p className="p-6 text-center text-sm text-gray-400">Aucune réservation</p>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {recent_reservations.map((r) => (
                                        <div key={r.id} className="flex items-center justify-between px-6 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {r.client?.user
                                                        ? `${r.client.user.prenom} ${r.client.user.nom}`
                                                        : 'Client'}
                                                    <span className="text-gray-400 font-normal mx-1">→</span>
                                                    {r.artisan?.user
                                                        ? `${r.artisan.user.prenom} ${r.artisan.user.nom}`
                                                        : 'Artisan'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {new Date(r.created_at).toLocaleDateString('fr-FR')}
                                                    {r.montant_total
                                                        ? ` · ${Number(r.montant_total).toLocaleString('fr-FR')} FCFA`
                                                        : ''}
                                                </p>
                                            </div>
                                            <Badge className={`text-xs shrink-0 ${reservationColors[r.statut] ?? 'bg-gray-100 text-gray-700'}`}>
                                                {r.statut.replace('_', ' ')}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ── Quick Actions ────────────────────────────────────────── */}
                <Card className="border-0 shadow-md bg-white">
                    <CardHeader className="border-b border-gray-100 pb-4">
                        <CardTitle className="text-base font-semibold text-gray-900">Actions rapides</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
                            <Link
                                href={route('admin.users.index')}
                                className="group flex flex-col items-center gap-3 rounded-xl border border-gray-100 p-4 hover:border-blue-200 hover:bg-blue-50 transition-all"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                    <Users className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-blue-700">
                                    Gérer les utilisateurs
                                </span>
                            </Link>

                            <Link
                                href={route('admin.artisans.index')}
                                className="group flex flex-col items-center gap-3 rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:bg-indigo-50 transition-all"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                    <Wrench className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-indigo-700">
                                    Gérer les artisans
                                </span>
                            </Link>

                            <Link
                                href={route('admin.categories.index')}
                                className="group flex flex-col items-center gap-3 rounded-xl border border-gray-100 p-4 hover:border-violet-200 hover:bg-violet-50 transition-all"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                    <Tag className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-violet-700">
                                    Catégories
                                </span>
                            </Link>

                            <Link
                                href={route('admin.reservations.index')}
                                className="group flex flex-col items-center gap-3 rounded-xl border border-gray-100 p-4 hover:border-emerald-200 hover:bg-emerald-50 transition-all"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                    <Calendar className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-emerald-700">
                                    Réservations
                                </span>
                            </Link>

                            <Link
                                href={route('admin.paiements.index')}
                                className="group flex flex-col items-center gap-3 rounded-xl border border-gray-100 p-4 hover:border-amber-200 hover:bg-amber-50 transition-all"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600 text-white shadow-sm group-hover:scale-110 transition-transform">
                                    <CreditCard className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-medium text-gray-700 text-center group-hover:text-amber-700">
                                    Paiements
                                </span>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

            </div>
        </AdminLayout>
    );
}
