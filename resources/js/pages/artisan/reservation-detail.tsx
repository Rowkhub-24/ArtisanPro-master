import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
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
    contrat?: {
        id: number;
        numero_contrat: string;
        statut: 'genere' | 'en_attente_signatures' | 'partiellement_signe' | 'finalise' | 'annule';
        peut_signer: boolean;
    } | null;
}

export default function ArtisanReservationDetail({ reservation, contrat }: Props) {
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
            <div className="min-h-screen bg-[hsl(36,33%,97%)]">
                <div className="mx-auto max-w-7xl px-6 py-10">

                    {/* Header */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
                        <div className="flex items-start gap-4">
                            <Link
                                href={route('artisan.reservations')}
                                className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors mt-1"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Retour aux réservations
                            </Link>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                            {['en_attente', 'en_cours'].includes(reservation?.statut ?? '') && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => updateReservationStatus('confirmee')}
                                        className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-5 py-2.5 text-sm transition-colors shadow-sm"
                                    >
                                        Confirmer
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => updateReservationStatus('annulee')}
                                        className="rounded-xl border border-red-300 text-red-700 hover:bg-red-50 font-semibold px-5 py-2.5 text-sm transition-colors"
                                    >
                                        Refuser
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">Détail de la réservation</h1>
                        <p className="mt-2 text-[hsl(20,10%,50%)]">Détails et actions pour l&apos;artisan (accept/refuse, calendrier, messages).</p>
                    </div>

                    {reservation ? (
                        <div className="grid gap-6 lg:grid-cols-2">

                            {/* Reservation info card */}
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                                <h2 className="text-lg font-semibold text-[hsl(20,14%,12%)] mb-5">Informations de la réservation</h2>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">ID</p>
                                        <p className="text-base font-medium text-[hsl(20,14%,12%)]">#{reservation.id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Statut</p>
                                        <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                                            {reservation.statut}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Date</p>
                                        <p className="text-base text-[hsl(20,14%,12%)]">{reservation.date ?? 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Créneau</p>
                                        <p className="text-base text-[hsl(20,14%,12%)]">{reservation.creneau ?? 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Montant</p>
                                        <p className="text-base text-[hsl(20,14%,12%)]">
                                            {reservation.montant_total
                                                ? `${Number(reservation.montant_total).toLocaleString('fr-FR')} FCFA`
                                                : 'Non renseigné'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Adresse</p>
                                        <p className="text-base text-[hsl(20,14%,12%)]">{reservation.adresse_intervention ?? 'Non renseignée'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Besoin</p>
                                        <p className="text-base text-[hsl(20,14%,12%)] whitespace-pre-wrap">{reservation.description_besoin ?? 'Aucune description'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Client card */}
                                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                                    <h2 className="text-lg font-semibold text-[hsl(20,14%,12%)] mb-4">Client</h2>
                                    <div className="space-y-3">
                                        <p className="text-base font-medium text-[hsl(20,14%,12%)]">
                                            {reservation.client
                                                ? `${reservation.client.prenom ?? ''} ${reservation.client.nom ?? ''}`.trim()
                                                : 'Client inconnu'}
                                        </p>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Téléphone : {reservation.client?.telephone ?? 'N/A'}</p>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Email : {reservation.client?.email ?? 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Artisan card */}
                                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                                    <h2 className="text-lg font-semibold text-[hsl(20,14%,12%)] mb-4">Artisan</h2>
                                    <div className="space-y-3">
                                        <p className="text-base font-medium text-[hsl(20,14%,12%)]">
                                            {reservation.artisan?.user
                                                ? `${reservation.artisan.user.prenom ?? ''} ${reservation.artisan.user.nom ?? ''}`.trim()
                                                : 'Artisan inconnu'}
                                        </p>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Métier : {reservation.artisan?.metier ?? 'N/A'}</p>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Téléphone : {reservation.artisan?.user?.telephone ?? 'N/A'}</p>
                                        <p className="text-sm text-[hsl(20,10%,50%)]">Email : {reservation.artisan?.user?.email ?? 'N/A'}</p>
                                    </div>
                                </div>

                                {/* Devis card */}
                                {reservation.devis && (
                                    <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                                        <h2 className="text-lg font-semibold text-[hsl(20,14%,12%)] mb-4">Devis lié</h2>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">Devis ID</p>
                                                <p className="text-base text-[hsl(20,14%,12%)]">#{reservation.devis.id}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">Statut du devis</p>
                                                <p className="text-base text-[hsl(20,14%,12%)]">{reservation.devis.statut}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">Description</p>
                                                <p className="text-base text-[hsl(20,14%,12%)] whitespace-pre-wrap">{reservation.devis.description_travaux}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Contrat card */}
                                {contrat && (
                                    <div className="rounded-2xl border border-amber-200 bg-amber-50 shadow-sm p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText className="h-5 w-5 text-amber-600" />
                                            <h2 className="text-lg font-semibold text-[hsl(20,14%,12%)]">Contrat de prestation</h2>
                                        </div>
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-[hsl(20,10%,50%)]">Numéro</p>
                                                <p className="text-base font-medium text-[hsl(20,14%,12%)] font-mono">{contrat.numero_contrat}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-[hsl(20,10%,50%)] mb-1">Statut</p>
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                    contrat.statut === 'finalise'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : contrat.statut === 'annule'
                                                        ? 'bg-red-100 text-red-800'
                                                        : contrat.statut === 'partiellement_signe'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {contrat.statut === 'finalise' ? 'Signé'
                                                        : contrat.statut === 'annule' ? 'Annulé'
                                                        : contrat.statut === 'partiellement_signe' ? 'Partiellement signé'
                                                        : 'En attente de signature'}
                                                </span>
                                            </div>
                                        </div>
                                        <Link
                                            href={route('portal.contrats.show', contrat.id)}
                                            className="mt-4 flex items-center gap-2 w-full justify-center rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-semibold px-4 py-2.5 text-sm transition-all"
                                        >
                                            <FileText className="h-4 w-4" />
                                            {contrat.statut === 'finalise'
                                                ? 'Voir le contrat signé'
                                                : contrat.peut_signer
                                                ? 'Signer le contrat'
                                                : 'Voir le contrat'}
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-dashed border-[hsl(30,20%,82%)] bg-white p-10 text-center">
                            <p className="text-lg font-medium text-[hsl(20,14%,12%)]">Aucune donnée de réservation disponible.</p>
                            <p className="mt-2 text-sm text-[hsl(20,10%,50%)]">Vérifiez que la réservation existe et que vous y avez accès.</p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
