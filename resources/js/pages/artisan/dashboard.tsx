import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar, FileText, Star, MessageSquare, CreditCard,
    TrendingUp, ArrowRight, Clock, CheckCircle, Wrench,
    Award, BarChart3, Users, Search,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function ArtisanDashboard({ stats, recent_reservations }: Props) {
    const { auth } = usePage<SharedData>().props;

    const s: Stats = {
        reservations_total:  stats?.reservations_total  ?? 0,
        reservations_en_cours: stats?.reservations_en_cours ?? 0,
        devis_en_attente:    stats?.devis_en_attente    ?? 0,
        note_moyenne:        stats?.note_moyenne        ?? 0,
        revenus_total:       stats?.revenus_total       ?? 0,
        avis_total:          stats?.avis_total          ?? 0,
    };

    const reservations = recent_reservations ?? [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Espace Artisan - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Welcome Banner */}
                <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-700 p-8 text-white shadow-xl">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="space-y-2">
                            <p className="text-indigo-200 text-sm font-medium uppercase tracking-wide">Espace Artisan</p>
                            <h1 className="text-3xl font-bold">Bonjour, {auth.user?.prenom} 👋</h1>
                            <p className="text-indigo-100 text-lg">
                                Gérez vos réservations et développez votre activité à Porto-Novo
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
                                <p className="text-2xl font-bold">{s.note_moyenne.toFixed(1)}</p>
                                <p className="text-indigo-200 text-xs">Note / 5</p>
                            </div>
                            <div className="rounded-xl bg-white/10 px-4 py-3 text-center">
                                <p className="text-2xl font-bold">{s.avis_total}</p>
                                <p className="text-indigo-200 text-xs">Avis</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {[
                        { label: 'Réservations', value: s.reservations_total, sub: `${s.reservations_en_cours} en cours`, icon: Calendar, color: 'bg-blue-100', iconColor: 'text-blue-600' },
                        { label: 'Devis en attente', value: s.devis_en_attente, sub: 'À traiter', icon: FileText, color: 'bg-yellow-100', iconColor: 'text-yellow-600' },
                        { label: 'Revenus totaux', value: `${s.revenus_total.toLocaleString('fr-FR')} F`, sub: 'FCFA', icon: CreditCard, color: 'bg-green-100', iconColor: 'text-green-600' },
                        { label: 'Note moyenne', value: `${s.note_moyenne.toFixed(1)}/5`, sub: `${s.avis_total} avis`, icon: Star, color: 'bg-purple-100', iconColor: 'text-purple-600' },
                    ].map((stat) => (
                        <Card key={stat.label} className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                                        <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                                        <p className={`text-xs mt-1 font-medium ${stat.iconColor}`}>{stat.sub}</p>
                                    </div>
                                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${stat.color}`}>
                                        <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Content */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Recent Reservations */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-900">Réservations récentes</h2>
                            <Link href={route('artisan.reservations')} className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                Voir tout <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {reservations.length === 0 ? (
                            <Card className="border-dashed border-2 border-gray-200 bg-white">
                                <CardContent className="p-10 text-center">
                                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Aucune réservation</h3>
                                    <p className="text-gray-500 mb-4">Complétez votre profil pour attirer plus de clients</p>
                                    <Button asChild className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700">
                                        <Link href={route('artisan.profil')}>Compléter mon profil</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-3">
                                {reservations.map((r) => {
                                    const sc = statusConfig[r.statut] ?? statusConfig.en_attente;
                                    return (
                                        <Card key={r.id} className="border-gray-200 bg-white hover:shadow-md transition-shadow">
                                            <CardContent className="p-5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                                                            <Calendar className="h-6 w-6 text-indigo-600" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{r.client_nom}</p>
                                                            <p className="text-sm text-gray-500">{r.date_reservation}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        {r.montant_total && (
                                                            <span className="text-sm font-semibold text-gray-900">
                                                                {Number(r.montant_total).toLocaleString('fr-FR')} FCFA
                                                            </span>
                                                        )}
                                                        <Badge className={sc.color}>{sc.label}</Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900">Actions rapides</h2>
                        <div className="space-y-3">
                            {([
                                { routeName: 'artisan.reservations', icon: Calendar,      label: 'Mes réservations', color: 'bg-blue-100 text-blue-600',    desc: 'Gérer les demandes' },
                                { routeName: 'artisan.devis',        icon: FileText,      label: 'Mes devis',        color: 'bg-yellow-100 text-yellow-600', desc: 'Demandes reçues' },
                                { routeName: 'artisan.messages',     icon: MessageSquare, label: 'Messages',         color: 'bg-purple-100 text-purple-600', desc: 'Conversations clients' },
                                { routeName: 'artisan.paiements',    icon: CreditCard,    label: 'Mes revenus',      color: 'bg-green-100 text-green-600',   desc: 'Historique financier' },
                                { routeName: 'artisan.portfolio',    icon: Award,         label: 'Portfolio',        color: 'bg-orange-100 text-orange-600', desc: 'Mes réalisations' },
                                { routeName: 'artisan.avis',         icon: Star,          label: 'Mes avis',         color: 'bg-pink-100 text-pink-600',     desc: 'Évaluations clients' },
                            ] as const).map((action) => (
                                <Link key={action.routeName} href={route(action.routeName)}>
                                    <Card className="border-gray-200 bg-white hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${action.color}`}>
                                                    <action.icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">{action.label}</p>
                                                    <p className="text-xs text-gray-500">{action.desc}</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
