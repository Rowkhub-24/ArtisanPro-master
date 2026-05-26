import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, MapPin, Search, ArrowLeft, CreditCard } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Mes Réservations', href: '/client/reservations' },
];

interface ReservationItem {
    id: number;
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
        const map: Record<string, string> = {
            en_attente: 'en_cours',
            confirme: 'confirmee',
            annule: 'annulee',
            termine: 'terminee',
        };
        const s = map[statut] ?? statut;

        const statusConfig: Record<string, { label: string; className: string }> = {
            en_cours:  { label: 'En cours',  className: 'bg-blue-100 text-blue-800 border border-blue-200' },
            confirmee: { label: 'Confirmée', className: 'bg-emerald-100 text-emerald-800 border border-emerald-200' },
            annulee:   { label: 'Annulée',   className: 'bg-red-100 text-red-800 border border-red-200' },
            terminee:  { label: 'Terminée',  className: 'bg-gray-100 text-gray-700 border border-gray-200' },
            litige:    { label: 'Litige',    className: 'bg-amber-100 text-amber-800 border border-amber-200' },
        };

        const config = statusConfig[s] ?? { label: String(statut), className: 'bg-gray-100 text-gray-700 border border-gray-200' };
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
                return <CheckCircle className="h-5 w-5 text-emerald-600" />;
            case 'annulee':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'en_cours':
                return <Clock className="h-5 w-5 text-blue-600" />;
            default:
                return <Clock className="h-5 w-5 text-amber-600" />;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mes Réservations - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('client.dashboard')}
                            className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mes Réservations</h1>
                            <p className="mt-1 text-[hsl(20,10%,50%)]">Suivez vos réservations d'artisans</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(20,10%,50%)]" />
                            <input
                                placeholder="Rechercher..."
                                className="pl-10 w-64 rounded-xl border border-[hsl(30,20%,82%)] bg-white focus:border-amber-400 focus:outline-none px-3 py-2 text-sm text-[hsl(20,14%,12%)]"
                            />
                        </div>
                        <button
                            onClick={() => setModalOpen(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all"
                        >
                            <Calendar className="h-4 w-4" />
                            Nouvelle réservation
                        </button>

                        {modalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center">
                                <div
                                    className="absolute inset-0 bg-[hsl(20,14%,6%)]/70 backdrop-blur-sm"
                                    onClick={() => setModalOpen(false)}
                                />
                                <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl border border-[hsl(30,20%,88%)]">
                                    <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)]">Nouvelle réservation</h3>
                                    <form onSubmit={submitReservation} className="mt-4 space-y-4">
                                        <div>
                                            <label htmlFor="reservation-artisan" className="block text-sm font-medium text-[hsl(20,14%,12%)]">Artisan</label>
                                            <select
                                                id="reservation-artisan"
                                                value={reservationForm.data.id_artisan}
                                                onChange={(e) => reservationForm.setData('id_artisan', Number(e.target.value))}
                                                required
                                                className="mt-1 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none"
                                            >
                                                <option value="">Sélectionner un artisan</option>
                                                {artisans.map((a) => (
                                                    <option key={a.id} value={a.id}>{`${a.metier}${a.nom ? ' — ' + a.nom : ''}`}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="reservation-date" className="block text-sm font-medium text-[hsl(20,14%,12%)]">Date</label>
                                            <input
                                                id="reservation-date"
                                                type="date"
                                                value={reservationForm.data.date}
                                                onChange={(e) => reservationForm.setData('date', e.target.value)}
                                                required
                                                className="mt-1 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="reservation-creneau" className="block text-sm font-medium text-[hsl(20,14%,12%)]">Créneau (optionnel)</label>
                                            <select
                                                id="reservation-creneau"
                                                value={reservationForm.data.creneau}
                                                onChange={(e) => reservationForm.setData('creneau', e.target.value)}
                                                className="mt-1 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none"
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
                                                <label htmlFor="reservation-heure-specifique" className="block text-sm font-medium text-[hsl(20,14%,12%)]">
                                                    Heure spécifique
                                                </label>
                                                <input
                                                    id="reservation-heure-specifique"
                                                    type="time"
                                                    value={reservationForm.data.heure_specifique}
                                                    onChange={(e) => reservationForm.setData('heure_specifique', e.target.value)}
                                                    required
                                                    className="mt-1 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none"
                                                />
                                            </div>
                                        )}
                                        <div>
                                            <label htmlFor="reservation-description" className="block text-sm font-medium text-[hsl(20,14%,12%)]">Description</label>
                                            <textarea
                                                id="reservation-description"
                                                value={reservationForm.data.description_besoin}
                                                onChange={(e) => reservationForm.setData('description_besoin', e.target.value)}
                                                rows={4}
                                                className="mt-1 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setModalOpen(false)}
                                                className="rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,10%,50%)] hover:bg-gray-50 transition-colors"
                                            >
                                                Annuler
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={reservationForm.processing}
                                                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all disabled:opacity-60"
                                            >
                                                Créer
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[hsl(20,10%,50%)]">Total</p>
                                <p className="text-2xl font-bold text-[hsl(20,14%,12%)]">{reservations.length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                                <Calendar className="h-6 w-6 text-amber-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[hsl(20,10%,50%)]">En attente</p>
                                <p className="text-2xl font-bold text-blue-600">{reservations.filter(r => ['en_cours', 'en_attente'].includes(r.statut ?? '')).length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                <Clock className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[hsl(20,10%,50%)]">Confirmées</p>
                                <p className="text-2xl font-bold text-emerald-600">{reservations.filter(r => ['confirmee', 'confirme'].includes(r.statut ?? '')).length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-[hsl(20,10%,50%)]">Annulées</p>
                                <p className="text-2xl font-bold text-red-600">{reservations.filter(r => ['annulee', 'annule'].includes(r.statut ?? '')).length}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                                <XCircle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reservations List */}
                <div className="space-y-4">
                    {reservations.length === 0 ? (
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-12 text-center">
                            <Calendar className="h-12 w-12 text-[hsl(20,10%,50%)] mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)] mb-2">Aucune réservation</h3>
                            <p className="text-[hsl(20,10%,50%)]">Vous n'avez pas encore de réservations d'artisans.</p>
                            <Link
                                href={route('artisans.index')}
                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2 text-sm transition-all"
                            >
                                Trouver un artisan
                            </Link>
                        </div>
                    ) : (
                        reservations.map((reservation) => (
                            <div
                                key={reservation.id}
                                className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                                <div className="flex items-start justify-between flex-wrap gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            {getStatusIcon(reservation.statut)}
                                            {getStatusBadge(reservation.statut)}
                                            <span className="text-sm text-[hsl(20,10%,50%)]">
                                                {new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold text-[hsl(20,14%,12%)]">
                                            {reservation.artisan?.metier}
                                        </h3>
                                        <p className="text-[hsl(20,10%,50%)] mt-1 text-sm">
                                            {reservation.artisan?.user
                                                ? `${reservation.artisan.user.prenom} ${reservation.artisan.user.nom}`
                                                : 'Artisan inconnu'}
                                            {reservation.artisan?.user.telephone && ` · ${reservation.artisan.user.telephone}`}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {reservation.montant && (
                                            <div className="text-right">
                                                <p className="text-xs text-[hsl(20,10%,50%)]">Montant</p>
                                                <p className="text-lg font-bold text-[hsl(20,14%,12%)]">
                                                    {Number(reservation.montant).toLocaleString('fr-FR')} FCFA
                                                </p>
                                            </div>
                                        )}
                                        <div className="flex gap-2 flex-wrap">
                                            {['en_attente', 'en_cours'].includes(reservation.statut ?? '') && (
                                                <Link
                                                    href={route('client.reservations.cancel', { reservation: reservation.id })}
                                                    method="delete"
                                                    className="inline-flex items-center rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 text-sm font-medium transition-colors"
                                                >
                                                    Annuler
                                                </Link>
                                            )}
                                            {reservation.can_leave_review && (
                                                <Link
                                                    href={route('client.avis.create', { reservation_id: reservation.id })}
                                                    className="inline-flex items-center rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-3 py-1.5 text-sm transition-all"
                                                >
                                                    Donner un avis
                                                </Link>
                                            )}
                                            {['confirme', 'confirmee'].includes(reservation.statut ?? '') && (
                                                <Link
                                                    href={route('client.paiements.create', { reservation_id: reservation.id })}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 text-sm transition-colors"
                                                >
                                                    <CreditCard className="h-4 w-4" />
                                                    Payer
                                                </Link>
                                            )}
                                            <Link
                                                href={route('client.reservations.show', { reservation: reservation.id })}
                                                className="inline-flex items-center rounded-xl border border-[hsl(30,20%,82%)] bg-white text-[hsl(20,14%,12%)] hover:border-amber-400 px-3 py-1.5 text-sm font-medium transition-colors"
                                            >
                                                Voir détails
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
