import { Head } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

export default function NotificationsPage() {
    return (
        <AppLayout>
            <Head title="Notifications - ArtisanPro" />
            <div className="min-h-screen bg-[hsl(36,33%,97%)] p-6">
                <div className="mx-auto max-w-3xl space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                            <Bell className="h-4 w-4" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">Notifications</h1>
                            <p className="text-sm text-[hsl(20,10%,50%)]">Liste de vos notifications</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,82%)] bg-white p-12 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 mx-auto mb-4">
                            <Bell className="h-7 w-7" />
                        </div>
                        <p className="text-base font-semibold text-[hsl(20,14%,12%)]">Aucune notification</p>
                        <p className="mt-1 text-sm text-[hsl(20,10%,50%)]">Vos notifications apparaîtront ici.</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
