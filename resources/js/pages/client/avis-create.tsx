import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { ArrowLeft, Star } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    return (
        <button
            type="button"
            onClick={() => onClick(value)}
            className={`rounded-full border px-3 py-2 transition ${value <= selected ? 'border-yellow-400 bg-yellow-100 text-yellow-700' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
        >
            <Star className={`inline h-4 w-4 ${value <= selected ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
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

            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href={route('client.reservations')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Donner un avis</h1>
                        <p className="mt-1 text-gray-600">Partagez votre expérience avec l’artisan.</p>
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

                <Card className="border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle>Réservation #{reservation.id}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm text-gray-600">Artisan</p>
                                <p className="font-semibold text-gray-900">
                                    {reservation.artisan?.metier}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {reservation.artisan?.user.prenom} {reservation.artisan?.user.nom || ''}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date de prestation</p>
                                <p className="font-semibold text-gray-900">
                                    {new Date(reservation.date_reservation).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-200 bg-white">
                    <CardHeader>
                        <CardTitle>Votre avis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <p className="text-sm font-medium text-gray-700">Note</p>
                                <div className="mt-3 flex items-center gap-2">
                                    {[1, 2, 3, 4, 5].map((value) => (
                                        <StarButton key={value} value={value} selected={note} onClick={handleNote} />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label htmlFor="commentaire" className="block text-sm font-medium text-gray-700">
                                    Commentaire
                                </label>
                                <textarea
                                    id="commentaire"
                                    value={form.data.commentaire}
                                    onChange={(e) => form.setData('commentaire', e.target.value)}
                                    rows={6}
                                    placeholder="Racontez votre expérience avec l'artisan..."
                                    className="mt-2 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="flex items-center justify-between gap-3">
                                <Button asChild variant="outline">
                                    <Link href={route('client.avis')}>Retour aux avis</Link>
                                </Button>
                                <Button type="submit" disabled={form.processing} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    {form.processing ? 'Enregistrement...' : 'Publier mon avis'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
