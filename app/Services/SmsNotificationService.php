<?php

namespace App\Services;

use App\Jobs\SendSmsJob;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Service SMS centralisé pour ArtisanPro.
 *
 * Ce service est une façade légère : il vérifie les préférences SMS de
 * l'utilisateur (sms_notifications_enabled) puis délègue l'envoi effectif
 * à SendSmsJob, qui gère la normalisation E.164, le choix sandbox/production,
 * les retries et le logging dans sms_logs.
 *
 * Règle d'opt-in (Q15) : si sms_notifications_enabled !== true, l'envoi
 * est silencieusement bloqué.
 */
class SmsNotificationService
{
    // ─── Méthode générique ────────────────────────────────────────────────────

    /**
     * Envoi générique d'un SMS.
     * Si un User est fourni, vérifie sms_notifications_enabled avant envoi.
     *
     * @param  string    $telephone  Numéro de téléphone du destinataire
     * @param  string    $message    Contenu du SMS
     * @param  User|null $user       Utilisateur destinataire (optionnel)
     * @param  string    $type       Type de SMS pour le log (défaut : 'general')
     * @param  int|null  $contextId  Identifiant du contexte (réservation, litige…)
     */
    public function envoyer(
        string  $telephone,
        string  $message,
        ?User   $user      = null,
        string  $type      = 'general',
        ?int    $contextId = null,
    ): void {
        if (! $this->smsAutorise($user, $type)) {
            return;
        }

        $phone = self::normaliserTelephone($telephone);

        if ($phone === null) {
            Log::warning('SMS ignoré : numéro de téléphone invalide.', [
                'telephone_raw' => $telephone,
                'type'          => $type,
                'context_id'    => $contextId,
            ]);
            return;
        }

        SendSmsJob::dispatch($phone, $message, $type, $contextId)
            ->onQueue('sms');
    }

    // ─── Méthodes événementielles ─────────────────────────────────────────────

    /**
     * SMS de confirmation de réservation envoyé au client.
     */
    public function sendConfirmationSms(Reservation $reservation): void
    {
        $clientUser = $reservation->client?->user;

        if (! $clientUser) {
            return;
        }

        if (! $this->smsAutorise($clientUser, 'confirmation_reservation')) {
            return;
        }

        $phone = self::normaliserTelephone($clientUser->telephone ?? '');

        if ($phone === null) {
            Log::warning('SMS confirmation ignoré : numéro invalide.', [
                'user_id'       => $clientUser->id,
                'telephone_raw' => $clientUser->telephone,
            ]);
            return;
        }

        $artisanNom = $reservation->artisan?->user
            ? trim($reservation->artisan->user->prenom . ' ' . $reservation->artisan->user->nom)
            : 'votre artisan';

        $date = $reservation->date_debut
            ? $reservation->date_debut->format('d/m/Y à H:i')
            : ($reservation->date?->format('d/m/Y') ?? 'date à confirmer');

        $message = "ArtisanPro : Votre réservation #{$reservation->id} avec {$artisanNom} est confirmée pour le {$date}. Merci !";

        SendSmsJob::dispatch(
            $phone,
            $message,
            'confirmation_reservation',
            $reservation->id,
            \App\Models\Reservation::class,
        )->onQueue('sms');
    }

    /**
     * SMS d'annulation de réservation envoyé au client.
     */
    public function sendRejectionSms(Reservation $reservation): void
    {
        $clientUser = $reservation->client?->user;

        if (! $clientUser) {
            return;
        }

        if (! $this->smsAutorise($clientUser, 'annulation_reservation')) {
            return;
        }

        $phone = self::normaliserTelephone($clientUser->telephone ?? '');

        if ($phone === null) {
            Log::warning('SMS annulation ignoré : numéro invalide.', [
                'user_id'       => $clientUser->id,
                'telephone_raw' => $clientUser->telephone,
            ]);
            return;
        }

        $artisanNom = $reservation->artisan?->user
            ? trim($reservation->artisan->user->prenom . ' ' . $reservation->artisan->user->nom)
            : 'votre artisan';

        $message = "ArtisanPro : Votre réservation #{$reservation->id} avec {$artisanNom} a été annulée. Contactez-nous pour plus d'informations.";

        SendSmsJob::dispatch(
            $phone,
            $message,
            'annulation_reservation',
            $reservation->id,
            \App\Models\Reservation::class,
        )->onQueue('sms');
    }

