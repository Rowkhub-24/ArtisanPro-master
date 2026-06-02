<?php

namespace App\Http\Controllers\Portal;

use App\Events\ReservationCreee;
use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Reservation;
use App\Services\NotificationService;
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
            'id_artisan'         => ['required', 'exists:artisans,id'],
            'date'               => ['required', 'date_format:Y-m-d'],
            'creneau'            => ['nullable', 'string', 'max:255'],
            'heure_specifique'   => ['nullable', 'required_if:creneau,heure_specifique', 'date_format:H:i'],
            'description_besoin' => ['nullable', 'string', 'max:2000'],
        ]);

        $creneau = $data['creneau'] ?? null;
        if ($creneau === 'heure_specifique' && ! empty($data['heure_specifique'])) {
            $creneau = $data['heure_specifique'];
        }

        $dateDebut = Carbon::createFromFormat('Y-m-d', $data['date']);
        if ($dateDebut === false) {
            abort(422, 'Date de reservation invalide.');
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

        $artisan      = Artisan::find($data['id_artisan']);
        $montantTotal = $artisan?->tarifs_horaire ?? null;

        $reservation = Reservation::query()->create([
            'id_client'          => $user->client->id,
            'id_artisan'         => $data['id_artisan'],
            'date_debut'         => $dateDebut,
            'date'               => $data['date'],
            'creneau'            => $creneau,
            'description_besoin' => $data['description_besoin'] ?? null,
            'montant_total'      => $montantTotal,
            'date_creation'      => now(),
            'statut'             => 'en_cours',
        ]);

        // Notification in-app (service existant)
        try {
            (new NotificationService())->reservationCreee($reservation->load('artisan.user'));
        } catch (\Throwable) {}

        // Event SMS — notifie l'artisan de la nouvelle demande (queue)
        try {
            $reservation->load(['artisan.user', 'client.user']);
            ReservationCreee::dispatch($reservation);
        } catch (\Throwable) {}

        return back()->with('success', "Votre reservation a ete creee. L'artisan sera informe.");
    }
}
