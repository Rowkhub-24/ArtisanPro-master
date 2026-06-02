<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Reservation;
use App\Models\Paiement;
use App\Models\Litige;
use App\Models\Avis;
use App\Models\User;
use Illuminate\Support\Facades\Log;

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
        // Notifier l'artisan in-app
        if ($litige->artisan?->user) {
            Notification::notifier(
                $litige->artisan->user->id,
                "Un litige #{$litige->id} a été ouvert contre vous par un client.",
                'litige'
            );

            // SMS à l'artisan
            try {
                $sms = new \App\Services\SmsNotificationService();
                $sms->sendLitigeOuvertSms(
                    $litige->artisan->user->telephone ?? '',
                    $litige->id
                );
            } catch (\Throwable) {}
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

        // Recalculer le score de confiance de l'artisan automatiquement
        if ($avis->artisan) {
            try {
                $scoring = new \App\Services\ScoringService();
                $score   = $scoring->calculer($avis->artisan);
                $badge   = $scoring->badgeDepuisScore($score);

                $noteMoyenne = \App\Models\Avis::where('id_artisan', $avis->id_artisan)
                    ->where('masque', false)
                    ->avg('note') ?? 0;

                $avis->artisan->update([
                    'score_confiance' => $score,
                    'note_moyenne'    => round($noteMoyenne, 2),
                    'badge'           => $badge,
                ]);
            } catch (\Throwable) {}
        }
    }

    // ── Push et SMS (P2) ──────────────────────────────────────────────────────

    /**
     * Envoyer une notification push à un utilisateur.
     * Skip si push_permission_status === 'denied' OU push_notifications_enabled === false.
     */
    public function envoyerPush(User $user, string $title, string $body, array $data = []): void
    {
        // Vérifier les préférences et permissions push (Q5, Q14)
        if ($user->push_permission_status === 'denied' || $user->push_notifications_enabled === false) {
            \Illuminate\Support\Facades\Log::debug('Push notification skipped: permission denied or disabled', [
                'user_id' => $user->id,
                'push_permission_status' => $user->push_permission_status,
                'push_notifications_enabled' => $user->push_notifications_enabled,
            ]);
            return;
        }

        // TODO: Implémenter l'envoi push réel via Laravel broadcasting ou service externe
        // Pour le moment, on logue l'intention d'envoi
        \Illuminate\Support\Facades\Log::debug('Push notification ready to send', [
            'user_id' => $user->id,
            'title' => $title,
            'body' => $body,
            'data' => $data,
        ]);
    }

    /**
     * Envoyer une notification SMS à un utilisateur.
     * Block si sms_notifications_enabled !== true (null = block, false = block).
     */
    public function envoyerSms(User $user, string $message): void
    {
        // Bloquer si SMS désactivé ou indéterminé (Q15 — bloquer par défaut)
        if ($user->sms_notifications_enabled !== true) {
            \Illuminate\Support\Facades\Log::debug('SMS notification blocked: disabled or unset', [
                'user_id' => $user->id,
                'sms_notifications_enabled' => $user->sms_notifications_enabled,
            ]);
            return;
        }

        // Déléguer à SmsNotificationService
        try {
            $smsService = new \App\Services\SmsNotificationService();
            // Utiliser une méthode générique d'envoi (on va créer envoyer() dans SmsNotificationService)
            $smsService->envoyer($user->telephone ?? '', $message);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('SMS notification failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Notifier via tous les canaux (in-app, push, SMS).
     * Les notifications in-app sont TOUJOURS créées.
     */
    public function notifierAvecCanaux(User $user, string $type, string $message, array $pushData = []): void
    {
        // 1. Créer la notification in-app (toujours créée)
        Notification::notifier($user->id, $message, $type);

        // 2. Envoyer push si autorisé
        $this->envoyerPush($user, 'ArtisanPro', $message, $pushData);

        // 3. Envoyer SMS si autorisé
        $this->envoyerSms($user, $message);
    }
}