    /**
     * SMS de notification de contrat finalisé (client ou artisan).
     *
     * @param  string    $telephone      Numéro du destinataire
     * @param  string    $numeroContrat  Numéro du contrat (ex. CP-2024-00001)
     * @param  User|null $user           Utilisateur destinataire pour vérifier les préférences
     * @param  int|null  $contratId      ID du contrat pour le log
     */
    public function envoyerContratFinalise(
        string  $telephone,
        string  $numeroContrat,
        ?User   $user      = null,
        ?int    $contratId = null,
    ): void {
        if (! $this->smsAutorise($user, 'contrat_finalise')) {
            return;
        }

        $phone = self::normaliserTelephone($telephone);

        if ($phone === null) {
            Log::warning('SMS contrat finalisé ignoré : numéro invalide.', [
                'telephone_raw' => $telephone,
                'numero_contrat' => $numeroContrat,
            ]);
            return;
        }

        $message = "ArtisanPro : Votre contrat {$numeroContrat} a été signé par les deux parties. Consultez votre espace.";

        SendSmsJob::dispatch(
            $phone,
            $message,
            'contrat_finalise',
            $contratId,
            \App\Models\Contrat::class,
        )->onQueue('sms');
    }

    /**
     * SMS d'alerte ouverture de litige envoyé à l'artisan.
     *
     * @param  string    $telephone    Numéro de l'artisan
     * @param  int       $litigeId     Identifiant du litige
     * @param  User|null $artisanUser  Utilisateur artisan pour vérifier les préférences
     */
    public function sendLitigeOuvertSms(string $telephone, int $litigeId, ?User $artisanUser = null): void
    {
        if (! $this->smsAutorise($artisanUser, 'litige_ouvert')) {
            return;
        }

        $phone = self::normaliserTelephone($telephone);

        if ($phone === null) {
            Log::warning('SMS litige ignoré : numéro invalide.', [
                'telephone_raw' => $telephone,
                'litige_id'     => $litigeId,
            ]);
            return;
        }

        $message = "ArtisanPro : Un litige #{$litigeId} a été ouvert. Connectez-vous pour soumettre votre réponse dans les 72h.";

        SendSmsJob::dispatch(
            $phone,
            $message,
            'litige_ouvert',
            $litigeId,
            \App\Models\Litige::class,
        )->onQueue('sms');
    }

    // ─── Normalisation E.164 ──────────────────────────────────────────────────

    /**
     * Normalise un numéro de téléphone au format E.164.
     * Retourne null si le numéro est invalide ou non reconnu.
     *
     * Formats acceptés (numéros béninois — indicatif pays 229) :
     *   "90123456"        → "+22990123456"   (8 chiffres locaux)
     *   "0190123456"      → "+22990123456"   (10 chiffres avec 0 initial, dépréciés)
     *   "90123456"        → "+22990123456"   (10 chiffres opérateur)
     *   "22990123456"     → "+22990123456"   (11 chiffres, déjà préfixé pays)
     *   "+22990123456"    → "+22990123456"   (déjà E.164)
     *
     * Formats internationaux (≥ 10 chiffres sans préfixe 229) :
     *   "33612345678"     → "+33612345678"
     */
    public static function normaliserTelephone(?string $telephone): ?string
    {
        if (empty($telephone)) {
            return null;
        }

        // Supprimer tout sauf les chiffres
        $clean = preg_replace('/\D/', '', $telephone);

        if (empty($clean)) {
            return null;
        }

        // Déjà préfixé 229 (Bénin) : 11 chiffres = 229 + 8 chiffres locaux
        if (str_starts_with($clean, '229') && strlen($clean) === 11) {
            return '+' . $clean;
        }

        // Préfixé 229 sur 13 chiffres (cas legacy avec double indicatif)
        if (str_starts_with($clean, '229') && strlen($clean) === 13) {
            return '+' . $clean;
        }

        // 8 chiffres locaux béninois → ajouter indicatif
        if (strlen($clean) === 8) {
            return '+229' . $clean;
        }

        // 10 chiffres avec 0 initial (ancien format régional)
        if (strlen($clean) === 10 && str_starts_with($clean, '0')) {
            return '+229' . substr($clean, 1);
        }

        // 10 chiffres sans 0 initial (format opérateur Bénin)
        if (strlen($clean) === 10 && ! str_starts_with($clean, '0')) {
            return '+229' . $clean;
        }

        // Numéro international (≥ 10 chiffres, préfixe différent de 229)
        if (strlen($clean) >= 10) {
            return '+' . $clean;
        }

        return null;
    }

    // ─── Helper d'autorisation ────────────────────────────────────────────────

    /**
     * Vérifie si l'envoi SMS est autorisé pour cet utilisateur.
     * Si aucun utilisateur n'est fourni, l'envoi est autorisé (SMS système).
     */
    private function smsAutorise(?User $user, string $type): bool
    {
        if ($user === null) {
            return true;
        }

        if ($user->sms_notifications_enabled !== true) {
            Log::debug('SMS bloqué : préférences SMS désactivées.', [
                'user_id'                   => $user->id,
                'sms_notifications_enabled' => $user->sms_notifications_enabled,
                'type'                      => $type,
            ]);
            return false;
        }

        return true;
    }
}
