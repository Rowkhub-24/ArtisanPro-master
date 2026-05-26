<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class NotificationsController extends Controller
{
    public function __invoke(): Response
    {
        $user = auth()->user();

        $notifications = Notification::where('id_utilisateur', $user->id)
            ->orderByDesc('date_envoi')
            ->limit(50)
            ->get()
            ->map(fn ($n) => [
                'id'      => $n->id,
                'message' => $n->message,
                'type'    => $n->type_notification,
                'lue'     => $n->lue,
                'date'    => $n->date_envoi?->diffForHumans(),
            ]);

        $non_lues = Notification::where('id_utilisateur', $user->id)
            ->where('lue', false)
            ->count();

        return Inertia::render('shared/notifications', [
            'notifications' => $notifications,
            'non_lues'      => $non_lues,
        ]);
    }

    /** Marquer une notification comme lue */
    public function marquerLue(int $id): RedirectResponse
    {
        Notification::where('id', $id)
            ->where('id_utilisateur', auth()->id())
            ->update(['lue' => true]);

        return back();
    }

    /** Marquer toutes comme lues */
    public function marquerToutesLues(): RedirectResponse
    {
        Notification::where('id_utilisateur', auth()->id())
            ->where('lue', false)
            ->update(['lue' => true]);

        return back()->with('success', 'Toutes les notifications ont été marquées comme lues.');
    }

    /** Nombre de notifications non lues (API JSON) */
    public function compteur(): JsonResponse
    {
        $count = Notification::where('id_utilisateur', auth()->id())
            ->where('lue', false)
            ->count();

        return response()->json(['count' => $count]);
    }
}
