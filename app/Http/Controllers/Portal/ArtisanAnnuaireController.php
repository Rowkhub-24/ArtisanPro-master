<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArtisanAnnuaireController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $query = Artisan::query()
            ->with(['user:id,nom,prenom,telephone,avatar', 'categories:id,nom'])
            ->whereHas('user', fn ($q) => $q->where('statut', 'actif'));

        if ($request->filled('category_id')) {
            $query->whereHas('categories', fn ($q) => $q->where('categories.id', $request->integer('category_id')));
        }

        if ($request->filled('q')) {
            $term = '%'.$request->string('q').'%';
            $query->where(function ($q) use ($term) {
                $q->where('metier', 'like', $term)
                    ->orWhere('description', 'like', $term)
                    ->orWhere('zone_intervention', 'like', $term);
            });
        }

        $artisans = $query->orderByDesc('note_moyenne')->paginate(12)->withQueryString();

        return Inertia::render('artisans/index', [
            'artisans'   => $artisans,
            'categories' => Category::query()->orderBy('nom')->get(['id', 'nom']),
            'filters'    => [
                'q'           => $request->string('q')->toString(),
                'category_id' => $request->input('category_id'),
            ],
            // Limites géographiques de Porto-Novo — 5 arrondissements officiels
            'mapArtisans' => Artisan::query()
                ->with(['user:id,nom,prenom,avatar'])
                ->whereHas('user', fn ($q) => $q->where('statut', 'actif'))
                ->whereNotNull('latitude')
                ->whereNotNull('longitude')
                // Filtrer uniquement les artisans dans les 5 arrondissements de Porto-Novo
                ->whereBetween('latitude',  [6.47, 6.52])
                ->whereBetween('longitude', [2.60, 2.68])
                ->get()
                ->map(fn (Artisan $a) => [
                    'id'               => $a->id,
                    'metier'           => $a->metier,
                    'prenom'           => $a->user?->prenom,
                    'nom'              => $a->user?->nom,
                    'note_moyenne'     => $a->note_moyenne,
                    'badge'            => $a->badge,
                    'tarifs_horaire'   => $a->tarifs_horaire,
                    'zone_intervention'=> $a->zone_intervention,
                    'lat'              => (float) $a->latitude,
                    'lng'              => (float) $a->longitude,
                ]),
        ]);
    }
}
