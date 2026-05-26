import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar, FileText, Star, MessageSquare, CreditCard,
    TrendingUp, ArrowRight, Clock, CheckCircle,
    Award, BarChart3,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tableau de bord', href: '/artisan/dashboard' }];

interface Stats {
    reservations_total: number;
    reservations_en_cours: number;
    devis_en_attente: number;
    note_moyenne: number;
    revenus_total: number;
    avis_total: number;
}

interface RecentReservation {
    id: number;
    statut: string;
    date_reservation: string;
    client_nom: string;
    montant_total: number | null;
}

interface Props {
    stats?: Stats;
    recent_reservations?: RecentReservation[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
    en_attente:  { label: 'En attente',  color: 'bg-amber-100 text-amber-800 border border-amber-200' },
    en_cours:    { label: 'En cours',    color: 'bg-blue-100 text-blue-800 border border-blue-200' },
    confirme:    { label: 'Confirmé',    color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    confirmee:   { label: 'Confirmé',    color: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
    termine:     { label: 'Terminé',     color: 'bg-gray-100 text-gray-700 border border-gray-200' },
    terminee:    { label: 'Terminé',     color: 'bg-gray-100 text-gray-700 border border-gray-200' },
    annule:      { label: 'Annulé',      color: 'bg-red-100 text-red-800 border border-red-200' },
    annulee:     { label: 'Annulé',      color: 'bg-red-100 text-red-800 border border-red-200' },
    litige:      { label: 'Litige',      color: 'bg-amber-100 text-amber-800 border border-amber-200' },
};

export default function ArtisanDashboard({ stats, recent_reservations }: Props) {
    const { auth } = usePage<SharedData>().props;

    const s: Stats = {
        reservations_total:   stats?.reservations_total   ?? 0,
        reservations_en_cours: stats?.reservations_en_cours ?? 0,
        devis_en_attente:     stats?.devis_en_attente     ?? 0,
        note_moyenne:         stats?.note_moyenne         ?? 0,
        revenus_total:        stats?.revenus_total        ?? 0,
        avis_total:           stats?.avis_total           ?? 0,
    };

    const reservations = recent_reservations ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Espace Artisan - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Welcome Banner — dark with amber accents */}
                <div className="rounded-2xl bg-[hsl(20,14%,10%)] p-8 text-white shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center rounded-full bg-amber-500/20 border border-amber-500/30 px-4 py-1.5">
                                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Espace Artisan</span>
                            </div>
                            <h1 className="text-3xl font-bold">Bonjour, {auth.user?.prenom} 👋</h1>
                            <p className="text-[hsl(20,10%,65%)] text-lg">
                                Gérez vos réservations et développez votre activité à Porto-Novo
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
                                <p className="text-2xl font-bold text-amber-400">{s.note_moyenne.toFixed(1)}</p>
                                <p className="text-[hsl(20,10%,60%)] text-xs">Note / 5</p>
                            </div>
                            <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
                                <p className="text-2xl font-bold">{s.avis_total}</p>
                                <p className="text-[hsl(20,10%,60%)] text-xs">Avis</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Réservations',    value: s.reservations_total,                              sub: `${s.reservations_en_cours} en cours`, icon: Calendar,   bg: 'bg-amber-100',   iconColor: 'text-amber-600',   subColor: 'text-amber-600' },
                        { label: 'Devis en attente', value: s.devis_en_attente,                               sub: 'À traiter',                           icon: FileText,   bg: 'bg-orange-100',  iconColor: 'text-orange-600',  subColor: 'text-orange-600' },
                        { label: 'Revenus totaux',   value: `${s.revenus_total.toLocaleString('fr-FR')} F`,   sub: 'FCFA',                                icon: CreditCard, bg: 'bg-emerald-100', iconColor: 'text-emerald-600', subColor: 'text-emerald-600' },
                        { label: 'Note moyenne',     value: `${s.note_moyenne.toFixed(1)}/5`,                 sub: `${s.avis_total} avis`,                icon: Star,       bg: 'bg-blue-100',    iconColor: 'text-blue-600',    subColor: 'text-blue-600' },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-[hsl(20,10%,50%)]">{stat.label}</p>
                                    <p className="text-2xl font-bold text-[hsl(20,14%,12%)] mt-1">{stat.value}</p>
                                    <p className={`text-xs mt-1 font-medium ${stat.subColor}`}>{stat.sub}</p>
                                </div>
                                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.bg}`}>
                                    <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Recent Reservations */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-[hsl(20,14%,12%)]">Réservations récentes</h2>
                            <Link
                                href={route('artisan.reservations')}
                                className="text-sm font-medium text-amber-600 hover:text-amber-700 flex items-center gap-1 transition-colors"
                            >
                                Voir tout <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {reservations.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,88%)] bg-white p-10 text-center">
                                <Calendar className="h-12 w-12 text-[hsl(20,10%,50%)] mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)] mb-2">Aucune réservation</h3>
                                <p className="text-[hsl(20,10%,50%)] mb-4">Complétez votre profil pour attirer plus de clients</p>
                                <Link
                                    href={route('artisan.profil')}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all"
                                >
                                    Compléter mon profil
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {reservations.map((r) => {
                                    const sc = statusConfig[r.statut] ?? statusConfig.en_attente;
                                    return (
                                        <div key={r.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-shadow p-5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                                                        <Calendar className="h-6 w-6 text-amber-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[hsl(20,14%,12%)]">{r.client_nom}</p>
                                                        <p className="text-sm text-[hsl(20,10%,50%)]">{r.date_reservation}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {r.montant_total && (
                                                        <span className="text-sm font-semibold text-[hsl(20,14%,12%)]">
                                                            {Number(r.montant_total).toLocaleString('fr-FR')} FCFA
                                                        </span>
                                                    )}
                                                    <Badge className={sc.color}>{sc.label}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-[hsl(20,14%,12%)]">Actions rapides</h2>
                        <div className="space-y-3">
                            {([
                                { routeName: 'artisan.reservations', icon: Calendar,      label: 'Mes réservations', color: 'bg-amber-100 text-amber-600',    desc: 'Gérer les demandes' },
                                { routeName: 'artisan.devis',        icon: FileText,      label: 'Mes devis',        color: 'bg-orange-100 text-orange-600',  desc: 'Demandes reçues' },
                                { routeName: 'artisan.messages',     icon: MessageSquare, label: 'Messages',         color: 'bg-blue-100 text-blue-600',      desc: 'Conversations clients' },
                                { routeName: 'artisan.paiements',    icon: CreditCard,    label: 'Mes revenus',      color: 'bg-emerald-100 text-emerald-600', desc: 'Historique financier' },
                                { routeName: 'artisan.portfolio',    icon: Award,         label: 'Portfolio',        color: 'bg-amber-100 text-amber-600',    desc: 'Mes réalisations' },
                                { routeName: 'artisan.avis',         icon: Star,          label: 'Mes avis',         color: 'bg-orange-100 text-orange-600',  desc: 'Évaluations clients' },
                            ] as const).map((action) => (
                                <Link key={action.routeName} href={route(action.routeName)}>
                                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.color}`}>
                                                <action.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">{action.label}</p>
                                                <p className="text-xs text-[hsl(20,10%,50%)]">{action.desc}</p>
                                            </div>
                                            <ArrowRight className="h-4 w-4 text-[hsl(20,10%,50%)] group-hover:text-amber-600 transition-colors" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
