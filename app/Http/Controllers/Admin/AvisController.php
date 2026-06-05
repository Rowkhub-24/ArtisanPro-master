<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Concerns\PaginatesForInertia;
use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Avis;
use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AvisController extends Controller
{
    use PaginatesForInertia;
    public function index(Request $request): Response
    {
        $avis = Avis::with([
            'client.user:id,nom,prenom,email',
            'artisan.user:id,nom,prenom',
        ])
            ->when($request->statut, fn ($q, $s) => match ($s) {
                'signale' => $q->where('signale', true),
                'visible' => $q->where('masque', false)->where('signale', false),
                default   => $q,
            })
            ->when($request->q, fn ($q, $s) =>
                $q->where('commentaire', 'like', "%{$s}%")
            )
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        $stats = [
            'total'   => Avis::count(),
            'signale' => Avis::where('signale', true)->count(),
        ];

        return Inertia::render('admin/avis/index', [
            'avis'    => $this->paginateForInertia($avis),
            'stats'   => $stats,
            'filters' => $request->only(['q', 'statut']),
        ]);
    }

    /** Valider un avis signalé (le rendre visible) — raison obligatoire 50+ chars */
    public function valider(Request $request, Avis $avis): RedirectResponse
    {
        $request->validate([
            'raison' => ['required', 'string', 'min:50'],
        ]);

        $avis->update([
            'visible'            => true,
            'masque'             => false,
            'signale'            => false,
            'raison_moderation'  => $request->raison,
        ]);

        // Notifier le client
        if ($avis->client?->user) {
            Notification::notifier(
                $avis->client->user->id,
                "Votre avis a été validé par la modération et est désormais visible.",
                'systeme'
            );
        }

        $this->recalculerNote($avis->id_artisan);

        return back()->with('success', 'Avis validé et rendu visible.');
    }

    /** Supprimer définitivement un avis signalé — raison obligatoire 50+ chars */
    public function supprimer(Request $request, Avis $avis): RedirectResponse
    {
        $request->validate([
            'raison' => ['required', 'string', 'min:50'],
        ]);

        $artisanId = $avis->id_artisan;

        // Enregistrer la raison avant suppression
        $avis->update(['raison_moderation' => $request->raison]);

        // Notifier le client
        if ($avis->client?->user) {
            Notification::notifier(
                $avis->client->user->id,
                "Votre avis a été supprimé définitivement par la modération.",
                'systeme'
            );
        }

        $avis->delete();
        $this->recalculerNote($artisanId);

        return back()->with('success', 'Avis supprimé définitivement.');
    }

    private function recalculerNote(int $artisanId): void
    {
        $artisan = Artisan::find($artisanId);
        if (! $artisan) return;

        $moyenne = Avis::where('id_artisan', $artisanId)
            ->where('masque', false)
            ->avg('note') ?? 0;

        $artisan->update(['note_moyenne' => round($moyenne, 2)]);
    }
}
