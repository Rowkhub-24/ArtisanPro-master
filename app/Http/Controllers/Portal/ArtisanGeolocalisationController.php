<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\HistoriqueGeolocalisation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArtisanGeolocalisationController extends Controller
{
    /** Page historique géolocalisation */
    public function index(): Response
    {
        $artisan = auth()->user()->artisan;

        if (! $artisan) {
            abort(403);
        }

        $historique = HistoriqueGeolocalisation::where('id_artisan', $artisan->id)
            ->orderByDesc('date_position')
            ->limit(100)
            ->get()
            ->map(fn ($h) => [
                'id'            => $h->id,
                'latitude'      => (float) $h->latitude,
                'longitude'     => (float) $h->longitude,
                'date_position' => $h->date_position?->format('d/m/Y H:i'),
            ]);

        return Inertia::render('artisan/geolocalisation', [
            'historique'       => $historique,
            'position_actuelle' => [
                'latitude'  => $artisan->latitude  ? (float) $artisan->latitude  : null,
                'longitude' => $artisan->longitude ? (float) $artisan->longitude : null,
            ],
        ]);
    }

    /** Enregistrer une nouvelle position (appelé depuis le frontend) */
    public function enregistrer(Request $request): JsonResponse
    {
        $artisan = auth()->user()->artisan;

        if (! $artisan) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'latitude'  => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ]);

        // Mettre à jour la position actuelle de l'artisan
        $artisan->update([
            'latitude'  => $validated['latitude'],
            'longitude' => $validated['longitude'],
        ]);

        // Enregistrer dans l'historique
        HistoriqueGeolocalisation::create([
            'id_artisan'    => $artisan->id,
            'latitude'      => $validated['latitude'],
            'longitude'     => $validated['longitude'],
            'date_position' => now(),
        ]);

        return response()->json(['ok' => true]);
    }

    /** Supprimer l'historique */
    public function effacer(): RedirectResponse
    {
        $artisan = auth()->user()->artisan;

        if (! $artisan) {
            abort(403);
        }

        HistoriqueGeolocalisation::where('id_artisan', $artisan->id)->delete();

        return back()->with('success', 'Historique de géolocalisation effacé.');
    }
}
