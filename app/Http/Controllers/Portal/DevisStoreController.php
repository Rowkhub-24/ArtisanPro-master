<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Devis;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DevisStoreController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user || ! $user->isClient() || ! $user->client) {
            abort(403);
        }

        $data = $request->validate([
            'id_artisan' => ['required', 'exists:artisans,id'],
            'description_travaux' => ['required', 'string', 'max:5000'],
        ]);

        Devis::query()->create([
            'id_client' => $user->client->id,
            'id_artisan' => $data['id_artisan'],
            'description_travaux' => $data['description_travaux'],
            'photos' => null,
            'date_demande' => now(),
            'statut' => 'en_attente',
        ]);

        return back()->with('success', 'Votre demande de devis a été envoyée.');
    }
}
