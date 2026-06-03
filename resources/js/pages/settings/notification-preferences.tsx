import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Préférences de notification', href: '/settings/notification-preferences' },
];

export default function NotificationPreferences() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const [pushEnabled, setPushEnabled] = useState<boolean>(
        Boolean(user.push_notifications_enabled ?? false),
    );
    const [smsEnabled, setSmsEnabled] = useState<boolean>(
        Boolean(user.sms_notifications_enabled ?? false),
    );

    function handleToggle(field: 'push_notifications_enabled' | 'sms_notifications_enabled', value: boolean) {
        router.patch(
            route('settings.notification-preferences'),
            { [field]: value },
            { preserveScroll: true },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Préférences de notification" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="Notifications"
                        description="Gérez comment vous souhaitez être notifié"
                    />

                    <div className="space-y-4">
                        {/* Notifications push */}
                        <div className="flex items-center justify-between rounded-xl border border-[hsl(30,20%,82%)] bg-white px-5 py-4">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold text-[hsl(20,14%,20%)]">
                                    Notifications push
                                </Label>
                                <p className="text-xs text-[hsl(20,10%,55%)]">
                                    Recevez des alertes en temps réel sur votre appareil
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={pushEnabled}
                                onClick={() => {
                                    const next = !pushEnabled;
                                    setPushEnabled(next);
                                    handleToggle('push_notifications_enabled', next);
                                }}
                                className={[
                                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                                    pushEnabled
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        : 'bg-[hsl(30,20%,82%)]',
                                ].join(' ')}
                            >
                                <span
                                    className={[
                                        'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
                                        pushEnabled ? 'translate-x-6' : 'translate-x-1',
                                    ].join(' ')}
                                />
                            </button>
                        </div>

                        {/* Notifications SMS */}
                        <div className="flex items-center justify-between rounded-xl border border-[hsl(30,20%,82%)] bg-white px-5 py-4">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-semibold text-[hsl(20,14%,20%)]">
                                    Notifications SMS
                                </Label>
                                <p className="text-xs text-[hsl(20,10%,55%)]">
                                    Recevez des messages SMS pour les événements importants
                                </p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={smsEnabled}
                                onClick={() => {
                                    const next = !smsEnabled;
                                    setSmsEnabled(next);
                                    handleToggle('sms_notifications_enabled', next);
                                }}
                                className={[
                                    'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
                                    smsEnabled
                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                                        : 'bg-[hsl(30,20%,82%)]',
                                ].join(' ')}
                            >
                                <span
                                    className={[
                                        'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform',
                                        smsEnabled ? 'translate-x-6' : 'translate-x-1',
                                    ].join(' ')}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
