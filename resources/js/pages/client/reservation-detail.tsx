import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft, Calendar, Clock, CheckCircle, XCircle, Wrench,
    Phone, Mail, MapPin, Star, CreditCard, MessageSquare,
    AlertTriangle, FileText, User,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Mes Réservations', href: '/client/reservations' },
    { title: 'Détail', href: '#' },
];

interface Paiement {
    id: number;
    montant: number | null;
    statut: string;
    methode_paiement: string | null;
    date_paiement: string | null;
    reference_transaction: string | null;
}

interface Artisan {
    id: number;
    metier: string;
    note_moyenne: number | string | null;
    zone_intervention: string | null;
    categories: string[];
    user: {
        id: number;
        nom: string;
        prenom: string;
        email: string;
        telephone: string | null;
    } | null;
}

interface Reservation {
    id: number;
    statut: string;
    date: string | null;
    date_debut: string | null;
    creneau: string | null;
    description_besoin: string | null;
    montant_total: number | null;
    acompte_verse: number | null;
    artisan: Artisan | null;
    paiements: Paiement[];
    has_avis: boolean;
}

interface Contrat {
    id: number;
    numero_contrat: string;
    statut: 'genere' | 'en_attente_signatures' | 'partiellement_signe' | 'finalise' | 'annule';
    peut_signer: boolean;
}

interface Props {
    reservation: Reservation;
    contrat: Contrat | null;
}

type StatusInfo = { label: string; color: string; iconName: 'clock' | 'check' | 'x' | 'alert' };

const statusConfig: Record<string, StatusInfo> = {
    en_cours:   { label: 'En cours',   color: 'bg-blue-100 text-blue-800 border border-blue-200',         iconName: 'clock' },
    en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-800 border border-amber-200',      iconName: 'clock' },
    confirmee:  { label: 'Confirmée',  color: 'bg-emerald-100 text-emerald-800 border border-emerald-200', iconName: 'check' },
    confirme:   { label: 'Confirmée',  color: 'bg-emerald-100 text-emerald-800 border border-emerald-200', iconName: 'check' },
    terminee:   { label: 'Terminée',   color: 'bg-gray-100 text-gray-700 border border-gray-200',          iconName: 'check' },
    termine:    { label: 'Terminée',   color: 'bg-gray-100 text-gray-700 border border-gray-200',          iconName: 'check' },
    annulee:    { label: 'Annulée',    color: 'bg-red-100 text-red-800 border border-red-200',             iconName: 'x' },
    annule:     { label: 'Annulée',    color: 'bg-red-100 text-red-800 border border-red-200',             iconName: 'x' },
    litige:     { label: 'Litige',     color: 'bg-orange-100 text-orange-800 border border-orange-200',    iconName: 'alert' },
};

const paiementStatusConfig: Record<string, { label: string; color: string }> = {
    en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-800' },
    reussi:     { label: 'Réussi',     color: 'bg-emerald-100 text-emerald-800' },
    complete:   { label: 'Complété',   color: 'bg-emerald-100 text-emerald-800' },
    echoue:     { label: 'Échoué',     color: 'bg-red-100 text-red-800' },
};

const creneauLabels: Record<string, string> = {
    matin:      'Matin (08h - 12h)',
    apres_midi: 'Après-midi (12h - 16h)',
    soir:       'Soir (16h - 20h)',
};

function StatusIcon({ name, extraClass }: { name: StatusInfo['iconName']; extraClass?: string }) {
    if (name === 'clock')  return <Clock className={`h-4 w-4 ${extraClass ?? ''}`} />;
    if (name === 'check')  return <CheckCircle className={`h-4 w-4 ${extraClass ?? ''}`} />;
    if (name === 'x')      return <XCircle className={`h-4 w-4 ${extraClass ?? ''}`} />;
    return <AlertTriangle className={`h-4 w-4 ${extraClass ?? ''}`} />;
}

