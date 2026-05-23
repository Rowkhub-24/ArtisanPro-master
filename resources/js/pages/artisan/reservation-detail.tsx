import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Réservations', href: '/artisan/reservations' },
    { title: 'Détail', href: '/artisan/reservations' },
];

interface Reservation {
    id: number;
    statut: string;
    date: string | null;
    creneau: string | null;
    montant_total: number | null;
    description_besoin: string | null;
    adresse_intervention: string | null;
    client: {
        prenom: string | null;
        nom: string | null;
        telephone: string | null;
        email: string | null;
    } | null;
    artisan: {
        metier: string | null;
        user: {
            prenom: string | null;
            nom: string | null;
            telephone: string | null;
            email: string | null;
        };
    } | null;
    devis: {
        id: number;
        description_travaux: string;
        statut: string;
    } | null;
}

interface Props {
    reservation?: Reservation | null;
}

export default function ArtisanReservationDetail({ reservation }: Props) {
    const updateReservationStatus = (statut: 'confirmee' | 'annulee') => {
        if (!reservation) {
            return;
        }

        if (!window.confirm(`Êtes-vous sûr de vouloir ${statut === 'confirmee' ? 'confirmer' : 'refuser'} cette réservation ?`)) {
            return;
        }

        router.patch(route('artisan.reservations.statut', reservation.id), { statut }, {
            preserveScroll: true,
            preserveState: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Détail réservation (artisan) - ArtisanPro" />
            <div className="mx-auto max-w-7xl px-6 py-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Détail de la réservation</h1>
                        <p className="mt-2 text-gray-600">Détails et actions pour l'artisan (accept/refuse, calendrier, messages).</p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        {['en_attente', 'en_cours'].includes(reservation?.statut ?? '') && (
                            <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" type="button" onClick={() => updateReservationStatus('confirmee')}>
                                    Confirmer
                                </Button>
                                <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" type="button" onClick={() => updateReservationStatus('annulee')}>
                                    Refuser
                                </Button>
                            </>
                        )}
                        <Link href={route('artisan.reservations')} className="text-blue-600 hover:text-blue-700">Retour aux réservations</Link>
                    </div>
                </div>

                {reservation ? (
                    <div className="mt-8 grid gap-6 lg:grid-cols-2">
                        <Card className="border-0 shadow-lg bg-white">
                            <CardHeader>
                                <CardTitle>Informations de la réservation</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">ID</p>
                                    <p className="text-base font-medium text-gray-900">#{reservation.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Statut</p>
                                    <Badge className="bg-blue-100 text-blue-700">{reservation.statut}</Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="text-base text-gray-900">{reservation.date ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Créneau</p>
                                    <p className="text-base text-gray-900">{reservation.creneau ?? 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Montant</p>
                                    <p className="text-base text-gray-900">{reservation.montant_total ? `${Number(reservation.montant_total).toLocaleString('fr-FR')} FCFA` : 'Non renseigné'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Adresse</p>
                                    <p className="text-base text-gray-900">{reservation.adresse_intervention ?? 'Non renseignée'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Besoin</p>
                                    <p className="text-base text-gray-900 whitespace-pre-wrap">{reservation.description_besoin ?? 'Aucune description'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-6">
                            <Card className="border-0 shadow-lg bg-white">
                                <CardHeader>
                                    <CardTitle>Client</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-base font-medium text-gray-900">{reservation.client ? `${reservation.client.prenom ?? ''} ${reservation.client.nom ?? ''}`.trim() : 'Client inconnu'}</p>
                                    <p className="text-sm text-gray-500">Téléphone: {reservation.client?.telephone ?? 'N/A'}</p>
                                    <p className="text-sm text-gray-500">Email: {reservation.client?.email ?? 'N/A'}</p>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-lg bg-white">
                                <CardHeader>
                                    <CardTitle>Artisan</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-base font-medium text-gray-900">{reservation.artisan?.user ? `${reservation.artisan.user.prenom ?? ''} ${reservation.artisan.user.nom ?? ''}`.trim() : 'Artisan inconnu'}</p>
                                    <p className="text-sm text-gray-500">Métier: {reservation.artisan?.metier ?? 'N/A'}</p>
                                    <p className="text-sm text-gray-500">Téléphone: {reservation.artisan?.user?.telephone ?? 'N/A'}</p>
                                    <p className="text-sm text-gray-500">Email: {reservation.artisan?.user?.email ?? 'N/A'}</p>
                                </CardContent>
                            </Card>

                            {reservation.devis && (
                                <Card className="border-0 shadow-lg bg-white">
                                    <CardHeader>
                                        <CardTitle>Devis lié</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div>
                                            <p className="text-sm text-gray-500">Devis ID</p>
                                            <p className="text-base text-gray-900">#{reservation.devis.id}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Statut du devis</p>
                                            <p className="text-base text-gray-900">{reservation.devis.statut}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Description</p>
                                            <p className="text-base text-gray-900 whitespace-pre-wrap">{reservation.devis.description_travaux}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
                        <p className="text-lg font-medium text-gray-900">Aucune donnée de réservation disponible.</p>
                        <p className="mt-2 text-sm text-gray-500">Vérifiez que la réservation existe et que vous y avez accès.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
