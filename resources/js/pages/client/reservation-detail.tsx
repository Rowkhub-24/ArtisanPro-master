import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

export default function ClientReservationDetail() {
    return (
        <AppLayout>
            <Head title="Détail réservation - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">
                <div className="flex items-center gap-4">
                    <Link
                        href={route('client.reservations')}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour aux réservations
                    </Link>
                </div>
                <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-8">
                    <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">Détail de la réservation</h1>
                    <p className="mt-4 text-[hsl(20,10%,50%)]">Ici s'afficheront les détails d'une réservation (id, artisan, date, statut, messages, etc.).</p>
                </div>
            </div>
        </AppLayout>
    );
}
