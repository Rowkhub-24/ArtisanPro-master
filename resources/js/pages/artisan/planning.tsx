import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ArtisanPlanning() {
    return (
        <AppLayout>
            <Head title="Planning - ArtisanPro" />
            <div className="min-h-screen bg-[hsl(36,33%,97%)]">
                <div className="mx-auto max-w-6xl px-6 py-10">
                    <h1 className="text-2xl font-bold text-amber-600">Planning</h1>
                    <p className="mt-4 text-[hsl(20,10%,50%)]">Vue calendrier / planning de disponibilité de l&apos;artisan.</p>
                </div>
            </div>
        </AppLayout>
    );
}
