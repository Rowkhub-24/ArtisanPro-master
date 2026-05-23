import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ArtisanAcademy() {
    return (
        <AppLayout>
            <Head title="Académie - ArtisanPro" />
            <div className="mx-auto max-w-5xl px-6 py-10">
                <h1 className="text-2xl font-bold">Académie</h1>
                <p className="mt-4 text-gray-600">Ressources de formation pour artisans (cours, certifications).</p>
            </div>
        </AppLayout>
    );
}
