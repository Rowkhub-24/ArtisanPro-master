<?php

namespace App\Http\Controllers\Portal;

use App\Events\DevisRepondu;
use App\Http\Controllers\Controller;
use App\Models\Devis;
use App\Models\DevisMateriel;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ArtisanDevisRepondreController extends Controller
{
    /**
     * Traite la réponse d'un artisan à un devis (montant, notes, liste de matériels).
     *
     * PATCH /artisan/devis/{devis}/repondre
     */
    public function repondre(Request $request, Devis $devis): RedirectResponse
    {
        $artisan = Auth::user()?->artisan;

        // Contrôle d'accès : l'artisan doit être le propriétaire du devis
        if (! $artisan || $devis->id_artisan !== $artisan->id) {
            Log::warning('ArtisanDevisRepondre: accès refusé', [
                'auth_user_id'    => Auth::id(),
                'artisan_id'      => $artisan?->id,
                'devis_id_artisan'=> $devis->id_artisan,
            ]);
            abort(403, 'Vous n\'êtes pas autorisé à répondre à ce devis.');
        }

        // Contrôle de statut : le devis doit être en attente ou accepté
        if (! in_array($devis->statut, ['en_attente', 'accepte'], true)) {
            abort(422, 'Ce devis a déjà été traité.');
        }

        // Validation des données soumises
        $validated = $request->validate([
            'montant_propose'           => ['required', 'numeric', 'min:0', 'max:99999999'],
            'notes_artisan'             => ['nullable', 'string', 'max:2000'],
            'materiels'                 => ['nullable', 'array', 'max:50'],
            'materiels.*.nom'           => ['required', 'string', 'max:255'],
            'materiels.*.quantite'      => ['required', 'numeric', 'gt:0', 'max:9999999'],
            'materiels.*.unite'         => ['required', 'string', 'max:50'],
            'materiels.*.prix_unitaire' => ['required', 'numeric', 'min:0', 'max:99999999'],
        ], [
            'materiels.max' => 'La liste de matériels ne peut pas dépasser 50 lignes.',
        ]);

        $lignes = $validated['materiels'] ?? [];

        // Calcul du sous-total des matériels
        $sousTotalMateriels = array_reduce($lignes, function (float $carry, array $ligne): float {
            return $carry + ((float) $ligne['quantite'] * (float) $ligne['prix_unitaire']);
        }, 0.0);

        // Mise à jour du devis
        $devis->update([
            'montant_propose'      => $validated['montant_propose'],
            'notes_artisan'        => $validated['notes_artisan'] ?? null,
            'sous_total_materiels' => round($sousTotalMateriels, 2),
            'date_reponse'         => now(),
            'statut'               => 'accepte',
        ]);

        // Remplacement complet des matériels (DELETE + INSERT)
        DevisMateriel::where('id_devis', $devis->id)->delete();

        foreach ($lignes as $index => $ligne) {
            DevisMateriel::create([
                'id_devis'      => $devis->id,
                'nom'           => $ligne['nom'],
                'quantite'      => $ligne['quantite'],
                'unite'         => $ligne['unite'],
                'prix_unitaire' => $ligne['prix_unitaire'],
                'ordre'         => $index,
            ]);
        }

        // Notification SMS au client (non bloquant, mise en queue)
        try {
            DevisRepondu::dispatch($devis->fresh(['client.user', 'artisan.user']));
        } catch (\Throwable $e) {
            Log::warning('DevisRepondu dispatch failed: ' . $e->getMessage());
        }

        return redirect()->route('artisan.devis')->with('success', 'Votre réponse au devis a été enregistrée avec succès.');
    }
}
