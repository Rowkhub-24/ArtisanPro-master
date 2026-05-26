import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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

            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('client.litiges')}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Ouvrir un litige</h1>
                        <p className="mt-1 text-[hsl(20,10%,50%)]">Signalez un problème à propos d'une réservation et notre équipe vous contactera.</p>
                    </div>
                </div>

                {flash?.error && (
                    <Alert className="border-red-200 bg-red-50 text-red-800">
                        <AlertDescription>{flash.error}</AlertDescription>
                    </Alert>
                )}
                {flash?.success && (
                    <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}

                {/* Info Banner */}
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-medium text-amber-900">Pourquoi ouvrir un litige ?</p>
                            <p className="text-sm text-amber-700 mt-1">
                                Notre équipe de support informe le client et l'administrateur dès qu'un litige est enregistré.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                    <h2 className="font-semibold text-[hsl(20,14%,12%)] mb-6">Détails du litige</h2>
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <label htmlFor="reservation_id" className="block text-sm font-medium text-[hsl(20,14%,12%)]">
                                Réservation concernée
                            </label>
                            <select
                                id="reservation_id"
                                value={form.data.reservation_id}
                                onChange={(e) => form.setData('reservation_id', Number(e.target.value))}
                                className="mt-2 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none"
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
                            <label htmlFor="description_litige" className="block text-sm font-medium text-[hsl(20,14%,12%)]">
                                Description du litige
                            </label>
                            <textarea
                                id="description_litige"
                                value={form.data.description_litige}
                                onChange={(e) => form.setData('description_litige', e.target.value)}
                                rows={8}
                                placeholder="Expliquez le problème rencontré avec l'artisan..."
                                className="mt-2 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-[hsl(20,14%,12%)] placeholder-[hsl(20,10%,60%)] focus:border-amber-400 focus:outline-none"
                            />
                            {form.errors.description_litige && (
                                <p className="mt-2 text-sm text-red-600">{form.errors.description_litige}</p>
                            )}
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <Link
                                href={route('client.litiges')}
                                className="inline-flex items-center rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors"
                            >
                                Retour aux litiges
                            </Link>
                            <button
                                type="submit"
                                disabled={form.processing || reservations.length === 0}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-semibold px-6 py-2 text-sm transition-all disabled:opacity-60"
                            >
                                {form.processing ? 'Ouverture en cours...' : 'Ouvrir le litige'}
                            </button>
                        </div>
                    </form>
                </div>

                {reservations.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,88%)] bg-white p-8 text-center">
                        <p className="text-sm text-[hsl(20,10%,50%)]">Aucune réservation trouvée pour ouvrir un litige. Vérifiez votre historique ou contactez le support.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
