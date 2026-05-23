import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, CreditCard, AlertCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tableau de bord',
        href: '/client/dashboard',
    },
    {
        title: 'Mes Réservations',
        href: '/client/reservations',
    },
    {
        title: 'Paiement',
        href: '#',
    },
];

export default function ClientPaiementCreate({ reservation }: Props) {
    const { auth, flash } = usePage<SharedData>().props;

    const artisanMethod = reservation.artisan?.payment_method ?? 'card';

    const paymentForm = useForm({
        reservation_id: reservation.id,
        method: artisanMethod,
        card_number: '',
        card_expiry: '',
        card_cvc: '',
        cardholder_name: '',
    });

    const submitPayment: FormEventHandler = async (e) => {
        e.preventDefault();

        if (!reservation.artisan?.payment_method) {
            alert('L’artisan n’a pas configuré de mode de paiement.');
            return;
        }

        const shouldUseProvider = ['card', 'mobile_money'].includes(paymentForm.data.method);
        if (shouldUseProvider) {
            if (!reservation.artisan?.payment_provider) {
                alert('Le prestataire de paiement de l’artisan n’est pas configuré.');
                return;
            }
            const formData = new FormData();
            Object.entries(paymentForm.data).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, String(value));
                }
            });

            const response = await fetch(route('client.paiements.store'), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                },
            });

            const payload = await response.json();
            if (!response.ok) {
                alert('Erreur de paiement : ' + (payload.message || response.statusText));
                return;
            }

            if (payload.redirect_url) {
                window.location.href = payload.redirect_url;
                return;
            }

            if (payload.redirect) {
                window.location.href = payload.redirect;
                return;
            }

            if (payload.success) {
                window.location.href = route('client.reservations');
                return;
            }

            alert('Paiement initié, mais aucune URL de redirection reçue.');
            return;
        }

        paymentForm.post(route('client.paiements.store'), { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paiement de réservation - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href={route('client.reservations')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Finaliser le paiement</h1>
                        <p className="mt-1 text-gray-600">Réservation #{reservation.id}</p>
                    </div>
                </div>

                {flash?.success && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}

                {flash?.error && (
                    <Alert className="border-red-200 bg-red-50 text-red-800">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Reservation Summary */}
                    <div className="lg:col-span-1">
                        <Card className="border-gray-200 bg-white sticky top-6">
                            <CardHeader>
                                <CardTitle className="text-lg">Récapitulatif</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="font-semibold text-gray-900">
                                        {reservation.artisan?.metier}
                                    </h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        {reservation.artisan?.user.prenom} {reservation.artisan?.user.nom}
                                    </p>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-600">Date</span>
                                        <span className="text-sm font-medium text-gray-900">
                                            {new Date(reservation.date_reservation ?? reservation.date).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Statut</span>
                                        <Badge className="bg-green-100 text-green-800">Confirmée</Badge>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-900">Montant à payer</span>
                                        <span className="text-2xl font-bold text-blue-600">
                                            {Number(reservation.montant_total).toLocaleString('fr-FR')} FCFA
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-blue-700">
                                        Vos paiements sont sécurisés par chiffrement SSL. Aucune donnée de paiement n'est stockée sur nos serveurs.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payment Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-gray-200 bg-white">
                            <CardHeader>
                                <CardTitle>Méthode de paiement</CardTitle>
                                <CardDescription>
                                    Paiement via le mode configuré par l’artisan :
                                    <span className="font-semibold"> {artisanMethod === 'card' ? 'Carte bancaire' : artisanMethod === 'mobile_money' ? 'Mobile Money' : 'Virement bancaire'}</span>
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={submitPayment} className="space-y-6">
                                    {/* Payment Methods */}
                                    <input type="hidden" name="method" value={paymentForm.data.method} />

                                    {reservation.artisan?.payment_method ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3 p-4 border border-gray-300 rounded-lg bg-blue-50">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {reservation.artisan.payment_method === 'card'
                                                            ? 'Carte bancaire'
                                                            : reservation.artisan.payment_method === 'mobile_money'
                                                                ? 'Portefeuille Mobile'
                                                                : 'Virement bancaire'}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Mode de paiement configuré par l’artisan.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                                            <p className="text-sm font-semibold text-red-700">Ce prestataire n’a pas encore configuré de mode de paiement.</p>
                                            <p className="text-sm text-red-600">Veuillez contacter l’artisan avant de continuer.</p>
                                        </div>
                                    )}

                                    {(paymentForm.data.method === 'card' || paymentForm.data.method === 'mobile_money') && (
                                        <div className="space-y-3 border-t border-gray-200 pt-6">
                                            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                                                <p className="text-sm font-medium text-blue-900">Prestataire de paiement</p>
                                                <p className="mt-2 text-sm text-blue-700">
                                                    {reservation.artisan?.payment_provider_name
                                                        ? `Le paiement sera traité via ${reservation.artisan.payment_provider_name}.`
                                                        : 'Le prestataire de paiement de l’artisan n’est pas encore configuré.'}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Card Payment Fields */}
                                    {paymentForm.data.method === 'card' && (
                                        <div className="space-y-4 border-t border-gray-200 pt-6">
                                            <div>
                                                <label htmlFor="cardholder" className="block text-sm font-medium text-gray-700">
                                                    Titulaire de la carte
                                                </label>
                                                <input
                                                    id="cardholder"
                                                    type="text"
                                                    value={paymentForm.data.cardholder_name}
                                                    onChange={(e) => paymentForm.setData('cardholder_name', e.target.value)}
                                                    required={paymentForm.data.method === 'card'}
                                                    placeholder="JOHN DOE"
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="cardnumber" className="block text-sm font-medium text-gray-700">
                                                    Numéro de carte
                                                </label>
                                                <input
                                                    id="cardnumber"
                                                    type="text"
                                                    value={paymentForm.data.card_number}
                                                    onChange={(e) => paymentForm.setData('card_number', e.target.value.replace(/\s/g, ''))}
                                                    required={paymentForm.data.method === 'card'}
                                                    placeholder="4242 4242 4242 4242"
                                                    maxLength={19}
                                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="expiry" className="block text-sm font-medium text-gray-700">
                                                        Expiration
                                                    </label>
                                                    <input
                                                        id="expiry"
                                                        type="text"
                                                        value={paymentForm.data.card_expiry}
                                                        onChange={(e) => paymentForm.setData('card_expiry', e.target.value)}
                                                        required={paymentForm.data.method === 'card'}
                                                        placeholder="MM/YY"
                                                        maxLength={5}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="cvc" className="block text-sm font-medium text-gray-700">
                                                        CVC
                                                    </label>
                                                    <input
                                                        id="cvc"
                                                        type="text"
                                                        value={paymentForm.data.card_cvc}
                                                        onChange={(e) => paymentForm.setData('card_cvc', e.target.value)}
                                                        required={paymentForm.data.method === 'card'}
                                                        placeholder="123"
                                                        maxLength={4}
                                                        className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Mobile Money Fields */}
                                    {paymentForm.data.method === 'mobile_money' && (
                                        <div className="space-y-4 border-t border-gray-200 pt-6 bg-blue-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-700">
                                                Vous recevrez un code de confirmation par SMS. Veuillez entrer ce code dans l'application de votre opérateur mobile.
                                            </p>
                                            <Alert className="border-blue-200 bg-white">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Assurez-vous d'avoir suffisamment de fonds dans votre portefeuille.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}

                                    {/* Virement Fields */}
                                    {paymentForm.data.method === 'virement' && (
                                        <div className="space-y-4 border-t border-gray-200 pt-6 bg-amber-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-700">
                                                Détails du virement vous seront envoyés par email après validation.
                                            </p>
                                            <Alert className="border-amber-200 bg-white">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    Veuillez mentionner le numéro de réservation (#<strong>{reservation.id}</strong>) comme référence.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-3 border-t border-gray-200 pt-6">
                                        <Button 
                                            asChild
                                            type="button" 
                                            variant="outline"
                                            className="flex-1"
                                        >
                                            <Link href={route('client.reservations')}>
                                                Annuler
                                            </Link>
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={paymentForm.processing || !reservation.artisan?.payment_method}
                                            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                                        >
                                            <CreditCard className="mr-2 h-4 w-4" />
                                            {paymentForm.processing ? 'Traitement...' : `Payer ${Number(reservation.montant_total).toLocaleString('fr-FR')} FCFA`}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
