import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar, FileText, Star, MessageSquare,
    Heart, CreditCard, ArrowRight, Search,
    AlertTriangle, User,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Tableau de bord', href: '/client/dashboard' }];

interface Stats {
    reservations_total: number;
    reservations_en_cours: number;
    devis_en_attente: number;
    avis_donnes: number;
    depenses_total: number;
}

interface RecentReservation {
    id: number;
    statut: string;
    date: string;
    artisan_metier: string;
    artisan_nom: string;
    montant_total: number | null;
}

interface Props {
    stats?: Stats;
    recent_reservations?: RecentReservation[];
}

const STATUS: Record<string, { label: string; bg: string; text: string }> = {
    en_attente: { label: 'En attente',  bg: 'bg-amber-100',   text: 'text-amber-800' },
    en_cours:   { label: 'En cours',    bg: 'bg-blue-100',    text: 'text-blue-800' },
    confirme:   { label: 'Confirmé',    bg: 'bg-emerald-100', text: 'text-emerald-800' },
    confirmee:  { label: 'Confirmé',    bg: 'bg-emerald-100', text: 'text-emerald-800' },
    termine:    { label: 'Terminé',     bg: 'bg-[hsl(36,30%,93%)]', text: 'text-[hsl(20,14%,35%)]' },
    terminee:   { label: 'Terminé',     bg: 'bg-[hsl(36,30%,93%)]', text: 'text-[hsl(20,14%,35%)]' },
    annule:     { label: 'Annulé',      bg: 'bg-red-100',     text: 'text-red-800' },
    annulee:    { label: 'Annulé',      bg: 'bg-red-100',     text: 'text-red-800' },
    litige:     { label: 'Litige',      bg: 'bg-orange-100',  text: 'text-orange-800' },
};

