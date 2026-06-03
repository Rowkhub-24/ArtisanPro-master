<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferencesController extends Controller
{
    /**
     * Show the notification preferences settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/notification-preferences', [
            'push_notifications_enabled' => (bool) $request->user()->push_notifications_enabled,
            'sms_notifications_enabled'  => (bool) $request->user()->sms_notifications_enabled,
            'push_permission_status'     => $request->user()->push_permission_status ?? 'default',
        ]);
    }

    /**
     * Update the user's notification preferences.
     */
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'push_notifications_enabled' => ['nullable', 'boolean'],
            'sms_notifications_enabled'  => ['nullable', 'boolean'],
            'push_permission_status'     => ['nullable', 'in:granted,denied,default'],
        ]);

        $request->user()->fill($validated);
        $request->user()->save();

        return back();
    }
}
