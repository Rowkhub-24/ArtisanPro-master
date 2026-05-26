import { Head } from '@inertiajs/react';
import AdminLayout from '@/layouts/admin-layout';

export default function AdminReports() {
    return (
        <AdminLayout>
            <Head title="Rapports - ArtisanPro" />
            <div className="mx-auto max-w-6xl px-6 py-10">
                <h1 className="text-2xl font-bold text-amber-700">Rapports</h1>
                <p className="mt-4 text-[hsl(20,10%,50%)]">Tableaux et rapports administratifs (revenus, activité, litiges).</p>
            </div>
        </AdminLayout>
    );
}
