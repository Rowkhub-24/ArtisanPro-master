<?php

namespace App\Http\Controllers\Portal;

use App\Contracts\SignatureServiceInterface;
use App\Exceptions\ContratAnnuleException;
use App\Http\Controllers\Controller;
use App\Models\Contrat;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ContratController extends Controller
{
    /**
     * Affiche la page de visualisation du contrat (portail Inertia).
     *
     * Autorise uniquement le client ou l'artisan du contrat.
     * Calcule `peut_signer` et `role` pour le composant React ContratViewer.
     */
    public function show(Contrat $contrat): Response
    {
        $user = auth()->user();

        // Authorization: seuls le client et l'artisan du contrat peuvent consulter
        $contrat->loadMissing(['client.user', 'artisan.user', 'reservation']);

        $isClient  = $contrat->client  && $contrat->client->id_utilisateur === $user->id;
        $isArtisan = $contrat->artisan && $contrat->artisan->id_utilisateur === $user->id;

        if (! $isClient && ! $isArtisan) {
            abort(403);
        }

        // Déterminer le rôle de l'utilisateur courant
        $role = $isClient ? 'client' : 'artisan';

        // Peut signer : est une partie ET n'a pas encore signé ET contrat pas annulé/finalisé
        $peutSigner = $contrat->peutSigner($user, $role);

        return Inertia::render('portal/contrat-viewer', [
            'contrat' => [
                'id'                    => $contrat->id,
                'numero_contrat'        => $contrat->numero_contrat,
                'statut'                => $contrat->statut,
                'nom_client'            => $contrat->nom_client,
                'nom_artisan'           => $contrat->nom_artisan,
                'description_prestation' => $contrat->description_prestation,
                'montant_total'         => $contrat->montant_total,
                'date_debut_prestation' => $contrat->date_debut_prestation?->format('Y-m-d H:i'),
                'date_fin_prestation'   => $contrat->date_fin_prestation?->format('Y-m-d H:i'),
                'adresse_intervention'  => $contrat->adresse_intervention,
                'signature_client_at'   => $contrat->signature_client_at?->toISOString(),
                'signature_artisan_at'  => $contrat->signature_artisan_at?->toISOString(),
                'clauses_litige'        => $contrat->clauses_litige ?? [],
                'chemin_pdf_brouillon'  => $contrat->chemin_pdf_brouillon,
                'chemin_pdf_final'      => $contrat->chemin_pdf_final,
                'client' => $contrat->client ? [
                    'id'   => $contrat->client->id,
                    'user' => $contrat->client->user ? [
                        'id'     => $contrat->client->user->id,
                        'nom'    => $contrat->client->user->nom,
                        'prenom' => $contrat->client->user->prenom,
                        'email'  => $contrat->client->user->email,
                    ] : null,
                ] : null,
                'artisan' => $contrat->artisan ? [
                    'id'   => $contrat->artisan->id,
                    'user' => $contrat->artisan->user ? [
                        'id'     => $contrat->artisan->user->id,
                        'nom'    => $contrat->artisan->user->nom,
                        'prenom' => $contrat->artisan->user->prenom,
                        'email'  => $contrat->artisan->user->email,
                    ] : null,
                ] : null,
            ],
            'peut_signer'     => $peutSigner,
            'role_utilisateur' => $role,
        ]);
    }

    /**
     * Enregistre la signature électronique de l'utilisateur authentifié.
     *
     * Autorisé via ContratPolicy::signer().
     * Détermine le rôle ('client' ou 'artisan') à partir de l'utilisateur.
     * Redirige avec un flash 'success' ou 'error' selon le résultat.
     */
    public function signer(Request $request, Contrat $contrat): RedirectResponse
    {
        $user = auth()->user();

        // Authorization via ContratPolicy
        if (! $user->can('signer', $contrat)) {
            abort(403);
        }

        // Déterminer le rôle de l'utilisateur
        $contrat->loadMissing(['client', 'artisan']);

        $isClient = $contrat->client && $contrat->client->id_utilisateur === $user->id;
        $role     = $isClient ? 'client' : 'artisan';

        try {
            /** @var SignatureServiceInterface $signatureService */
            $signatureService = app(SignatureServiceInterface::class);
            $signatureService->signer($contrat, $user, $role);

            return redirect()->back()->with('success', 'Votre signature a été enregistrée avec succès.');
        } catch (ContratAnnuleException $e) {
            return redirect()->back()->with('error', 'Ce contrat a été annulé et ne peut plus être signé.');
        }
    }

    /**
     * Stream le PDF du contrat (final si disponible, sinon brouillon).
     *
     * Autorisé via ContratPolicy::telecharger().
     * Ne retourne jamais le chemin physique — le fichier est streamé depuis storage.
     *
     * @return StreamedResponse|RedirectResponse
     */
    public function telecharger(Contrat $contrat): StreamedResponse|RedirectResponse
    {
        $user = auth()->user();

        // Authorization via ContratPolicy
        if (! $user->can('telecharger', $contrat)) {
            abort(403);
        }

        // Préférer le PDF final, sinon le brouillon
        if ($contrat->chemin_pdf_final && Storage::exists($contrat->chemin_pdf_final)) {
            return Storage::download(
                $contrat->chemin_pdf_final,
                "contrat-{$contrat->numero_contrat}-final.pdf"
            );
        }

        if ($contrat->chemin_pdf_brouillon && Storage::exists($contrat->chemin_pdf_brouillon)) {
            return Storage::download(
                $contrat->chemin_pdf_brouillon,
                "contrat-{$contrat->numero_contrat}-brouillon.pdf"
            );
        }

        abort(404, 'Aucun fichier PDF disponible pour ce contrat.');
    }
}
