import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ArtisanPlanning() {
    return (
        <AppLayout>
            <Head title="Planning - ArtisanPro" />
            <div className="mx-auto max-w-6xl px-6 py-10">
                <h1 className="text-2xl font-bold">Planning</h1>
                <p className="mt-4 text-gray-600">Vue calendrier / planning de disponibilité de l'artisan.</p>
            </div>
        </AppLayout>
    );
}
