import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ClientReservationDetail() {
    return (
        <AppLayout>
            <Head title="Détail réservation - ArtisanPro" />
            <div className="mx-auto max-w-7xl px-6 py-10">
                <h1 className="text-2xl font-bold">Détail de la réservation</h1>
                <p className="mt-4 text-gray-600">Ici s'afficheront les détails d'une réservation (id, artisan, date, statut, messages, etc.).</p>
                <Link href={route('client.reservations')} className="mt-6 inline-block text-blue-600">Retour aux réservations</Link>
            </div>
        </AppLayout>
    );
}
