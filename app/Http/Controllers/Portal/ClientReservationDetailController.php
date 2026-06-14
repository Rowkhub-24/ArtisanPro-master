<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Contrat;
use App\Models\Reservation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientReservationDetailController extends Controller
{
    public function __invoke(Request $request, $reservation)
    {
        $user = $request->user();
        if (! $user || ! $user->isClient() || ! $user->client) {
            abort(403);
        }

        $res = Reservation::with([
            'artisan.user:id,nom,prenom,email,telephone',
            'artisan.categories:id,nom',
            'paiements',
            'avis',
        ])->where('id_client', $user->client->id)
          ->findOrFail($reservation);

        $contrat = Contrat::where('id_reservation', $res->id)->first();

        return Inertia::render('client/reservation-detail', [
            'contrat' => $contrat ? [
                'id'            => $contrat->id,
                'numero_contrat'=> $contrat->numero_contrat,
                'statut'        => $contrat->statut,
                'peut_signer'   => $contrat->peutSigner($user, 'client'),
            ] : null,
            'reservation' => [
                'id'               => $res->id,
                'statut'           => $res->statut,
                'date'             => $res->date?->format('Y-m-d'),
                'date_debut'       => $res->date_debut?->format('Y-m-d H:i'),
                'creneau'          => $res->creneau,
                'description_besoin' => $res->description_besoin,
                'montant_total'    => $res->montant_total,
                'acompte_verse'    => $res->acompte_verse,
                'artisan' => $res->artisan ? [
                    'id'     => $res->artisan->id,
                    'metier' => $res->artisan->metier,
                    'note_moyenne' => $res->artisan->note_moyenne,
                    'zone_intervention' => $res->artisan->zone_intervention,
                    'categories' => $res->artisan->categories->pluck('nom'),
                    'user' => $res->artisan->user ? [
                        'id'        => $res->artisan->user->id,
                        'nom'       => $res->artisan->user->nom,
                        'prenom'    => $res->artisan->user->prenom,
                        'email'     => $res->artisan->user->email,
                        'telephone' => $res->artisan->user->telephone,
                    ] : null,
                ] : null,
                'paiements' => $res->paiements->map(fn ($p) => [
                    'id'                   => $p->id,
                    'montant'              => $p->montant,
                    'statut'               => $p->statut,
                    'methode_paiement'     => $p->methode_paiement,
                    'date_paiement'        => $p->date_paiement,
                    'reference_transaction' => $p->reference_transaction,
                ]),
                'has_avis' => $res->avis !== null,
            ],
        ]);
    }
}
