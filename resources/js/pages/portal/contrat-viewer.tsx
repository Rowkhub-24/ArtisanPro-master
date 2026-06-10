import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    FileText,
    Download,
    PenLine,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Briefcase,
    CalendarDays,
    MapPin,
    AlertTriangle,
    Scale,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

// ─── TypeScript interfaces ────────────────────────────────────────────────────

export interface ClauseLitige {
    id: string;
    titre: string;
    contenu: string;
}

export interface ContratData {
    id: number;
    numero_contrat: string;
    statut: 'genere' | 'en_attente_signatures' | 'partiellement_signe' | 'finalise' | 'annule';
    nom_client: string;
    nom_artisan: string;
    description_prestation: string;
    montant_total: number;
    date_debut_prestation: string;
    date_fin_prestation: string | null;
    adresse_intervention: string | null;
    signature_client_at: string | null;
    signature_artisan_at: string | null;
    clauses_litige: ClauseLitige[];
    chemin_pdf_brouillon: string | null;
    chemin_pdf_final: string | null;
    client: {
        id: number;
        user: {
            id: number;
            nom: string;
            prenom: string;
            email: string;
        } | null;
    } | null;
    artisan: {
        id: number;
        user: {
            id: number;
            nom: string;
            prenom: string;
            email: string;
        } | null;
    } | null;
}

export interface ContratViewerProps {
    contrat: ContratData;
    peut_signer: boolean;
    role_utilisateur: 'client' | 'artisan';
}

// ─── Breadcrumbs ──────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Contrat', href: '#' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function formatMontant(montant: number): string {
    return Number(montant).toLocaleString('fr-FR') + ' FCFA';
}

// ─── Statut config ────────────────────────────────────────────────────────────

const statutConfig: Record<
    ContratData['statut'],
    { label: string; color: string; icon: React.ReactNode }