export default function ClientDashboard({ stats, recent_reservations }: Props) {
    const { auth } = usePage<SharedData>().props;

    const s: Stats = {
        reservations_total:   stats?.reservations_total   ?? 0,
        reservations_en_cours: stats?.reservations_en_cours ?? 0,
        devis_en_attente:     stats?.devis_en_attente     ?? 0,
        avis_donnes:          stats?.avis_donnes          ?? 0,
        depenses_total:       stats?.depenses_total       ?? 0,
    };

    const reservations = recent_reservations ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mon Espace Client - ArtisanPro" />
            <div className="min-h-screen bg-[hsl(36,33%,97%)] p-6 space-y-6">

                {/* Welcome banner */}
                <div className="relative overflow-hidden rounded-2xl bg-[hsl(20,14%,10%)] p-8 shadow-xl">
                    <div className="absolute top-0 right-1/4 h-48 w-48 rounded-full bg-amber-500/10 blur-[60px]" />
                    <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="space-y-2">
                            <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-amber-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                Espace Client
                            </span>
                            <h1 className="text-3xl font-extrabold text-white">
                                Bonjour, {auth.user?.prenom} 👋
                            </h1>
                            <p className="text-white/50 max-w-lg">
                                Gérez vos réservations, suivez vos devis et centralisez toutes vos actions depuis cet espace.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href={route('artisans.index')}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-900/25 transition-all"
                            >
                                <Search className="h-4 w-4" />
                                Trouver un artisan
                            </Link>
                            <Link
                                href={route('client.reservations')}
                                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 hover:bg-white/15 px-5 py-2.5 text-sm font-semibold text-white transition-all"
                            >
                                Mes réservations
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: 'Réservations',    value: s.reservations_total,   sub: `${s.reservations_en_cours} en cours`, icon: Calendar,    accent: 'bg-amber-50 border-amber-100 text-amber-600' },
                        { label: 'Devis en attente', value: s.devis_en_attente,    sub: 'À traiter',                           icon: FileText,    accent: 'bg-orange-50 border-orange-100 text-orange-600' },
                        { label: 'Avis donnés',      value: s.avis_donnes,         sub: 'Évaluations',                         icon: Star,        accent: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                        { label: 'Total dépensé',    value: `${s.depenses_total.toLocaleString('fr-FR')} F`, sub: 'FCFA', icon: CreditCard, accent: 'bg-blue-50 border-blue-100 text-blue-600' },
                    ].map((stat) => (
                        <div key={stat.label} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(20,10%,50%)]">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-extrabold text-[hsl(20,14%,12%)]">{stat.value}</p>
                                    <p className="mt-1 text-xs text-[hsl(20,10%,55%)]">{stat.sub}</p>
                                </div>
                                <div className={`flex h-13 w-13 items-center justify-center rounded-2xl border ${stat.accent}`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main grid */}
                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">

                    {/* Recent reservations */}
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between border-b border-[hsl(30,20%,88%)] px-6 py-4">
                            <div>
                                <h2 className="text-base font-bold text-[hsl(20,14%,12%)]">Réservations récentes</h2>
                                <p className="text-xs text-[hsl(20,10%,50%)] mt-0.5">Suivez vos dernières demandes</p>
                            </div>
                            <Link href={route('client.reservations')} className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors">
                                Voir tout <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {reservations.length === 0 ? (
                            <div className="p-12 text-center">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 mx-auto mb-4">
                                    <Calendar className="h-7 w-7" />
                                </div>
                                <p className="text-base font-bold text-[hsl(20,14%,12%)]">Aucune réservation</p>
                                <p className="mt-1 text-sm text-[hsl(20,10%,50%)]">Commencez par trouver un artisan qualifié.</p>
                                <Link
                                    href={route('artisans.index')}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all"
                                >
                                    <Search className="h-4 w-4" />
                                    Parcourir les artisans
                                </Link>
                            </div>
                        ) : (
                            <div className="divide-y divide-[hsl(30,20%,92%)]">
                                {reservations.map((r) => {
                                    const sc = STATUS[r.statut] ?? STATUS.en_attente;
                                    return (
                                        <div key={r.id} className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-[hsl(36,33%,97%)] transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600 shrink-0">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[hsl(20,14%,12%)]">{r.artisan_metier}</p>
                                                    <p className="text-xs text-[hsl(20,10%,50%)]">{r.artisan_nom} · {r.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                {r.montant_total != null && (
                                                    <span className="text-sm font-bold text-[hsl(20,14%,12%)]">
                                                        {Number(r.montant_total).toLocaleString('fr-FR')} FCFA
                                                    </span>
                                                )}
                                                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sc.bg} ${sc.text}`}>
                                                    {sc.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Quick actions */}
                    <div className="space-y-3">
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-5 shadow-sm">
                            <h2 className="text-base font-bold text-[hsl(20,14%,12%)]">Actions rapides</h2>
                            <p className="mt-1 text-xs text-[hsl(20,10%,50%)]">Accédez vite aux principales sections.</p>
                        </div>
                        {([
                            { routeName: 'artisans.index',      icon: Search,        label: 'Trouver un artisan', desc: "Parcourir l'annuaire",    accent: 'bg-amber-50 border-amber-100 text-amber-600' },
                            { routeName: 'client.reservations', icon: Calendar,      label: 'Mes réservations',   desc: 'Suivre mes réservations', accent: 'bg-emerald-50 border-emerald-100 text-emerald-600' },
                            { routeName: 'client.devis',        icon: FileText,      label: 'Mes devis',          desc: 'Gérer mes demandes',      accent: 'bg-orange-50 border-orange-100 text-orange-600' },
                            { routeName: 'client.messages',     icon: MessageSquare, label: 'Messages',           desc: 'Conversations',           accent: 'bg-blue-50 border-blue-100 text-blue-600' },
                            { routeName: 'client.favoris',      icon: Heart,         label: 'Favoris',            desc: 'Artisans sauvegardés',    accent: 'bg-rose-50 border-rose-100 text-rose-600' },
                            { routeName: 'client.paiements',    icon: CreditCard,    label: 'Paiements',          desc: 'Historique financier',    accent: 'bg-violet-50 border-violet-100 text-violet-600' },
                            { routeName: 'client.litiges',      icon: AlertTriangle, label: 'Litiges',            desc: 'Signalements',            accent: 'bg-red-50 border-red-100 text-red-600' },
                            { routeName: 'client.profil',       icon: User,          label: 'Mon Profil',         desc: 'Mes informations',        accent: 'bg-[hsl(36,30%,93%)] border-[hsl(30,20%,82%)] text-[hsl(20,14%,35%)]' },
                        ] as const).map((action) => (
                            <Link key={action.routeName} href={route(action.routeName)}
                                className="flex items-center gap-3 rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-4 shadow-sm hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 transition-all group"
                            >
                                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${action.accent}`}>
                                    <action.icon className="h-5 w-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">{action.label}</p>
                                    <p className="text-xs text-[hsl(20,10%,55%)]">{action.desc}</p>
                                </div>
                                <ArrowRight className="h-4 w-4 text-[hsl(20,10%,65%)] group-hover:text-amber-500 transition-colors shrink-0" />
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
