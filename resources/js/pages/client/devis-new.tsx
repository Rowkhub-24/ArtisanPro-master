import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ClientNewDevis() {
    return (
        <AppLayout>
            <Head title="Nouveau devis - ArtisanPro" />
            <div className="mx-auto max-w-3xl px-6 py-10">
                <h1 className="text-2xl font-bold">Créer un nouveau devis</h1>
                <p className="mt-4 text-gray-600">Formulaire pour créer un devis destiné à un artisan.</p>
                <Link href={route('client.devis')} className="mt-6 inline-block text-blue-600">Retour à mes devis</Link>
            </div>
        </AppLayout>
    );
}
