<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ArtisanFicheController extends Controller
{
    public function __invoke(Artisan $artisan): Response
    {
        $artisan->load([
            'user:id,nom,prenom,email,telephone,adresse',
            'categories',
            'prestations.category',
            'portfolioImages',
            'certifications',
            'avis' => fn ($q) => $q->with('client.user')->latest('date_avis')->limit(10),
        ]);

        $favorited = false;
        if (Auth::check() && Auth::user()->client) {
            $favorited = Auth::user()->client->favoris()->where('artisans.id', $artisan->id)->exists();
        }

        return Inertia::render('artisans/show', [
            'artisan' => array_merge($artisan->toArray(), ['favorited' => $favorited]),
        ]);
    }
}
