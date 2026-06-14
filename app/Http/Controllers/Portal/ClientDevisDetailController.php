<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Devis;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClientDevisDetailController extends Controller
{
    /**
     * Affiche le détail d'un devis pour le client authentifié.
     *
     * GET /client/devis/{devis}
     */
    public function __invoke(Request $request, Devis $devis): Response
    {
        $user = $request->user();

        // Vérifier que le devis appartient au client authentifié
        if (! $user || ! $user->client || $devis->id_client !== $user->client->id) {
            abort(403);
        }

        $devis->load(['artisan.user', 'materiels']);

        return Inertia::render('client/devis-detail', [
            'devis' => [
                'id'                  => $devis->id,
                'description_travaux' => $devis->description_travaux,
                'statut'              => $devis->statut,
                'date_demande'        => optional($devis->date_demande)->toDateTimeString(),
                'date_reponse'        => optional($devis->date_reponse)->toDateTimeString(),
                'montant_propose'     => $devis->montant_propose,
                'notes_artisan'       => $devis->notes_artisan,
                'sous_total_materiels'=> $devis->sous_total_materiels,
                'materiels'           => $devis->materiels->map(fn ($m) => [
                    'id'            => $m->id,
                    'nom'           => $m->nom,
                    'quantite'      => (float) $m->quantite,
                    'unite'         => $m->unite,
                    'prix_unitaire' => (float) $m->prix_unitaire,
                    'ordre'         => $m->ordre,
                    'sous_total'    => $m->sous_total,
                ])->values()->toArray(),
                'artisan' => $devis->artisan ? [
                    'id'     => $devis->artisan->id,
                    'metier' => $devis->artisan->metier,
                    'user'   => $devis->artisan->user ? [
                        'prenom'    => $devis->artisan->user->prenom,
                        'nom'       => $devis->artisan->user->nom,
                        'telephone' => $devis->artisan->user->telephone,
                    ] : null,
                ] : null,
            ],
        ]);
    }
}
