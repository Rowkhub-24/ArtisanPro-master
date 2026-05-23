import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function NotificationsPage() {
    return (
        <AppLayout>
            <Head title="Notifications - ArtisanPro" />
            <div className="mx-auto max-w-3xl px-6 py-10">
                <h1 className="text-2xl font-bold">Notifications</h1>
                <p className="mt-4 text-gray-600">Liste des notifications utilisateur.</p>
            </div>
        </AppLayout>
    );
}
