import { router } from '@inertiajs/react';
import { useEffect } from 'react';

/**
 * Requests browser push notification permission and syncs
 * the result to the backend via PATCH /settings/notification-preferences.
 *
 * Per Q5/Q14: skip sending push if permission is 'denied' or not granted.
 * Called once on first login/mount.
 */
export function usePushPermission(currentStatus: 'granted' | 'denied' | 'default') {
    useEffect(() => {
        // Only request if status is still 'default' (not yet decided)
        if (currentStatus !== 'default') return;
        if (!('Notification' in window)) return;

        Notification.requestPermission().then((permission) => {
            // Sync permission result to backend
            router.patch(
                route('settings.notification-preferences'),
                { push_permission_status: permission },
                { preserveState: true, preserveScroll: true },
            );
        });
    }, []);
}