function iconColor(info: StatusInfo): string {
    if (info.iconName === 'clock')  return info.color.includes('blue') ? 'text-blue-600' : 'text-amber-600';
    if (info.iconName === 'check')  return info.color.includes('emerald') ? 'text-emerald-600' : 'text-gray-500';
    if (info.iconName === 'x')      return 'text-red-600';
    return 'text-orange-600';
}

export default function ClientReservationDetail({ reservation, contrat }: Props) {
    const sc = statusConfig[reservation.statut] ?? statusConfig['en_attente'];

    const canCancel = ['en_cours', 'en_attente', 'confirmee', 'confirme'].includes(reservation.statut);
    const canPay    = ['confirmee', 'confirme'].includes(reservation.statut) && (reservation.paiements ?? []).length === 0;
    const canReview = ['confirmee', 'terminee', 'termine'].includes(reservation.statut) && !reservation.has_avis;
    const canLitige = ['confirmee', 'terminee', 'termine'].includes(reservation.statut);

    const noteNum = Number(reservation.artisan?.note_moyenne ?? 0);

    const annuler = () => {
        if (confirm("Confirmer l'annulation de cette réservation ?")) {
            router.delete(route('client.reservations.cancel', { reservation: reservation.id }));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Réservation #${reservation.id} - ArtisanPro`} />
            <div className="flex flex-col gap-6 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={route('client.reservations')}
                            className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">
                                Réservation #{reservation.id}
                            </h1>
                            <p className="text-sm text-[hsl(20,10%,50%)] mt-0.5">
                                {reservation.date
                                    ? new Date(reservation.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : 'Date non définie'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`${sc.color} flex items-center gap-1.5 px-3 py-1.5 text-sm`}>
                            <StatusIcon name={sc.iconName} extraClass={iconColor(sc)} />
                            {sc.label}
                        </Badge>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">

                    {/* Colonne gauche — Artisan */}
                    <div className="space-y-4">

                        {/* Carte artisan */}
                        {reservation.artisan ? (
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                                <h2 className="text-sm font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide mb-4 flex items-center gap-2">
                                    <Wrench className="h-4 w-4" />
                                    Artisan
                                </h2>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-sm shrink-0">
                                        {reservation.artisan.user?.prenom?.charAt(0) ?? '?'}
                                        {reservation.artisan.user?.nom?.charAt(0) ?? ''}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[hsl(20,14%,12%)]">
                                            {reservation.artisan.user
                                                ? `${reservation.artisan.user.prenom} ${reservation.artisan.user.nom}`
                                                : 'Artisan inconnu'}
                                        </p>
                                        <p className="text-sm text-amber-600 font-medium">{reservation.artisan.metier}</p>
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="flex items-center gap-1.5 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Star
                                            key={i}
                                            className={`h-4 w-4 ${i < Math.floor(noteNum) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`}
                                        />
                                    ))}
                                    <span className="text-sm font-medium text-[hsl(20,14%,12%)] ml-1">
                                        {noteNum.toFixed(1)}/5
                                    </span>
                                </div>

                                {/* Contacts */}
                                <div className="space-y-2 border-t border-[hsl(30,20%,92%)] pt-3">
                                    {reservation.artisan.user?.telephone && (
                                        <div className="flex items-center gap-2 text-sm text-[hsl(20,10%,45%)]">
                                            <Phone className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            <a href={`tel:${reservation.artisan.user.telephone}`} className="hover:text-amber-600">
                                                {reservation.artisan.user.telephone}
                                            </a>
                                        </div>
                                    )}
                                    {reservation.artisan.user?.email && (
                                        <div className="flex items-center gap-2 text-sm text-[hsl(20,10%,45%)]">
                                            <Mail className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            <a href={`mailto:${reservation.artisan.user.email}`} className="hover:text-amber-600 truncate">
                                                {reservation.artisan.user.email}
                                            </a>
                                        </div>
                                    )}
                                    {reservation.artisan.zone_intervention && (
                                        <div className="flex items-center gap-2 text-sm text-[hsl(20,10%,45%)]">
                                            <MapPin className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                            {reservation.artisan.zone_intervention}
                                        </div>
                                    )}
                                </div>

                                {/* Catégories */}
                                {reservation.artisan.categories.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[hsl(30,20%,92%)]">
                                        {reservation.artisan.categories.map((c) => (
                                            <span key={c} className="rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-medium">
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Lien profil */}
                                <div className="mt-4">
                                    <Link
                                        href={route('artisans.show', { artisan: reservation.artisan.id })}
                                        className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700"
                                    >
                                        <User className="h-3.5 w-3.5" />
                                        Voir le profil complet
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6 text-center text-gray-400">
                                <Wrench className="h-8 w-8 mx-auto mb-2" />
                                <p className="text-sm">Artisan non disponible</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5 space-y-2">
                            <h2 className="text-sm font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide mb-3">Actions</h2>

                            {canPay && (
                                <Link
                                    href={route('client.paiements.create', { reservation_id: reservation.id })}
                                    className="flex items-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold px-4 py-2.5 text-sm transition-all"
                                >
                                    <CreditCard className="h-4 w-4" />
                                    Payer maintenant
                                </Link>
                            )}

                            {/* Contrat */}
                            {contrat && (
                                <Link
                                    href={route('portal.contrats.show', { contrat: contrat.id })}
                                    className="flex items-center gap-2 w-full rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-medium px-4 py-2.5 text-sm transition-all"
                                >
                                    <FileText className="h-4 w-4 text-amber-600" />
                                    {contrat.statut === 'finalise'
                                        ? 'Voir le contrat signé'
                                        : contrat.peut_signer
                                        ? 'Signer le contrat'
                                        : 'Voir le contrat'}
                                </Link>
                            )}

                            {canReview && (
                                <Link
                                    href={route('client.avis.create', { reservation_id: reservation.id })}
                                    className="flex items-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2.5 text-sm transition-all"
                                >
                                    <Star className="h-4 w-4" />
                                    Laisser un avis
                                </Link>
                            )}

                            {reservation.artisan?.user && (
                                <Link
                                    href={route('client.messages', { withUser: reservation.artisan.user.id })}
                                    className="flex items-center gap-2 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white hover:border-amber-300 hover:bg-amber-50 text-[hsl(20,14%,12%)] font-medium px-4 py-2.5 text-sm transition-all"
                                >
                                    <MessageSquare className="h-4 w-4 text-amber-500" />
                                    Contacter l'artisan
                                </Link>
                            )}

                            {canLitige && (
                                <Link
                                    href={route('client.litiges.create')}
                                    className="flex items-center gap-2 w-full rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium px-4 py-2.5 text-sm transition-all"
                                >
                                    <AlertTriangle className="h-4 w-4" />
                                    Ouvrir un litige
                                </Link>
                            )}

                            {canCancel && (
                                <button
                                    onClick={annuler}
                                    className="flex items-center gap-2 w-full rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-medium px-4 py-2.5 text-sm transition-all"
                                >
                                    <XCircle className="h-4 w-4" />
                                    Annuler la réservation
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Colonne droite — Détails */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Détails de la réservation */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm">
                            <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-amber-500" />
                                <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Détails de la réservation</h2>
                            </div>
                            <div className="p-6 grid gap-5 md:grid-cols-2">
                                <div>
                                    <p className="text-xs text-[hsl(20,10%,55%)] mb-1">Statut</p>
                                    <Badge className={`${sc.color} flex items-center gap-1.5 w-fit`}>
                                        <StatusIcon name={sc.iconName} extraClass={iconColor(sc)} />
                                        {sc.label}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-xs text-[hsl(20,10%,55%)] mb-1">Date de réservation</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-amber-500" />
                                        <p className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                            {reservation.date
                                                ? new Date(reservation.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                                                : '—'}
                                        </p>
                                    </div>
                                </div>

                                {reservation.date_debut && (
                                    <div>
                                        <p className="text-xs text-[hsl(20,10%,55%)] mb-1">Date et heure d'intervention</p>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-amber-500" />
                                            <p className="text-sm font-medium text-[hsl(20,14%,12%)]">{reservation.date_debut}</p>
                                        </div>
                                    </div>
                                )}

                                {reservation.creneau && (
                                    <div>
                                        <p className="text-xs text-[hsl(20,10%,55%)] mb-1">Créneau</p>
                                        <p className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                            {creneauLabels[reservation.creneau] ?? reservation.creneau}
                                        </p>
                                    </div>
                                )}

                                {reservation.montant_total != null && (
                                    <div>
                                        <p className="text-xs text-[hsl(20,10%,55%)] mb-1">Montant total</p>
                                        <p className="text-lg font-bold text-[hsl(20,14%,12%)]">
                                            {Number(reservation.montant_total).toLocaleString('fr-FR')} FCFA
                                        </p>
                                    </div>
                                )}

                                {reservation.acompte_verse != null && (
                                    <div>
                                        <p className="text-xs text-[hsl(20,10%,55%)] mb-1">Acompte versé</p>
                                        <p className="text-sm font-medium text-emerald-600">
                                            {Number(reservation.acompte_verse).toLocaleString('fr-FR')} FCFA
                                        </p>
                                    </div>
                                )}

                                {reservation.description_besoin && (
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-[hsl(20,10%,55%)] mb-1">Description du besoin</p>
                                        <p className="text-sm text-[hsl(20,10%,35%)] bg-[hsl(36,33%,97%)] rounded-xl p-3 leading-relaxed">
                                            {reservation.description_besoin}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Paiements */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm">
                            <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-amber-500" />
                                    <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">Paiements</h2>
                                </div>
                                <span className="text-xs text-[hsl(20,10%,55%)]">{reservation.paiements.length} transaction(s)</span>
                            </div>
                            {reservation.paiements.length === 0 ? (
                                <div className="p-8 text-center">
                                    <CreditCard className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-sm text-[hsl(20,10%,55%)]">Aucun paiement enregistré</p>
                                    {canPay && (
                                        <Link
                                            href={route('client.paiements.create', { reservation_id: reservation.id })}
                                            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold px-4 py-2 text-sm transition-all"
                                        >
                                            <CreditCard className="h-4 w-4" />
                                            Effectuer le paiement
                                        </Link>
                                    )}
                                </div>
                            ) : (
                                <div className="divide-y divide-[hsl(30,20%,92%)]">
                                    {reservation.paiements.map((p) => {
                                        const ps = paiementStatusConfig[p.statut] ?? { label: p.statut, color: 'bg-gray-100 text-gray-700' };
                                        return (
                                            <div key={p.id} className="px-6 py-4 flex items-center justify-between flex-wrap gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-[hsl(20,14%,12%)]">
                                                        {p.montant != null ? Number(p.montant).toLocaleString('fr-FR') : '—'} FCFA
                                                    </p>
                                                    <p className="text-xs text-[hsl(20,10%,55%)] mt-0.5">
                                                        {p.methode_paiement ? p.methode_paiement.replace(/_/g, ' ') : '—'}
                                                        {p.date_paiement && ` · ${new Date(p.date_paiement).toLocaleDateString('fr-FR')}`}
                                                    </p>
                                                    {p.reference_transaction && (
                                                        <p className="text-xs font-mono text-[hsl(20,10%,65%)] mt-0.5">{p.reference_transaction}</p>
                                                    )}
                                                </div>
                                                <Badge className={`${ps.color} text-xs`}>{ps.label}</Badge>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Avis */}
                        {reservation.has_avis && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex items-center gap-3">
                                <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-emerald-800">Avis déposé</p>
                                    <p className="text-xs text-emerald-600">Vous avez déjà laissé un avis pour cette réservation.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
