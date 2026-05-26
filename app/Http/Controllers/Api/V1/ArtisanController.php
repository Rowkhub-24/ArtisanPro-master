<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Concerns\RespondsWithJson;
use App\Http\Controllers\Controller;
use App\Models\Artisan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ArtisanController extends Controller
{
    use RespondsWithJson;

    public function index(Request $request): JsonResponse
    {
        $query = Artisan::query()
            ->with(['user:id,nom,prenom,email,telephone,avatar', 'categories:id,nom'])
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

        if ($request->filled('min_note')) {
            $query->where('note_moyenne', '>=', (float) $request->input('min_note'));
        }

        if ($request->filled('badge')) {
            $query->where('badge', $request->string('badge'));
        }

        $sort = $request->string('sort', 'note')->toString();
        match ($sort) {
            'tarif' => $query->orderBy('tarifs_horaire'),
            default => $query->orderByDesc('note_moyenne'),
        };

        $limit = min($request->integer('limit', 20), 50);
        $artisans = $query->paginate($limit);

        $data = $artisans->getCollection()->map(fn (Artisan $a) => $this->artisanSummary($a));

        return $this->jsonSuccess($data, null, [
            'current_page' => $artisans->currentPage(),
            'last_page' => $artisans->lastPage(),
            'per_page' => $artisans->perPage(),
            'total' => $artisans->total(),
        ]);
    }

    public function show(Artisan $artisan): JsonResponse
    {
        $artisan->load([
            'user:id,nom,prenom,email,telephone,adresse,avatar',
            'categories',
            'prestations.category',
            'portfolioImages',
            'certifications',
        ]);

        return $this->jsonSuccess($this->artisanDetail($artisan));
    }

    /**
     * @return array<string, mixed>
     */
    private function artisanSummary(Artisan $a): array
    {
        return [
            'id' => $a->id,
            'metier' => $a->metier,
            'description' => $a->description,
            'zone_intervention' => $a->zone_intervention,
            'tarifs_horaire' => $a->tarifs_horaire,
            'note_moyenne' => $a->note_moyenne,
            'badge' => $a->badge,
            'latitude' => $a->latitude,
            'longitude' => $a->longitude,
            'user' => $a->user ? [
                'prenom' => $a->user->prenom,
                'nom' => $a->user->nom,
            ] : null,
            'categories' => $a->categories->pluck('nom'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function artisanDetail(Artisan $a): array
    {
        return $this->artisanSummary($a) + [
            'bio' => $a->bio,
            'prestations' => $a->prestations,
            'portfolio_images' => $a->portfolioImages,
            'certifications' => $a->certifications,
        ];
    }
}