> = {
    genere: {
        label: 'Généré',
        color: 'bg-blue-100 text-blue-800 border border-blue-200',
        icon: <FileText className="h-4 w-4 text-blue-600" />,
    },
    en_attente_signatures: {
        label: 'En attente de signatures',
        color: 'bg-amber-100 text-amber-800 border border-amber-200',
        icon: <Clock className="h-4 w-4 text-amber-600" />,
    },
    partiellement_signe: {
        label: 'Partiellement signé',
        color: 'bg-orange-100 text-orange-800 border border-orange-200',
        icon: <Clock className="h-4 w-4 text-orange-600" />,
    },
    finalise: {
        label: 'Finalisé',
        color: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        icon: <CheckCircle className="h-4 w-4 text-emerald-600" />,
    },
    annule: {
        label: 'Annulé',
        color: 'bg-red-100 text-red-800 border border-red-200',
        icon: <XCircle className="h-4 w-4 text-red-600" />,
    },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContratViewer({
    contrat,
    peut_signer,
    role_utilisateur,
}: ContratViewerProps) {
    const sc = statutConfig[contrat.statut] ?? statutConfig.genere;

    // Determine if the current user has already signed
    const userHasSigned =
        role_utilisateur === 'client'
            ? contrat.signature_client_at !== null
            : contrat.signature_artisan_at !== null;

    // Show the "Signer" button when:
    // - contrat is signable (genere, en_attente_signatures, or partiellement_signe)
    // - peut_signer is true (current user hasn't signed yet)
    const isSignableStatus = [
        'genere',
        'en_attente_signatures',
        'partiellement_signe',
    ].includes(contrat.statut);

    const showSignerButton = isSignableStatus && peut_signer && !userHasSigned;

    // Waiting for the other party: partiellement_signe + current user already signed
    const showEnAttenteMessage =
        contrat.statut === 'partiellement_signe' && userHasSigned;

    const handleSigner = () => {
        if (
            confirm(
                `Confirmez-vous la signature électronique du contrat ${contrat.numero_contrat} ?\n\nEn signant, vous acceptez les termes et clauses du contrat.`
            )
        ) {
            router.post(route('portal.contrats.signer', { contrat: contrat.id }));
        }
    };

    // Back link depends on role
    const backHref =
        role_utilisateur === 'client' ? '/client/reservations' : '/artisan/reservations';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Contrat ${contrat.numero_contrat} — ArtisanPro`} />

            <div className="flex flex-col gap-6 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* ── Header ── */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Link
                            href={backHref}
                            className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Retour
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">
                                Contrat {contrat.numero_contrat}
                            </h1>
                            <p className="text-sm text-[hsl(20,10%,50%)] mt-0.5">
                                Généré le{' '}
                                {formatDate(contrat.date_debut_prestation)}
                            </p>
                        </div>
                    </div>

                    {/* Statut badge */}
                    <Badge
                        className={`${sc.color} flex items-center gap-1.5 px-3 py-1.5 text-sm`}
                    >
                        {sc.icon}
                        {sc.label}
                    </Badge>
                </div>

                {/* ── Alerts / action banners ── */}

                {/* Finalisé — vert */}
                {contrat.statut === 'finalise' && (
                    <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
                        <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-emerald-800">
                                Contrat finalisé — les deux parties ont signé
                            </p>
                            <p className="text-xs text-emerald-600 mt-0.5">
                                Le PDF final est disponible au téléchargement.
                            </p>
                        </div>
                        <a
                            href={route('portal.contrats.telecharger', {
                                contrat: contrat.id,
                            })}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2 text-sm transition-all shrink-0"
                        >
                            <Download className="h-4 w-4" />
                            Télécharger le PDF final
                        </a>
                    </div>
                )}

                {/* Annulé — rouge */}
                {contrat.statut === 'annule' && (
                    <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
                        <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-800">
                                Ce contrat a été annulé
                            </p>
                            <p className="text-xs text-red-600 mt-0.5">
                                Suite à l'annulation de la réservation, ce contrat n'est plus
                                valide. Aucune signature supplémentaire ne peut être apposée.
                            </p>
                        </div>
                    </div>
                )}

                {/* En attente de l'autre partie */}
                {showEnAttenteMessage && (
                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
                        <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800">
                                En attente de l'autre partie
                            </p>
                            <p className="text-xs text-amber-600 mt-0.5">
                                Votre signature a été enregistrée. Le contrat sera finalisé
                                dès que l'autre partie aura signé.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Main grid ── */}
                <div className="grid gap-6 lg:grid-cols-3">

                    {/* ── Left column — Actions & Parties ── */}
                    <div className="space-y-4">

                        {/* Actions card */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide">
                                Actions
                            </h2>

                            {/* Signer button */}
                            {showSignerButton && (
                                <button
                                    onClick={handleSigner}
                                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-4 py-2.5 text-sm transition-all shadow-sm"
                                >
                                    <PenLine className="h-4 w-4" />
                                    Signer le contrat
                                </button>
                            )}

                            {/* Brouillon PDF link (genere / en_attente_signatures) */}
                            {['genere', 'en_attente_signatures'].includes(
                                contrat.statut
                            ) &&
                                contrat.chemin_pdf_brouillon && (
                                    <a
                                        href={route('portal.contrats.telecharger', {
                                            contrat: contrat.id,
                                        })}
                                        className="flex items-center justify-center gap-2 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white hover:border-amber-300 hover:bg-amber-50 text-[hsl(20,14%,12%)] font-medium px-4 py-2.5 text-sm transition-all"
                                    >
                                        <FileText className="h-4 w-4 text-amber-500" />
                                        Voir le brouillon PDF
                                    </a>
                                )}

                            {/* Télécharger PDF final */}
                            {contrat.statut === 'finalise' && (
                                <a
                                    href={route('portal.contrats.telecharger', {
                                        contrat: contrat.id,
                                    })}
                                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-semibold px-4 py-2.5 text-sm transition-all"
                                >
                                    <Download className="h-4 w-4" />
                                    Télécharger le PDF final
                                </a>
                            )}

                            {/* No actions available */}
                            {!showSignerButton &&
                                contrat.statut !== 'finalise' &&
                                !['genere', 'en_attente_signatures'].includes(
                                    contrat.statut
                                ) && (
                                    <p className="text-xs text-[hsl(20,10%,55%)] text-center py-1">
                                        Aucune action disponible pour le moment.
                                    </p>
                                )}
                        </div>

                        {/* Parties card */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5 space-y-4">
                            <h2 className="text-sm font-semibold text-[hsl(20,10%,50%)] uppercase tracking-wide">
                                Parties au contrat
                            </h2>

                            {/* Client */}
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 shrink-0">
                                    <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-[hsl(20,10%,55%)] mb-0.5">Client</p>
                                    <p className="text-sm font-semibold text-[hsl(20,14%,12%)] truncate">
                                        {contrat.nom_client}
                                    </p>
                                    {contrat.client?.user?.email && (
                                        <p className="text-xs text-[hsl(20,10%,55%)] truncate">
                                            {contrat.client.user.email}
                                        </p>
                                    )}
                                    {/* Signature status */}
                                    <div className="flex items-center gap-1 mt-1">
                                        {contrat.signature_client_at ? (
                                            <>
                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-xs text-emerald-600">
                                                    Signé le{' '}
                                                    {new Date(
                                                        contrat.signature_client_at
                                                    ).toLocaleDateString('fr-FR')}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                <span className="text-xs text-amber-600">
                                                    En attente de signature
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[hsl(30,20%,92%)]" />

                            {/* Artisan */}
                            <div className="flex items-start gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 shrink-0">
                                    <Briefcase className="h-4 w-4 text-amber-600" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs text-[hsl(20,10%,55%)] mb-0.5">Artisan</p>
                                    <p className="text-sm font-semibold text-[hsl(20,14%,12%)] truncate">
                                        {contrat.nom_artisan}
                                    </p>
                                    {contrat.artisan?.user?.email && (
                                        <p className="text-xs text-[hsl(20,10%,55%)] truncate">
                                            {contrat.artisan.user.email}
                                        </p>
                                    )}
                                    {/* Signature status */}
                                    <div className="flex items-center gap-1 mt-1">
                                        {contrat.signature_artisan_at ? (
                                            <>
                                                <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                                <span className="text-xs text-emerald-600">
                                                    Signé le{' '}
                                                    {new Date(
                                                        contrat.signature_artisan_at
                                                    ).toLocaleDateString('fr-FR')}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                                                <span className="text-xs text-amber-600">
                                                    En attente de signature
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Right column — Details & Clauses ── */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Contrat details card */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm">
                            <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-amber-500" />
                                <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">
                                    Détails du contrat
                                </h2>
                            </div>

                            <div className="p-6 grid gap-5 md:grid-cols-2">

                                {/* Numéro */}
                                <div>
                                    <p className="text-xs text-[hsl(20,10%,55%)] mb-1">
                                        Numéro de contrat
                                    </p>
                                    <p className="text-sm font-mono font-semibold text-[hsl(20,14%,12%)]">
                                        {contrat.numero_contrat}
                                    </p>
                                </div>

                                {/* Statut */}
                                <div>
                                    <p className="text-xs text-[hsl(20,10%,55%)] mb-1">Statut</p>
                                    <Badge
                                        className={`${sc.color} flex items-center gap-1.5 w-fit`}
                                    >
                                        {sc.icon}
                                        {sc.label}
                                    </Badge>
                                </div>

                                {/* Montant */}
                                <div>
                                    <p className="text-xs text-[hsl(20,10%,55%)] mb-1">
                                        Montant total
                                    </p>
                                    <p className="text-lg font-bold text-[hsl(20,14%,12%)]">
                                        {formatMontant(contrat.montant_total)}
                                    </p>
                                </div>

                                {/* Date début */}
                                <div>
                                    <p className="text-xs text-[hsl(20,10%,55%)] mb-1">
                                        Date de début
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 text-amber-500" />
                                        <p className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                            {formatDate(contrat.date_debut_prestation)}
                                        </p>
                                    </div>
                                </div>

                                {/* Date fin */}
                                {contrat.date_fin_prestation && (
                                    <div>
                                        <p className="text-xs text-[hsl(20,10%,55%)] mb-1">
                                            Date de fin
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4 text-amber-500" />
                                            <p className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                                {formatDate(contrat.date_fin_prestation)}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Adresse */}
                                {contrat.adresse_intervention && (
                                    <div className="md:col-span-2">
                                        <p className="text-xs text-[hsl(20,10%,55%)] mb-1">
                                            Adresse d'intervention
                                        </p>
                                        <div className="flex items-start gap-2">
                                            <MapPin className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                            <p className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                                {contrat.adresse_intervention}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                <div className="md:col-span-2">
                                    <p className="text-xs text-[hsl(20,10%,55%)] mb-1">
                                        Description de la prestation
                                    </p>
                                    <p className="text-sm text-[hsl(20,10%,35%)] bg-[hsl(36,33%,97%)] rounded-xl p-3 leading-relaxed">
                                        {contrat.description_prestation}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Clauses de litige card */}
                        {contrat.clauses_litige && contrat.clauses_litige.length > 0 && (
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm">
                                <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4 flex items-center gap-2">
                                    <Scale className="h-4 w-4 text-amber-500" />
                                    <h2 className="text-base font-semibold text-[hsl(20,14%,12%)]">
                                        Clauses de litige
                                    </h2>
                                </div>

                                <div className="divide-y divide-[hsl(30,20%,92%)]">
                                    {contrat.clauses_litige.map((clause) => (
                                        <div key={clause.id} className="px-6 py-4">
                                            <div className="flex items-start gap-2 mb-1.5">
                                                <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                                                <p className="text-sm font-semibold text-[hsl(20,14%,12%)]">
                                                    {clause.titre}
                                                </p>
                                            </div>
                                            <p className="text-sm text-[hsl(20,10%,40%)] leading-relaxed pl-6">
                                                {clause.contenu}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Sign banner (bottom CTA for partiellement_signe + not yet signed) */}
                        {showSignerButton && (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex items-start gap-3">
                                    <PenLine className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">
                                            Votre signature est requise
                                        </p>
                                        <p className="text-xs text-amber-600 mt-0.5">
                                            En signant, vous acceptez l'ensemble des termes et clauses de ce contrat.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSigner}
                                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-5 py-2.5 text-sm transition-all shadow-sm shrink-0"
                                >
                                    <PenLine className="h-4 w-4" />
                                    Signer le contrat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
