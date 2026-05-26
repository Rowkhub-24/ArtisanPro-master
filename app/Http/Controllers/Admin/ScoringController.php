<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Services\ScoringService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ScoringController extends Controller
{
    public function __construct(private ScoringService $scoring) {}

    public function index(): Response
    {
        $artisans = Artisan::with(['user:id,nom,prenom,avatar'])
            ->whereHas('user', fn ($q) => $q->where('statut', 'actif'))
            ->orderByDesc('note_moyenne')
            ->get()
            ->map(fn (Artisan $a) => [
                'id'          => $a->id,
                'metier'      => $a->metier,
                'prenom'      => $a->user?->prenom,
                'nom'         => $a->user?->nom,
                'avatar_url'  => $a->user?->avatar_url,
                'note_moyenne'=> $a->note_moyenne,
                'badge'       => $a->badge,
                'score'       => $this->scoring->calculer($a),
            ]);

        return Inertia::render('admin/scoring/index', [
            'artisans' => $artisans,
        ]);
    }

    /** Recalcule le score de tous les artisans */
    public function recalculerTous(): RedirectResponse
    {
        $this->scoring->recalculerTous();

        return back()->with('success', 'Scores recalculés pour tous les artisans actifs.');
    }

    /** Recalcule le score d'un artisan spécifique */
    public function recalculer(Artisan $artisan): RedirectResponse
    {
        $score = $this->scoring->calculer($artisan);
        $badge = $this->scoring->badgeDepuisScore($score);

        $artisan->update(['badge' => $badge]);

        return back()->with('success', "Score recalculé : {$score}/100 → Badge : {$badge}");
    }
}
