import { Head, Link, router } from '@inertiajs/react';
import { Calendar, Clock, CheckCircle, XCircle, ArrowLeft, Search, Eye, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Réservations', href: '/artisan/reservations' },
];

interface Reservation {
    id: number;
    statut: 'en_cours' | 'confirmee' | 'terminee' | 'annulee' | 'litige' | string;
    date_reservation: string;
    montant_total: number | null;
    adresse_intervention: string | null;
    client: {
        user: { prenom: string; nom: string; telephone: string | null; email: string };
    } | null;
}

interface Props {
    reservations?: Reservation[];
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    en_cours:   { label: 'En cours',    color: 'bg-blue-100 text-blue-800',    icon: <Clock className="h-4 w-4 text-blue-600" /> },
    confirmee:  { label: 'Confirmée',   color: 'bg-green-100 text-green-800',  icon: <CheckCircle className="h-4 w-4 text-green-600" /> },
    terminee:   { label: 'Terminée',    color: 'bg-gray-100 text-gray-800',    icon: <CheckCircle className="h-4 w-4 text-gray-600" /> },
    annulee:    { label: 'Annulée',     color: 'bg-red-100 text-red-800',      icon: <XCircle className="h-4 w-4 text-red-600" /> },
    litige:     { label: 'Litige',      color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="h-4 w-4 text-yellow-600" /> },
};

export default function ArtisanReservations({ reservations = [] }: Props) {
    const handleUpdateStatus = (reservationId: number, statut: 'confirmee' | 'annulee') => {
        if (!window.confirm(`Êtes-vous sûr de vouloir ${statut === 'confirmee' ? 'confirmer' : 'refuser'} cette réservation ?`)) {
            return;
        }

        // Envoi de la valeur d'ENUM canonique à la route
        router.patch(route('artisan.reservations.statut', reservationId), { statut }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Réservations - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                        <Link href={route('artisan.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mes Réservations</h1>
                            <p className="mt-1 text-gray-600">Gérez les demandes de vos clients</p>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input placeholder="Rechercher..." className="pl-10 w-64 border-gray-300 bg-white" />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-5">
                    {[
                        { label: 'Total', value: reservations.length, color: 'text-gray-900', icon: Calendar },
                        { label: 'En cours', value: reservations.filter(r => ['en_cours', 'en_attente'].includes(r.statut ?? '')).length, color: 'text-blue-600', icon: Clock },
                        { label: 'Confirmées', value: reservations.filter(r => ['confirmee', 'confirme'].includes(r.statut ?? '')).length, color: 'text-green-600', icon: CheckCircle },
                        { label: 'Terminées', value: reservations.filter(r => ['terminee', 'termine'].includes(r.statut ?? '')).length, color: 'text-gray-600', icon: CheckCircle },
                        { label: 'Annulées', value: reservations.filter(r => ['annulee', 'annule'].includes(r.statut ?? '')).length, color: 'text-red-600', icon: XCircle },
                    ].map((s) => (
                        <Card key={s.label} className="border-0 shadow-lg bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">{s.label}</p>
                                        <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                                    </div>
                                    <s.icon className={`h-8 w-8 ${s.color}`} />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-4">
                    {reservations.length === 0 ? (
                        <Card className="border-dashed border-2 border-gray-200 bg-white">
                            <CardContent className="p-12 text-center">
                                <Calendar className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune réservation</h3>
                                <p className="text-gray-500">Les demandes de vos clients apparaîtront ici</p>
                            </CardContent>
                        </Card>
                    ) : (
                        reservations.map((r) => {
                            const normalizedStatus = (s: any) => {
                                const map: Record<string, string> = {
                                    'en_attente': 'en_cours',
                                    'confirme': 'confirmee',
                                    'annule': 'annulee',
                                    'termine': 'terminee',
                                };
                                return map[s] ?? s;
                            };
                            const displayStatus = normalizedStatus(r.statut);
                            const sc = statusConfig[displayStatus] ?? statusConfig.en_cours;
                            return (
                                <Card key={r.id} className="border-gray-200 bg-white hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4 flex-wrap">
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 shrink-0">
                                                    <Calendar className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-3 mb-1">
                                                        {sc.icon}
                                                        <Badge className={sc.color}>{sc.label}</Badge>
                                                        <span className="text-sm text-gray-400">{r.date_reservation}</span>
                                                    </div>
                                                    <h3 className="font-semibold text-gray-900 text-lg">
                                                        {r.client?.user ? `${r.client.user.prenom} ${r.client.user.nom}` : 'Client'}
                                                    </h3>
                                                    {r.client?.user.telephone && (
                                                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                                                            <Phone className="h-3.5 w-3.5" />
                                                            {r.client.user.telephone}
                                                        </p>
                                                    )}
                                                    {r.adresse_intervention && (
                                                        <p className="text-sm text-gray-500 mt-1">{r.adresse_intervention}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {r.montant_total && (
                                                    <div className="text-right">
                                                        <p className="text-lg font-bold text-gray-900">
                                                            {Number(r.montant_total).toLocaleString('fr-FR')} FCFA
                                                        </p>
                                                    </div>
                                                )}
                                                {['en_attente', 'en_cours'].includes(r.statut ?? '') && (
                                                    <>
                                                        <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleUpdateStatus(r.id, 'confirmee')}>
                                                            Confirmer
                                                        </Button>
                                                        <Button type="button" size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => handleUpdateStatus(r.id, 'annulee')}>
                                                            Refuser
                                                        </Button>
                                                    </>
                                                )}
                                                <Button asChild size="sm" variant="outline">
                                                    <Link href={route('artisan.reservations.show', r.id)}>
                                                        <Eye className="mr-1.5 h-4 w-4" />
                                                        Détails
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
