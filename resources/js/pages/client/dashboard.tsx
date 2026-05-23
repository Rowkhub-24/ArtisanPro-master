import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    FileText,
    Star,
    MessageSquare,
    Heart,
    CreditCard,
    TrendingUp,
    ArrowRight,
    Clock,
    CheckCircle,
    Search,
    Bell,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function ClientDashboard({ stats, recent_reservations }: Props) {
    const { auth } = usePage<SharedData>().props;

    const defaultStats: Stats = {
        reservations_total: stats?.reservations_total ?? 0,
        reservations_en_cours: stats?.reservations_en_cours ?? 0,
        devis_en_attente: stats?.devis_en_attente ?? 0,
        avis_donnes: stats?.avis_donnes ?? 0,
        depenses_total: stats?.depenses_total ?? 0,
    };

    const reservations = recent_reservations ?? [];

    const statusConfig: Record<string, { label: string; color: string }> = {
        en_attente:  { label: 'En attente',  color: 'bg-yellow-100 text-yellow-800' },
        en_cours:    { label: 'En cours',    color: 'bg-blue-100 text-blue-800' },
        confirme:    { label: 'Confirmé',    color: 'bg-green-100 text-green-800' },
        confirmee:   { label: 'Confirmé',    color: 'bg-green-100 text-green-800' },
        termine:     { label: 'Terminé',     color: 'bg-gray-100 text-gray-800' },
        terminee:    { label: 'Terminé',     color: 'bg-gray-100 text-gray-800' },
        annule:      { label: 'Annulé',      color: 'bg-red-100 text-red-800' },
        annulee:     { label: 'Annulé',      color: 'bg-red-100 text-red-800' },
        litige:      { label: 'Litige',      color: 'bg-orange-100 text-orange-800' },
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mon Espace Client - ArtisanPro" />
            <div className="min-h-screen bg-slate-50 p-6">
                <div className="space-y-6">
                    <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/20">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
                            <div className="max-w-2xl">
                                <p className="text-xs uppercase tracking-[0.24em] text-sky-600">Espace Client</p>
                                <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                                    Bonjour, {auth.user?.prenom}
                                </h1>
                                <p className="mt-3 text-sm leading-7 text-slate-600">
                                    Gérez vos réservations, suivez vos devis et centralisez vos actions avec un espace clair et professionnel.
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Button asChild variant="secondary" className="bg-slate-900 text-white hover:bg-slate-800 border-0">
                                    <Link href={route('artisans.index')}>
                                        <Search className="mr-2 h-4 w-4" />
                                        Trouver un artisan
                                    </Link>
                                </Button>
                                <Button asChild variant="outline" className="border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50">
                                    <Link href={route('client.reservations')}>
                                        Mes réservations
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </section>

                    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Card className="border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                            <CardHeader className="px-6 pt-6 pb-0">
                                <CardTitle className="text-sm font-semibold text-slate-900">Réservations</CardTitle>
                                <CardDescription>Vue d'ensemble des demandes</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-3xl font-semibold text-slate-900">{defaultStats.reservations_total}</p>
                                        <p className="text-xs text-slate-500 mt-2">{defaultStats.reservations_en_cours} en cours</p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-100 text-sky-600">
                                        <Calendar className="h-7 w-7" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                            <CardHeader className="px-6 pt-6 pb-0">
                                <CardTitle className="text-sm font-semibold text-slate-900">Devis en attente</CardTitle>
                                <CardDescription>Gérez vos propositions</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-3xl font-semibold text-slate-900">{defaultStats.devis_en_attente}</p>
                                        <p className="text-xs text-slate-500 mt-2">À traiter</p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-amber-100 text-amber-600">
                                        <FileText className="h-7 w-7" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                            <CardHeader className="px-6 pt-6 pb-0">
                                <CardTitle className="text-sm font-semibold text-slate-900">Avis donnés</CardTitle>
                                <CardDescription>Retour sur vos expériences</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-3xl font-semibold text-slate-900">{defaultStats.avis_donnes}</p>
                                        <p className="text-xs text-slate-500 mt-2">Évaluations</p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-600">
                                        <Star className="h-7 w-7" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
                            <CardHeader className="px-6 pt-6 pb-0">
                                <CardTitle className="text-sm font-semibold text-slate-900">Total dépensé</CardTitle>
                                <CardDescription>Budget investi</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 pt-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-3xl font-semibold text-slate-900">{defaultStats.depenses_total.toLocaleString('fr-FR')}</p>
                                        <p className="text-xs text-slate-500 mt-2">FCFA</p>
                                    </div>
                                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-violet-100 text-violet-600">
                                        <CreditCard className="h-7 w-7" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                        <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-slate-900">Réservations récentes</h2>
                                    <p className="text-sm text-slate-500">Suivez les dernières demandes en un coup d'œil.</p>
                                </div>
                                <Link href={route('client.reservations')} className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-sky-700">
                                    Voir tout <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                            <div className="divide-y divide-slate-200">
                                {reservations.length === 0 ? (
                                    <div className="p-10 text-center text-slate-500">
                                        <Calendar className="mx-auto h-12 w-12 text-slate-300" />
                                        <p className="mt-4 text-base font-semibold text-slate-900">Aucune réservation</p>
                                        <p className="mt-2 text-sm text-slate-500">Commencez par trouver un artisan qualifié.</p>
                                        <Button asChild className="mt-6 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
                                            <Link href={route('artisans.index')}>
                                                <Search className="mr-2 h-4 w-4" />
                                                Parcourir les artisans
                                            </Link>
                                        </Button>
                                    </div>
                                ) : (
                                    reservations.map((r) => {
                                        const sc = statusConfig[r.statut] ?? statusConfig.en_attente;
                                        return (
                                            <div key={r.id} className="px-6 py-5 sm:px-8">
                                                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-100 text-slate-900">
                                                            <Calendar className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-slate-900">{r.artisan_metier}</p>
                                                            <p className="text-sm text-slate-500">{r.artisan_nom} · {r.date}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-start gap-2 sm:items-end">
                                                        {r.montant_total && (
                                                            <span className="text-sm font-semibold text-slate-900">
                                                                {Number(r.montant_total).toLocaleString('fr-FR')} FCFA
                                                            </span>
                                                        )}
                                                        <Badge className={sc.color}>{sc.label}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                                <h2 className="text-xl font-semibold text-slate-900">Actions rapides</h2>
                                <p className="mt-2 text-sm text-slate-500">Accédez vite aux principales sections du tableau de bord.</p>
                            </div>
                            <div className="space-y-3">
                                {([
                                    { routeName: 'artisans.index',      icon: Search,       label: 'Trouver un artisan', color: 'bg-sky-100 text-sky-600',    desc: "Parcourir l'annuaire" },
                                    { routeName: 'client.reservations', icon: Calendar,     label: 'Mes réservations',   color: 'bg-emerald-100 text-emerald-600',  desc: 'Suivre mes réservations' },
                                    { routeName: 'client.devis',        icon: FileText,     label: 'Mes devis',          color: 'bg-amber-100 text-amber-600', desc: 'Gérer mes demandes' },
                                    { routeName: 'client.messages',     icon: MessageSquare,label: 'Messages',           color: 'bg-violet-100 text-violet-600', desc: 'Conversations' },
                                    { routeName: 'client.favoris',      icon: Heart,        label: 'Favoris',            color: 'bg-rose-100 text-rose-600',       desc: 'Artisans sauvegardés' },
                                    { routeName: 'client.paiements',    icon: CreditCard,   label: 'Paiements',          color: 'bg-indigo-100 text-indigo-600', desc: 'Historique financier' },
                                ] as const).map((action) => (
                                    <Link key={action.routeName} href={route(action.routeName)}>
                                        <Card className="border border-slate-200 bg-white shadow-sm transition hover:shadow-md hover:border-slate-300">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${action.color}`}>
                                                        <action.icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-slate-900">{action.label}</p>
                                                        <p className="text-xs text-slate-500">{action.desc}</p>
                                                    </div>
                                                    <ArrowRight className="h-4 w-4 text-slate-400" />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}
