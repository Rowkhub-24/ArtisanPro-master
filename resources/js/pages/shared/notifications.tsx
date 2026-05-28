import { Head, router } from '@inertiajs/react';
import { Bell, CheckCheck, Info, AlertTriangle, CreditCard, Calendar, MessageSquare } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/dashboard' },
    { title: 'Notifications', href: '/notifications' },
];

interface NotificationItem {
    id: number;
    message: string;
    type: string;
    lue: boolean;
    date: string;
}

interface Props {
    notifications: NotificationItem[];
    non_lues: number;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    reservation: { icon: <Calendar className="h-4 w-4" />,     color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-100' },
    paiement:    { icon: <CreditCard className="h-4 w-4" />,   color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    litige:      { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-red-600',     bg: 'bg-red-50 border-red-100' },
    avis:        { icon: <MessageSquare className="h-4 w-4" />, color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100' },
    systeme:     { icon: <Info className="h-4 w-4" />,          color: 'text-gray-600',    bg: 'bg-gray-50 border-gray-100' },
};

export default function NotificationsPage({ notifications = [], non_lues = 0 }: Props) {
    const marquerLue = (id: number) => {
        router.patch(route('notifications.lue', id), {}, { preserveScroll: true });
    };

    const marquerToutesLues = () => {
        router.patch(route('notifications.toutes-lues'), {}, { preserveScroll: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notifications - ArtisanPro" />
            <div className="min-h-screen bg-[hsl(36,33%,97%)] p-6">
                <div className="mx-auto max-w-3xl space-y-6">

                    {/* Header */}
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                <Bell className="h-5 w-5" />
                                {non_lues > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                                        {non_lues > 9 ? '9+' : non_lues}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-[hsl(20,14%,12%)]">Notifications</h1>
                                <p className="text-sm text-[hsl(20,10%,50%)]">
                                    {non_lues > 0 ? `${non_lues} non lue${non_lues > 1 ? 's' : ''}` : 'Tout est lu'}
                                </p>
                            </div>
                        </div>
                        {non_lues > 0 && (
                            <Button
                                variant="outline"
                                onClick={marquerToutesLues}
                                className="border-amber-200 text-amber-700 hover:bg-amber-50"
                            >
                                <CheckCheck className="h-4 w-4 mr-2" />
                                Tout marquer comme lu
                            </Button>
                        )}
                    </div>

                    {/* List */}
                    {notifications.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-[hsl(30,20%,82%)] bg-white p-12 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 border border-amber-100 text-amber-500 mx-auto mb-4">
                                <Bell className="h-7 w-7" />
                            </div>
                            <p className="text-base font-semibold text-[hsl(20,14%,12%)]">Aucune notification</p>
                            <p className="mt-1 text-sm text-[hsl(20,10%,50%)]">Vos notifications apparaîtront ici.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {notifications.map((n) => {
                                const tc = typeConfig[n.type] ?? typeConfig.systeme;
                                return (
                                    <div
                                        key={n.id}
                                        className={`rounded-2xl border bg-white shadow-sm p-4 transition-all ${
                                            n.lue
                                                ? 'border-[hsl(30,20%,88%)] opacity-70'
                                                : 'border-amber-200 shadow-amber-50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${tc.bg} ${tc.color}`}>
                                                {tc.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm leading-relaxed ${n.lue ? 'text-gray-500' : 'text-[hsl(20,14%,12%)] font-medium'}`}>
                                                    {n.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">{n.date}</p>
                                            </div>
                                            {!n.lue && (
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                                                    <button
                                                        onClick={() => marquerLue(n.id)}
                                                        className="text-xs text-gray-400 hover:text-amber-600 transition-colors"
                                                    >
                                                        Marquer lu
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
