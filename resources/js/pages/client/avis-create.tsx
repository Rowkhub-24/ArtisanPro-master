import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { type SharedData, type BreadcrumbItem } from '@/types';

interface ReservationDetail {
    id: number;
    date_reservation: string;
    artisan?: {
        metier: string;
        user: {
            prenom: string;
            nom: string;
        };
    };
}

interface Props {
    reservation: ReservationDetail;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Mes Réservations', href: '/client/reservations' },
    { title: 'Donner un avis', href: '#' },
];

function StarButton({ value, selected, onClick }: { value: number; selected: number; onClick: (value: number) => void }) {
    const isSelected = value <= selected;
    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={`rounded-xl border px-3 py-2 transition-all ${
                isSelected
                    ? 'border-amber-400 bg-amber-100 text-amber-700'
                    : 'border-[hsl(30,20%,82%)] bg-white text-[hsl(20,10%,50%)] hover:border-amber-300'
            }`}
        >
            <Star className={`inline h-4 w-4 ${isSelected ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            <span className="sr-only">{value} étoiles</span>
        </button>
    );
}

export default function ClientAvisCreate({ reservation }: Props) {
    const { flash } = usePage<SharedData>().props;
    const [note, setNote] = useState(5);
    const form = useForm({ reservation_id: reservation.id, note, commentaire: '' });

    const handleNote = (value: number) => {
        setNote(value);
        form.setData('note', value);
    };

    const submit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        form.post(route('client.avis.store'));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Donner un avis - ArtisanPro" />

            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('client.reservations')}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Donner un avis</h1>
                        <p className="mt-1 text-[hsl(20,10%,50%)]">Partagez votre expérience avec l'artisan.</p>
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

                {/* Reservation info */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                    <h2 className="font-semibold text-[hsl(20,14%,12%)] mb-4">Réservation #{reservation.id}</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-[hsl(20,10%,50%)]">Artisan</p>
                            <p className="font-semibold text-[hsl(20,14%,12%)]">
                                {reservation.artisan?.metier}
                            </p>
                            <p className="text-sm text-[hsl(20,10%,50%)]">
                                {reservation.artisan?.user.prenom} {reservation.artisan?.user.nom || ''}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-[hsl(20,10%,50%)]">Date de prestation</p>
                            <p className="font-semibold text-[hsl(20,14%,12%)]">
                                {new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Review form */}
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-6">
                    <h2 className="font-semibold text-[hsl(20,14%,12%)] mb-6">Votre avis</h2>
                    <form onSubmit={submit} className="space-y-6">
                        <div>
                            <p className="text-sm font-medium text-[hsl(20,14%,12%)]">Note</p>
                            <div className="mt-3 flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((value) => (
                                    <StarButton key={value} value={value} selected={note} onClick={handleNote} />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label htmlFor="commentaire" className="block text-sm font-medium text-[hsl(20,14%,12%)]">
                                Commentaire
                            </label>
                            <textarea
                                id="commentaire"
                                value={form.data.commentaire}
                                onChange={(e) => form.setData('commentaire', e.target.value)}
                                rows={6}
                                placeholder="Racontez votre expérience avec l'artisan..."
                                className="mt-2 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-[hsl(20,14%,12%)] placeholder-[hsl(20,10%,60%)] focus:border-amber-400 focus:outline-none"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <Link
                                href={route('client.avis')}
                                className="inline-flex items-center rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-amber-400 transition-colors"
                            >
                                Retour aux avis
                            </Link>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-6 py-2 text-sm transition-all disabled:opacity-60"
                            >
                                {form.processing ? 'Enregistrement...' : 'Publier mon avis'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
