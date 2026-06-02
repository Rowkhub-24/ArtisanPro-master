import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import KkiapayWidget from '@/components/kkiapay-widget';
import AppLayout from '@/layouts/app-layout';
import { type SharedData, type BreadcrumbItem } from '@/types';

interface ReservationDetail {
    id: number;
    statut: string;
    date: string;
    date_reservation: string;
    montant_total: number | null;
    artisan?: {
        metier: string;
        user: {
            prenom: string;
            nom: string;
            telephone?: string;
        };
        payment_provider?: string | null;
        payment_provider_name?: string | null;
        payment_method?: 'card' | 'mobile_money' | 'virement' | null;
    };
}

interface Props {
    reservation: ReservationDetail;
    kkiapay_public_key?: string;
    kkiapay_sandbox?: boolean;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Mes Réservations', href: '/client/reservations' },
    { title: 'Paiement', href: '#' },
];

export default function ClientPaiementCreate({ reservation, kkiapay_public_key, kkiapay_sandbox }: Props) {
    const { auth, flash } = usePage<SharedData>().props;

    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'failed'>('idle');
    const [paymentMessage, setPaymentMessage] = useState('');

    // Clé publique KkiaPay — depuis les props Inertia ou fallback env
    const publicKey = kkiapay_public_key ?? '2201f9a037d211f09a5c9f72fcc1e14b';
    const isSandbox = kkiapay_sandbox ?? false;

    // URL de callback Laravel après paiement
    const callbackUrl = `${window.location.origin}/payment/kkiapay/callback?reservation_id=${reservation.id}`;

    // Données utilisateur pour pré-remplir le widget
    const userName = auth?.user
        ? `${(auth.user as { prenom?: string }).prenom ?? ''} ${(auth.user as { nom?: string }).nom ?? ''}`.trim()
        : undefined;
    const userEmail = (auth?.user as { email?: string })?.email;

    const handleSuccess = async (transactionId: string) => {
        setPaymentStatus('success');
        setPaymentMessage(`Paiement confirme ! Reference : ${transactionId}`);

        // Enregistrer le paiement cote serveur (idempotent)
        try {
            await fetch(route('client.paiements.kkiapay.confirm'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    transaction_id: transactionId,
                    reservation_id: reservation.id,
                }),
            });
        } catch (_) {
            // L'echec ici est non bloquant — le callback HTTP de Kkiapay
            // servira de filet de securite en production
        }

        // Rediriger vers la reservation apres 2 secondes
        setTimeout(() => {
            window.location.href = route('client.reservations.show', reservation.id);
        }, 2000);
    };

    const handleFailed = (message: string) => {
        setPaymentStatus('failed');
        setPaymentMessage(message || 'Le paiement a échoué. Veuillez réessayer.');
    };

    const montant = Number(reservation.montant_total ?? 0);

    // Acompte = 30% du montant total
    const ACOMPTE_TAUX = 0.30;
    const montantAcompte = Math.round(montant * ACOMPTE_TAUX);
    const montantSolde   = montant - montantAcompte;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paiement de réservation - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('client.reservations')}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Finaliser le paiement</h1>
                        <p className="mt-1 text-[hsl(20,10%,50%)]">Réservation #{reservation.id}</p>
                    </div>
                </div>

                {/* Flash messages */}
                {flash?.success && (
                    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}
                {flash?.error && (
                    <Alert className="border-red-200 bg-red-50 text-red-800">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                {/* Statut paiement en temps réel */}
                {paymentStatus === 'success' && (
                    <Alert className="border-emerald-200 bg-emerald-50">
                        <CheckCircle className="h-4 w-4 text-emerald-600" />
                        <AlertDescription className="text-emerald-800 font-medium">
                            {paymentMessage} — Redirection en cours…
                        </AlertDescription>
                    </Alert>
                )}
                {paymentStatus === 'failed' && (
                    <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {paymentMessage}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 lg:grid-cols-3">

                    {/* Récapitulatif — sticky */}
                    <div className="lg:col-span-1">
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm sticky top-6 p-6">
                            <h2 className="font-semibold text-[hsl(20,14%,12%)] mb-4">Récapitulatif</h2>

                            <div className="border-t border-[hsl(30,20%,88%)] pt-4">
                                <h3 className="font-semibold text-[hsl(20,14%,12%)]">
                                    {reservation.artisan?.metier}
                                </h3>
                                <p className="text-sm text-[hsl(20,10%,50%)] mt-1">
                                    {reservation.artisan?.user.prenom} {reservation.artisan?.user.nom}
                                </p>
                            </div>

                            <div className="border-t border-[hsl(30,20%,88%)] pt-4 mt-4 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[hsl(20,10%,50%)]">Date</span>
                                    <span className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                        {new Date(reservation.date_reservation ?? reservation.date).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-[hsl(20,10%,50%)]">Statut</span>
                                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200">Confirmée</Badge>
                                </div>
                            </div>

                            <div className="border-t border-[hsl(30,20%,88%)] pt-4 mt-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[hsl(20,14%,12%)] font-medium">Montant total</span>
                                    <span className="text-lg font-semibold text-[hsl(20,14%,12%)]">
                                        {montant.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="text-sm text-amber-700 font-medium">Acompte à payer (30%)</span>
                                    <span className="text-2xl font-bold text-amber-600">
                                        {montantAcompte.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-[hsl(20,10%,55%)]">Solde restant après prestation</span>
                                    <span className="text-sm font-medium text-[hsl(20,10%,45%)]">
                                        {montantSolde.toLocaleString('fr-FR')} FCFA
                                    </span>
                                </div>
                            </div>

                            {/* Notice sécurité */}
                            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-4">
                                <ShieldCheck className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-700">
                                    Paiement sécurisé via KkiaPay. Vos données bancaires ne transitent pas par nos serveurs.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Zone de paiement KkiaPay */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                            <h2 className="font-semibold text-[hsl(20,14%,12%)] mb-1">Payer via KkiaPay</h2>
                            <p className="text-sm text-[hsl(20,10%,50%)] mb-6">
                                Cliquez sur le bouton ci-dessous pour ouvrir la fenêtre de paiement sécurisée KkiaPay.
                                Vous pouvez payer par carte bancaire ou Mobile Money (MTN, Moov, etc.).
                            </p>

                            {/* Logo KkiaPay + info */}
                            <div className="flex items-center gap-3 rounded-xl border border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)] p-4 mb-6">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-sm shrink-0">
                                    K
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[hsl(20,14%,12%)]">KkiaPay</p>
                                    <p className="text-xs text-[hsl(20,10%,50%)]">
                                        Carte bancaire · Mobile Money · Orange Money · MTN MoMo
                                    </p>
                                </div>
                                <div className="ml-auto">
                                    <Badge className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs">
                                        Sécurisé
                                    </Badge>
                                </div>
                            </div>

                            {/* Montant affiché */}
                            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-[hsl(20,10%,50%)]">Montant total de la prestation</span>
                                    <span className="text-sm font-semibold text-[hsl(20,14%,12%)]">{montant.toLocaleString('fr-FR')} FCFA</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-amber-200 pt-2">
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">Acompte à verser maintenant (30%)</p>
                                        <p className="text-xs text-amber-600">Le solde de {montantSolde.toLocaleString('fr-FR')} FCFA sera réglé après la prestation</p>
                                    </div>
                                    <p className="text-3xl font-bold text-amber-600 ml-4">
                                        {montantAcompte.toLocaleString('fr-FR')} FCFA
                                    </p>
                                </div>
                                <p className="text-xs text-amber-600 mt-2 text-center">
                                    Réservation #{reservation.id} · {reservation.artisan?.metier}
                                </p>
                            </div>

                            {/* Bouton KkiaPay */}
                            <div className="flex flex-col items-center gap-4">
                                <KkiapayWidget
                                    amount={montantAcompte}
                                    publicKey={publicKey}
                                    callbackUrl={callbackUrl}
                                    email={userEmail}
                                    name={userName}
                                    sandbox={isSandbox}
                                    data={JSON.stringify({ reservation_id: reservation.id })}
                                    onSuccess={handleSuccess}
                                    onFailed={handleFailed}
                                    label={`Payer l'acompte — ${montantAcompte.toLocaleString('fr-FR')} FCFA`}
                                    className="w-full max-w-sm py-3 text-base"
                                    disabled={paymentStatus === 'success'}
                                />

                                <Link
                                    href={route('client.reservations')}
                                    className="text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                                >
                                    Annuler et retourner aux réservations
                                </Link>
                            </div>

                            {/* Méthodes acceptées */}
                            <div className="mt-6 pt-6 border-t border-[hsl(30,20%,88%)]">
                                <p className="text-xs text-center text-[hsl(20,10%,55%)] mb-3">Méthodes de paiement acceptées</p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {['Visa', 'Mastercard', 'MTN MoMo', 'Moov Money', 'Orange Money'].map((method) => (
                                        <span
                                            key={method}
                                            className="rounded-lg border border-[hsl(30,20%,88%)] bg-white px-3 py-1 text-xs font-medium text-[hsl(20,14%,12%)]"
                                        >
                                            {method}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
