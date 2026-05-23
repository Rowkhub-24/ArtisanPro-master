import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

export default function AdminReports() {
    return (
        <AdminLayout>
            <Head title="Rapports - ArtisanPro" />
            <div className="mx-auto max-w-6xl px-6 py-10">
                <h1 className="text-2xl font-bold">Rapports</h1>
                <p className="mt-4 text-gray-600">Tableaux et rapports administratifs (revenus, activité, litiges).</p>
            </div>
        </AdminLayout>
    );
}
