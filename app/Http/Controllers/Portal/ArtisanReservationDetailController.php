<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Contrat;
use App\Models\Reservation;
use Inertia\Inertia;

class ArtisanReservationDetailController extends Controller
{
    public function __invoke(Reservation $reservation)
    {
        if ($reservation->id_artisan !== auth()->user()->artisan?->id) {
            abort(403);
        }

        $reservation->load(['client.user', 'artisan.user', 'devis']);

        $contrat = Contrat::where('id_reservation', $reservation->id)->first();
        $user    = auth()->user();

        return Inertia::render('artisan/reservation-detail', [
            'contrat' => $contrat ? [
                'id'            => $contrat->id,
                'numero_contrat'=> $contrat->numero_contrat,
                'statut'        => $contrat->statut,
                'peut_signer'   => $contrat->peutSigner($user, 'artisan'),
            ] : null,
            'reservation' => [
                'id' => $reservation->id,
                'statut' => $reservation->statut,
                'date' => optional($reservation->date)->format('d/m/Y'),
                'creneau' => $reservation->creneau,
                'montant_total' => $reservation->montant_total,
                'description_besoin' => $reservation->description_besoin,
                'adresse_intervention' => $reservation->adresse_intervention,
                'client' => $reservation->client ? [
                    'prenom' => $reservation->client->user?->prenom,
                    'nom' => $reservation->client->user?->nom,
                    'telephone' => $reservation->client->user?->telephone,
                    'email' => $reservation->client->user?->email,
                ] : null,
                'artisan' => $reservation->artisan ? [
                    'metier' => $reservation->artisan->metier,
                    'user' => [
                        'prenom' => $reservation->artisan->user?->prenom,
                        'nom' => $reservation->artisan->user?->nom,
                        'telephone' => $reservation->artisan->user?->telephone,
                        'email' => $reservation->artisan->user?->email,
                    ],
                ] : null,
                'devis' => $reservation->devis ? [
                    'id' => $reservation->devis->id,
                    'description_travaux' => $reservation->devis->description_travaux,
                    'statut' => $reservation->devis->statut,
                ] : null,
            ],
        ]);
    }
}
