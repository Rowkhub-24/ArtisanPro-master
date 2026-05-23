<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Category;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function __invoke(): Response
    {
        $categories = Category::query()
            ->orderBy('nom')
            ->limit(12)
            ->get(['id', 'nom', 'icone', 'description', 'nombre_artisans']);

        $artisans = Artisan::query()
            ->with(['user:id,nom,prenom', 'categories:id,nom'])
            ->whereHas('user', fn ($q) => $q->where('statut', 'actif'))
            ->orderByDesc('note_moyenne')
            ->limit(8)
            ->get()
            ->map(fn (Artisan $a) => [
                'id' => $a->id,
                'metier' => $a->metier,
                'note_moyenne' => $a->note_moyenne,
                'badge' => $a->badge,
                'tarifs_horaire' => $a->tarifs_horaire,
                'zone_intervention' => $a->zone_intervention,
                'prenom' => $a->user?->prenom,
                'nom' => $a->user?->nom,
                'categories' => $a->categories->pluck('nom')->all(),
            ]);

        return Inertia::render('portal/accueil', [
            'categories' => $categories,
            'artisansMisEnAvant' => $artisans,
        ]);
    }
}
