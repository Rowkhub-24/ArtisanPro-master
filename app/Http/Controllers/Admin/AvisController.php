<?php

namespace App\Http\Controllers\Admin;

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
    public function index(Request $request): Response
    {
        $avis = Avis::with([
            'client.user:id,nom,prenom,email',
            'artisan.user:id,nom,prenom',
        ])
            ->when($request->statut, fn ($q, $s) => match ($s) {
                'signale'  => $q->where('signale', true),
                'masque'   => $q->where('masque', true),
                'visible'  => $q->where('masque', false)->where('signale', false),
                default    => $q,
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
            'masque'  => Avis::where('masque', true)->count(),
        ];

        return Inertia::render('admin/avis/index', [
            'avis'    => $avis,
            'stats'   => $stats,
            'filters' => $request->only(['q', 'statut']),
        ]);
    }

    /** Masquer un avis (modération) */
    public function masquer(Avis $avis): RedirectResponse
    {
        $avis->update(['masque' => true, 'signale' => false]);

        // Notifier le client
        if ($avis->client?->user) {
            Notification::notifier(
                $avis->client->user->id,
                "Votre avis a été masqué par la modération car il ne respecte pas nos conditions d'utilisation.",
                'systeme'
            );
        }

        // Recalculer la note de l'artisan
        $this->recalculerNote($avis->id_artisan);

        return back()->with('success', 'Avis masqué.');
    }

    /** Rendre un avis visible */
    public function restaurer(Avis $avis): RedirectResponse
    {
        $avis->update(['masque' => false, 'signale' => false]);
        $this->recalculerNote($avis->id_artisan);

        return back()->with('success', 'Avis restauré.');
    }

    /** Supprimer définitivement un avis */
    public function supprimer(Avis $avis): RedirectResponse
    {
        $artisanId = $avis->id_artisan;
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
