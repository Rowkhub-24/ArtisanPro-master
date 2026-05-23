<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Reservation;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ClientReservationStoreController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user || ! $user->isClient() || ! $user->client) {
            abort(403);
        }

        $data = $request->validate([
            'id_artisan' => ['required', 'exists:artisans,id'],
            'date' => ['required', 'date_format:Y-m-d'],
            'creneau' => ['nullable', 'string', 'max:255'],
            'heure_specifique' => ['nullable', 'required_if:creneau,heure_specifique', 'date_format:H:i'],
            'description_besoin' => ['nullable', 'string', 'max:2000'],
        ]);

        $creneau = $data['creneau'] ?? null;
        if ($creneau === 'heure_specifique' && ! empty($data['heure_specifique'])) {
            $creneau = $data['heure_specifique'];
        }

        $dateDebut = Carbon::createFromFormat('Y-m-d', $data['date']);
        if ($dateDebut === false) {
            abort(422, 'Date de réservation invalide.');
        }
        if ($data['creneau'] === 'matin') {
            $dateDebut->setTime(8, 0, 0);
        } elseif ($data['creneau'] === 'apres_midi') {
            $dateDebut->setTime(12, 0, 0);
        } elseif ($data['creneau'] === 'soir') {
            $dateDebut->setTime(16, 0, 0);
        } elseif ($data['creneau'] === 'heure_specifique' && ! empty($data['heure_specifique'])) {
            $dateDebut->setTimeFromTimeString($data['heure_specifique']);
        } else {
            $dateDebut->setTime(0, 0, 0);
        }

        $artisan = Artisan::find($data['id_artisan']);
        $montantTotal = $artisan?->tarifs_horaire ?? null;

        Reservation::query()->create([
            'id_client' => $user->client->id,
            'id_artisan' => $data['id_artisan'],
            'date_debut' => $dateDebut,
            'date' => $data['date'],
            'creneau' => $creneau,
            'description_besoin' => $data['description_besoin'] ?? null,
            'montant_total' => $montantTotal,
            'date_creation' => now(),
            'statut' => 'en_cours',
        ]);

        return back()->with('success', 'Votre réservation a été créée. L’artisan sera informé.');
    }
}
