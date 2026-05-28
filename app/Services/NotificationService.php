<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Paiement;
use App\Models\Litige;
use App\Models\Avis;

/**
 * Service centralisé pour alimenter la table notifications
 * lors des événements clés de la plateforme.
 */
class NotificationService
{
    // ── Réservations ─────────────────────────────────────────────────────────

    public function reservationCreee(Reservation $reservation): void
    {
        // Notifier l'artisan
        if ($reservation->artisan?->user) {
            Notification::notifier(
                $reservation->artisan->user->id,
                "Nouvelle réservation #{$reservation->id} reçue d'un client.",
                'reservation'
            );
        }
    }

    public function reservationConfirmee(Reservation $reservation): void
    {
        // Notifier le client
        if ($reservation->client?->user) {
            Notification::notifier(
                $reservation->client->user->id,
                "Votre réservation #{$reservation->id} a été confirmée par l'artisan.",
                'reservation'
            );
        }
    }

    public function reservationAnnulee(Reservation $reservation): void
    {
        // Notifier le client
        if ($reservation->client?->user) {
            Notification::notifier(
                $reservation->client->user->id,
                "Votre réservation #{$reservation->id} a été annulée.",
                'reservation'
            );
        }
        // Notifier l'artisan
        if ($reservation->artisan?->user) {
            Notification::notifier(
                $reservation->artisan->user->id,
                "La réservation #{$reservation->id} a été annulée par le client.",
                'reservation'
            );
        }
    }

    public function reservationTerminee(Reservation $reservation): void
    {
        // Inviter le client à laisser un avis
        if ($reservation->client?->user) {
            Notification::notifier(
                $reservation->client->user->id,
                "La réservation #{$reservation->id} est terminée. N'oubliez pas de laisser un avis !",
                'avis'
            );
        }
    }

    // ── Paiements ─────────────────────────────────────────────────────────────

    public function paiementRecu(Paiement $paiement): void
    {
        $reservation = $paiement->reservation;

        // Notifier le client
        if ($reservation?->client?->user) {
            Notification::notifier(
                $reservation->client->user->id,
                "Paiement de {$paiement->montant} FCFA confirmé pour la réservation #{$reservation->id}.",
                'paiement'
            );
        }

        // Notifier l'artisan
        if ($reservation?->artisan?->user) {
            Notification::notifier(
                $reservation->artisan->user->id,
                "Paiement de {$paiement->montant} FCFA reçu pour la réservation #{$reservation->id}.",
                'paiement'
            );
        }
    }

    // ── Litiges ───────────────────────────────────────────────────────────────

    public function litigeOuvert(Litige $litige): void
    {
        // Notifier l'artisan
        if ($litige->artisan?->user) {
            Notification::notifier(
                $litige->artisan->user->id,
                "Un litige #{$litige->id} a été ouvert contre vous par un client.",
                'litige'
            );
        }
    }

    // ── Avis ──────────────────────────────────────────────────────────────────

    public function avisDepose(Avis $avis): void
    {
        // Notifier l'artisan
        if ($avis->artisan?->user) {
            $note = $avis->note;
            Notification::notifier(
                $avis->artisan->user->id,
                "Vous avez reçu un nouvel avis ({$note}/5) d'un client.",
                'avis'
            );
        }
    }
}
