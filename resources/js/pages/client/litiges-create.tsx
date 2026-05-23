import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type SharedData, type BreadcrumbItem } from '@/types';

interface ReservationOption {
    id: number;
    reference: string;
    date_reservation: string;
    artisan_nom: string;
    artisan_metier: string;
}

interface Props {
    reservations: ReservationOption[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Litiges', href: '/client/litiges' },
    { title: 'Ouvrir un litige', href: '#' },
];

export default function ClientLitigesCreate({ reservations }: Props) {
    const { flash } = usePage<SharedData>().props;
    const form = useForm({
        reservation_id: reservations[0]?.id ?? '',
        description_litige: '',
    });

    const submit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(route('client.litiges.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Ouvrir un litige - ArtisanPro" />

            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href={route('client.litiges')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Ouvrir un litige</h1>
                        <p className="mt-1 text-gray-600">Signalez un problème à propos d'une réservation et notre équipe vous contactera.</p>
                    </div>
                </div>

                {flash?.error && (
                    <Alert className="border-red-200 bg-red-50 text-red-800">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}
                {flash?.success && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}

                <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-medium text-orange-900">Pourquoi ouvrir un litige ?</p>
                                <p className="text-sm text-orange-700 mt-1">
                                    Notre équipe de support informe le client et l’administrateur dès qu’un litige est enregistré.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle>Détails du litige</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <label htmlFor="reservation_id" className="block text-sm font-medium text-gray-700">
                                    Réservation concernée
                                </label>
                                <select
                                    id="reservation_id"
                                    value={form.data.reservation_id}
                                    onChange={(e) => form.setData('reservation_id', Number(e.target.value))}
                                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20"
                                >
                                    {reservations.map((reservation) => (
                                        <option key={reservation.id} value={reservation.id}>
                                            {reservation.reference} — {reservation.artisan_metier} ({reservation.artisan_nom}) — {reservation.date_reservation}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.reservation_id && (
                                    <p className="mt-2 text-sm text-red-600">{form.errors.reservation_id}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="description_litige" className="block text-sm font-medium text-gray-700">
                                    Description du litige
                                </label>
                                <textarea
                                    id="description_litige"
                                    value={form.data.description_litige}
                                    onChange={(e) => form.setData('description_litige', e.target.value)}
                                    rows={8}
                                    placeholder="Expliquez le problème rencontré avec l'artisan..."
                                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                                {form.errors.description_litige && (
                                    <p className="mt-2 text-sm text-red-600">{form.errors.description_litige}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <Button asChild variant="outline">
                                    <Link href={route('client.litiges')}>Retour aux litiges</Link>
                                </Button>
                                <Button type="submit" disabled={form.processing || reservations.length === 0} className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white">
                                    {form.processing ? 'Ouverture en cours...' : 'Ouvrir le litige'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {reservations.length === 0 && (
                    <Card className="border-dashed border-2 border-gray-200 bg-white">
                        <CardContent className="p-8 text-center">
                            <p className="text-sm text-gray-600">Aucune réservation trouvée pour ouvrir un litige. Vérifiez votre historique ou contactez le support.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
