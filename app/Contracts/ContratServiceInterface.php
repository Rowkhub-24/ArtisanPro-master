<?php

namespace App\Contracts;

use App\Models\Contrat;
use App\Models\Reservation;

/**
 * Interface ContratServiceInterface
 *
 * Orchestrateur principal du cycle de vie des contrats de prestation.
 * Responsable de la création, de la récupération et de la coordination
 * avec les autres services (PDF, notifications).
 */
interface ContratServiceInterface
{
    /**
     * Crée un contrat à partir d'une réservation confirmée.
     *
     * Idempotent : si un contrat existe déjà pour cette réservation,
     * retourne le contrat existant sans créer de doublon.
     *
     * - Copie en snapshot les données de la réservation (nom client/artisan,
     *   description, montant, dates, adresse).
     * - Génère un numéro de contrat unique au format CP-AAAA-NNNNN.
     * - Initialise les clauses de litige prédéfinies de la plateforme.
     * - Persiste avec statut = 'genere' et genere_at = now().
     * - Délègue la génération du brouillon PDF à PdfGeneratorServiceInterface.
     * - Crée les notifications in-app pour le client et l'artisan.
     *
     * @param  Reservation  $reservation  La réservation confirmée source du contrat.
     * @return Contrat                    Le contrat créé ou existant.
     */
    public function creerDepuisReservation(Reservation $reservation): Contrat;

    /**
     * Récupère le contrat associé à une réservation donnée.
     *
     * @param  int       $reservationId  L'identifiant de la réservation.
     * @return Contrat|null              Le contrat trouvé, ou null si inexistant.
     */
    public function getContratPourReservation(int $reservationId): ?Contrat;
}
