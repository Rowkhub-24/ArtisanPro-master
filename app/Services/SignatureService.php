<?php

namespace App\Services;

use App\Contracts\SignatureServiceInterface;
use App\Exceptions\ContratAnnuleException;
use App\Jobs\ContratFinaliseJob;
use App\Models\Contrat;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Service de gestion des signatures électroniques HMAC-SHA256.
 *
 * Responsabilités :
 *  - Enregistrer la signature d'une partie (client ou artisan) sur un contrat
 *  - Garantir l'idempotence : une double-signature sur le même rôle est silencieusement ignorée
 *  - Rejeter toute signature sur un contrat annulé
 *  - Mettre à jour le statut du contrat selon l'avancement des signatures
 *  - Dispatcher ContratFinaliseJob exactement une fois lorsque les deux signatures sont présentes
 *  - Vérifier l'intégrité d'une signature stockée
 */
class SignatureService implements SignatureServiceInterface
{
    /**
     * Enregistre la signature électronique d'une partie sur le contrat.
     *
     * @param  Contrat  $contrat  Le contrat à signer.
     * @param  User     $user     L'utilisateur qui signe.
     * @param  string   $role     'client' ou 'artisan'.
     * @return Contrat            Le contrat mis à jour (ou inchangé en cas d'idempotence).
     *
     * @throws ContratAnnuleException  Si le contrat a le statut 'annule'.
     */
    public function signer(Contrat $contrat, User $user, string $role): Contrat
    {
        // ── 1. Rejeter si le contrat est annulé ───────────────────────────────
        if ($contrat->statut === Contrat::STATUT_ANNULE) {
            throw new ContratAnnuleException($contrat->id);
        }

        // ── 2. Idempotence : retourner le contrat inchangé si déjà signé ──────
        $atColumn   = "signature_{$role}_at";
        $hashColumn = "signature_{$role}_hash";

        if ($contrat->{$atColumn} !== null) {
            Log::debug("SignatureService : signature déjà présente pour le rôle '{$role}'", [
                'contrat_id' => $contrat->id,
                'role'       => $role,
            ]);

            return $contrat;
        }

        // ── 3. Calculer le hash HMAC-SHA256 ───────────────────────────────────
        $timestamp = now()->toIso8601String();
        $payload   = "{$contrat->id}|{$role}|{$timestamp}";
        $hash      = hash_hmac('sha256', $payload, config('app.key'));

        // ── 4. Persister la signature ─────────────────────────────────────────
        $contrat->{$atColumn}   = now();
        $contrat->{$hashColumn} = $hash;

        // ── 5. Mettre à jour le statut selon l'avancement ────────────────────
        $autreRole     = ($role === 'client') ? 'artisan' : 'client';
        $autreAtColumn = "signature_{$autreRole}_at";

        $deuxSignaturesPresentes = $contrat->{$autreAtColumn} !== null;

        if ($deuxSignaturesPresentes) {
            // Les deux signatures sont présentes → finaliser
            $contrat->statut = Contrat::STATUT_FINALISE;
        } else {
            // Une seule signature → partiellement signé
            $contrat->statut = Contrat::STATUT_PARTIELLEMENT_SIGNE;
        }

        $contrat->save();

        Log::info("SignatureService : signature '{$role}' enregistrée sur le contrat #{$contrat->id}", [
            'contrat_id' => $contrat->id,
            'role'       => $role,
            'statut'     => $contrat->statut,
        ]);

        // ── 6. Dispatcher ContratFinaliseJob exactement une fois ──────────────
        if ($deuxSignaturesPresentes) {
            ContratFinaliseJob::dispatch($contrat);

            Log::info("SignatureService : ContratFinaliseJob dispatché pour le contrat #{$contrat->id}");
        }

        return $contrat;
    }

    /**
     * Vérifie l'intégrité d'une signature enregistrée sur le contrat.
     *
     * Recalcule le hash HMAC-SHA256 à partir des données stockées et le compare
     * avec la valeur persistée en base via hash_equals() (comparaison sûre).
     *
     * @param  Contrat  $contrat  Le contrat dont la signature est à vérifier.
     * @param  string   $role     'client' ou 'artisan'.
     * @return bool               true si le hash recalculé correspond au hash stocké.
     */
    public function verifier(Contrat $contrat, string $role): bool
    {
        $atColumn   = "signature_{$role}_at";
        $hashColumn = "signature_{$role}_hash";

        /** @var \Illuminate\Support\Carbon|null $signedAt */
        $signedAt   = $contrat->{$atColumn};
        $storedHash = $contrat->{$hashColumn};

        // Aucune signature enregistrée → non vérifiable
        if ($signedAt === null || $storedHash === null) {
            return false;
        }

        $timestamp = $signedAt->toIso8601String();
        $payload   = "{$contrat->id}|{$role}|{$timestamp}";
        $expected  = hash_hmac('sha256', $payload, config('app.key'));

        return hash_equals($expected, $storedHash);
    }
}
