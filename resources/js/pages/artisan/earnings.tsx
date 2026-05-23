import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ArtisanEarnings() {
    return (
        <AppLayout>
            <Head title="Revenus - ArtisanPro" />
            <div className="mx-auto max-w-4xl px-6 py-10">
                <h1 className="text-2xl font-bold">Mes revenus</h1>
                <p className="mt-4 text-gray-600">Historique des paiements et revenus pour l'artisan.</p>
            </div>
        </AppLayout>
    );
}
