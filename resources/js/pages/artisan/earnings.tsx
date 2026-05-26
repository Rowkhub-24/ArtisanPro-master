import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ArtisanEarnings() {
    return (
        <AppLayout>
            <Head title="Revenus - ArtisanPro" />
            <div className="min-h-screen bg-[hsl(36,33%,97%)]">
                <div className="mx-auto max-w-4xl px-6 py-10">
                    <h1 className="text-2xl font-bold text-amber-600">Mes revenus</h1>
                    <p className="mt-4 text-[hsl(20,10%,50%)]">Historique des paiements et revenus pour l&apos;artisan.</p>
                </div>
            </div>
        </AppLayout>
    );
}
