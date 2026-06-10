<?php

namespace App\Policies;

use App\Models\Contrat;
use App\Models\User;

class ContratPolicy
{
    /**
     * Détermine si l'utilisateur peut consulter le contrat.
     * Accès autorisé : client ou artisan du contrat, ou administrateur.
     */
    public function view(User $user, Contrat $contrat): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        // Le client associé au contrat
        if ($contrat->client && $contrat->client->id_utilisateur === $user->id) {
            return true;
        }

        // L'artisan associé au contrat
        if ($contrat->artisan && $contrat->artisan->id_utilisateur === $user->id) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut signer le contrat.
     * Accès autorisé : client ou artisan qui n'a pas encore signé,
     * et le contrat n'est pas annulé ni finalisé.
     */
    public function signer(User $user, Contrat $contrat): bool
    {
        // Un contrat annulé ou finalisé ne peut plus être signé
        if ($contrat->estAnnule() || $contrat->estFinalise()) {
            return false;
        }

        // Le client peut signer s'il est la partie client et n'a pas encore signé
        if ($contrat->client && $contrat->client->id_utilisateur === $user->id) {
            return $contrat->signature_client_at === null;
        }

        // L'artisan peut signer s'il est la partie artisan et n'a pas encore signé
        if ($contrat->artisan && $contrat->artisan->id_utilisateur === $user->id) {
            return $contrat->signature_artisan_at === null;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut télécharger le PDF du contrat.
     * Mêmes règles que view : client, artisan ou administrateur.
     */
    public function telecharger(User $user, Contrat $contrat): bool
    {
        return $this->view($user, $contrat);
    }

    /**
     * Détermine si l'utilisateur peut annuler le contrat.
     * Accès autorisé : administrateur, ou si le statut est 'genere'.
     */
    public function annuler(User $user, Contrat $contrat): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $contrat->statut === Contrat::STATUT_GENERE;
    }
}
