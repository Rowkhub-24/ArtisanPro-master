import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, MapPin, Search, ArrowLeft, CreditCard } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tableau de bord',
        href: '/client/dashboard',
    },
    {
        title: 'Mes Réservations',
        href: '/client/reservations',
    },
];

interface ReservationItem {
    id: number;
    // DB canonical enums: en_cours, confirmee, terminee, annulee, litige
    // legacy values may still appear: en_attente, confirme, annule, termine
    statut: 'en_cours' | 'confirmee' | 'terminee' | 'annulee' | 'litige' | string;
    date_reservation: string;
    artisan?: {
        metier: string;
        user: {
            prenom: string;
            nom: string;
            telephone?: string;
        };
    };
    montant?: number;
    has_avis?: boolean;
    can_leave_review?: boolean;
}

interface Props {
    reservations: ReservationItem[];
}

export default function ClientReservations({ reservations }: Props) {
    const { auth } = usePage<SharedData>().props;

    const [modalOpen, setModalOpen] = useState(false);
    const [artisans, setArtisans] = useState<{ id: number; metier: string; nom?: string }[]>([]);

    const reservationForm = useForm({
        id_artisan: '',
        date: '',
        creneau: '',
        heure_specifique: '',
        description_besoin: '',
    });

    useEffect(() => {
        if (!modalOpen) return;
        fetch(route('client.artisans.list'))
            .then((r) => r.json())
            .then((data) => setArtisans(data))
            .catch(() => setArtisans([]));
    }, [modalOpen]);

    const submitReservation = (e: any) => {
        e.preventDefault();
        reservationForm.post(route('client.reservations.store'), {
            onSuccess: () => {
                setModalOpen(false);
                reservationForm.reset();
            },
        });
    };

    const getStatusBadge = (statut: string) => {
        // Normalize legacy values to canonical DB enums
        const map: Record<string, string> = {
            en_attente: 'en_cours',
            confirme: 'confirmee',
            annule: 'annulee',
            termine: 'terminee',
        };
        const s = map[statut] ?? statut;

        const statusConfig: Record<string, { label: string; className: string }> = {
            en_cours: { label: 'En cours', className: 'bg-blue-100 text-blue-800' },
            confirmee: { label: 'Confirmée', className: 'bg-green-100 text-green-800' },
            annulee: { label: 'Annulée', className: 'bg-red-100 text-red-800' },
            terminee: { label: 'Terminée', className: 'bg-gray-100 text-gray-800' },
            litige: { label: 'Litige', className: 'bg-yellow-100 text-yellow-800' },
        };

        const config = statusConfig[s] ?? { label: String(statut), className: 'bg-gray-100 text-gray-800' };
        return <Badge className={config.className}>{config.label}</Badge>;
    };

    const getStatusIcon = (statut: string) => {
        const map: Record<string, string> = {
            en_attente: 'en_cours',
            confirme: 'confirmee',
            annule: 'annulee',
            termine: 'terminee',
        };
        const s = map[statut] ?? statut;
        switch (s) {
            case 'confirmee':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'annulee':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'en_cours':
                return <Clock className="h-5 w-5 text-blue-600" />;
            default:
                return <Clock className="h-5 w-5 text-yellow-600" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Réservations - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button asChild variant="outline" size="icon">
                            <Link href={route('client.dashboard')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mes Réservations</h1>
                            <p className="mt-1 text-gray-600">Suivez vos réservations d'artisans</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                                placeholder="Rechercher..."
                                className="pl-10 w-64 border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500/20"
                            />
                        </div>
                        <>
                            <Button onClick={() => setModalOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                <Calendar className="mr-2 h-4 w-4" />
                                Nouvelle réservation
                            </Button>

                            {modalOpen && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center">
                                    <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} />
                                    <div className="relative w-full max-w-xl rounded-lg bg-white p-6 shadow-lg">
                                        <h3 className="text-lg font-semibold">Nouvelle réservation</h3>
                                        <form onSubmit={submitReservation} className="mt-4 space-y-4">
                                            <div>
                                                <label htmlFor="reservation-artisan" className="block text-sm font-medium text-gray-700">Artisan</label>
                                                <select
                                                    id="reservation-artisan"
                                                    value={reservationForm.data.id_artisan}
                                                    onChange={(e) => reservationForm.setData('id_artisan', Number(e.target.value))}
                                                    required
                                                    className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2"
                                                >
                                                    <option value="">Sélectionner un artisan</option>
                                                    {artisans.map((a) => (
                                                        <option key={a.id} value={a.id}>{`${a.metier}${a.nom ? ' — '+a.nom : ''}`}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="reservation-date" className="block text-sm font-medium text-gray-700">Date</label>
                                                <input
                                                    id="reservation-date"
                                                    type="date"
                                                    value={reservationForm.data.date}
                                                    onChange={(e) => reservationForm.setData('date', e.target.value)}
                                                    required
                                                    className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2"
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="reservation-creneau" className="block text-sm font-medium text-gray-700">Créneau (optionnel)</label>
                                                <select
                                                    id="reservation-creneau"
                                                    value={reservationForm.data.creneau}
                                                    onChange={(e) => reservationForm.setData('creneau', e.target.value)}
                                                    className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2"
                                                >
                                                    <option value="">Aucun</option>
                                                    <option value="matin">Matin (08:00 - 12:00)</option>
                                                    <option value="apres_midi">Après-midi (12:00 - 16:00)</option>
                                                            <option value="soir">Soir (16:00 - 20:00)</option>
                                                    <option value="heure_specifique">Heure spécifique</option>
                                                </select>
                                            </div>
                                            {reservationForm.data.creneau === 'heure_specifique' && (
                                                <div>
                                                    <label htmlFor="reservation-heure-specifique" className="block text-sm font-medium text-gray-700">
                                                        Heure spécifique
                                                    </label>
                                                    <input
                                                        id="reservation-heure-specifique"
                                                        type="time"
                                                        value={reservationForm.data.heure_specifique}
                                                        onChange={(e) => reservationForm.setData('heure_specifique', e.target.value)}
                                                        required
                                                        className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2"
                                                    />
                                                </div>
                                            )}
                                            <div>
                                                <label htmlFor="reservation-description" className="block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    id="reservation-description"
                                                    value={reservationForm.data.description_besoin}
                                                    onChange={(e) => reservationForm.setData('description_besoin', e.target.value)}
                                                    rows={4}
                                                    className="mt-1 w-full rounded-md border-gray-300 bg-white px-3 py-2"
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Annuler</Button>
                                                <Button type="submit" disabled={reservationForm.processing}>Créer</Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card className="border-gray-200 bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total</p>
                                    <p className="text-2xl font-bold text-gray-900">{reservations.length}</p>
                                </div>
                                <Calendar className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">En attente</p>
                                    <p className="text-2xl font-bold text-blue-600">{reservations.filter(r => ['en_cours', 'en_attente'].includes(r.statut ?? '')).length}</p>
                                </div>
                                <Clock className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Confirmées</p>
                                    <p className="text-2xl font-bold text-green-600">{reservations.filter(r => ['confirmee', 'confirme'].includes(r.statut ?? '')).length}</p>
                                </div>
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-gray-200 bg-white">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">En cours</p>
                                    <p className="text-2xl font-bold text-blue-600">{reservations.filter(r => r.statut === 'en_cours').length}</p>
                                </div>
                                <Clock className="h-8 w-8 text-blue-600" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Reservations List */}
                <div className="space-y-4">
                    {reservations.length === 0 ? (
                        <Card className="border-gray-200 bg-white">
                            <CardContent className="p-12 text-center">
                                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune réservation</h3>
                                <p className="text-gray-600">Vous n'avez pas encore de réservations d'artisans.</p>
                                <Button asChild className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <Link href={route('artisans.index')}>
                                        Trouver un artisan
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        reservations.map((reservation) => (
                            <Card key={reservation.id} className="border-gray-200 bg-white hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                {getStatusIcon(reservation.statut)}
                                                {getStatusBadge(reservation.statut)}
                                                <span className="text-sm text-gray-500">
                                                    {new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })}
                                                </span>
                                            </div>
                                            <CardTitle className="text-lg text-gray-900">
                                                {reservation.artisan?.metier}
                                            </CardTitle>
                                            <CardDescription className="text-gray-600 mt-1">
                                                {reservation.artisan?.user ? `${reservation.artisan.user.prenom} ${reservation.artisan.user.nom}` : 'Artisan inconnu'}
                                                {reservation.artisan?.user.telephone && ` · ${reservation.artisan.user.telephone}`}
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {reservation.montant && (
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">Montant</p>
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {Number(reservation.montant).toLocaleString('fr-FR')} FCFA
                                                    </p>
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                {['en_attente', 'en_cours'].includes(reservation.statut ?? '') && (
                                                    <Button size="sm" variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" asChild>
                                                        <Link
                                                            href={route('client.reservations.cancel', { reservation: reservation.id })}
                                                            method="delete"
                                                        >
                                                            Annuler
                                                        </Link>
                                                    </Button>
                                                )}
                                                {reservation.can_leave_review && (
                                                    <Button
                                                        asChild
                                                        size="sm"
                                                        className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600"
                                                    >
                                                        <Link href={route('client.avis.create', { reservation_id: reservation.id })}>
                                                            Donner un avis
                                                        </Link>
                                                    </Button>
                                                )}
                                                {['confirme', 'confirmee'].includes(reservation.statut ?? '') && (
                                                    <Button 
                                                        asChild
                                                        size="sm" 
                                                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                                    >
                                                        <Link href={route('client.paiements.create', { reservation_id: reservation.id })}>
                                                            <CreditCard className="mr-1 h-4 w-4" />
                                                            Payer
                                                        </Link>
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="outline" asChild>
                                                    <Link href={route('client.reservations.show', { reservation: reservation.id })}>
                                                        Voir détails
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
