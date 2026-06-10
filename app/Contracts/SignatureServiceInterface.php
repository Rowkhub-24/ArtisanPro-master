<?php

namespace App\Contracts;

use App\Models\Contrat;
use App\Models\User;

/**
 * Interface SignatureServiceInterface
 *
 * Responsable de la gestion des signatures électroniques HMAC-SHA256
 * et des transitions d'état associées du contrat.
 */
interface SignatureServiceInterface
{
    /**
     * Enregistre la signature électronique d'une partie sur le contrat.
     *
     * - Valide que $user correspond à la partie attendue selon $role
     *   (id_client pour 'client', id_artisan pour 'artisan').
     * - Idempotent : retourne le contrat inchangé si la signature est déjà présente pour ce rôle.
     * - Rejette si statut = 'annule' (lève une exception métier ContratAnnuleException).
     * - Calcule le hash HMAC-SHA256 :
     *   hash_hmac('sha256', "{id_contrat}|{role}|{timestamp}", config('app.key')).
     * - Enregistre signature_{role}_at et signature_{role}_hash.
     * - Met à jour le statut à 'partiellement_signe' si une seule signature est présente.
     * - Dispatche ContratFinaliseJob exactement une fois si les deux signatures sont présentes.
     *
     * @param  Contrat  $contrat  Le contrat à signer.
     * @param  User     $user     L'utilisateur qui signe.
     * @param  string   $role     Le rôle de la partie signataire : 'client' ou 'artisan'.
     * @return Contrat            Le contrat mis à jour (ou inchangé en cas d'idempotence).
     *
     * @throws \App\Exceptions\ContratAnnuleException  Si le contrat a le statut 'annule'.
     */
    public function signer(Contrat $contrat, User $user, string $role): Contrat;

    /**
     * Vérifie l'intégrité d'une signature enregistrée sur le contrat.
     *
     * Recalcule le hash HMAC-SHA256 à partir des données stockées et le compare
     * avec la valeur persistée en base.
     *
     * @param  Contrat  $contrat  Le contrat dont la signature est à vérifier.
     * @param  string   $role     Le rôle de la partie dont on vérifie la signature : 'client' ou 'artisan'.
     * @return bool               true si le hash recalculé correspond au hash stocké, false sinon.
     */
    public function verifier(Contrat $contrat, string $role): bool;
}
