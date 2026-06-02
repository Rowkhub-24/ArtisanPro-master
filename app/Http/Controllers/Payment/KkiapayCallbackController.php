<?php

namespace App\Http\Controllers\Payment;

use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Notification as AppNotification;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Transaction;
use App\Services\SmsNotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Callback de redirection navigateur après paiement KkiaPay.
 *
 * Paramètres GET attendus :
 *   - transaction_id  : ID de la transaction KkiaPay
 *   - status          : "success" | "failed"
 *   - reservation_id  : ID de la réservation (passé via le champ data du widget)
 */
class KkiapayCallbackController extends Controller
{
    /** Taux d'acompte fixe : 30% du montant total */
    const ACOMPTE_TAUX = 0.30;

    public function __invoke(Request $request)
    {
        $transactionId = $request->query('transaction_id');
        $status        = $request->query('status', 'failed');
        $reservationId = $request->query('reservation_id');

        Log::info('KkiaPay callback reçu', [
            'transaction_id' => $transactionId,
            'status'         => $status,
            'reservation_id' => $reservationId,
        ]);

        if (! $transactionId) {
            Log::warning('KkiaPay callback sans transaction_id');
            return redirect()->route('client.reservations')
                ->with('error', 'Paiement invalide : identifiant de transaction manquant.');
        }

        if ($status !== 'success') {
            return redirect()->route('client.reservations')
                ->with('error', 'Le paiement a échoué ou a été annulé. Veuillez réessayer.');
        }

        // Retrouver la réservation
        $reservation = $reservationId ? Reservation::find($reservationId) : null;

        // Calculer le montant de l'acompte (30%)
        $montantTotal  = (float) ($reservation?->montant_total ?? 0);
        $montantAcompte = round($montantTotal * self::ACOMPTE_TAUX);

        // Enregistrer la transaction (table transactions)
        $transaction = Transaction::firstOrNew([
            'provider'                => 'kkiapay',
            'provider_transaction_id' => $transactionId,
        ]);

        $transaction->status   = 'succeeded';
        $transaction->currency = 'XOF';
        $transaction->amount   = $montantAcompte > 0 ? $montantAcompte : $montantTotal;

        if ($reservation) {
            if ($reservation->id_artisan) {
                $transaction->id_artisan = $reservation->id_artisan;
            }
            $client = Client::find($reservation->id_client);
            if ($client) {
                $transaction->id_utilisateur = $client->id_utilisateur;
            }
            $transaction->metadata = [
                'reservation_id' => $reservation->id,
                'type'           => 'acompte',
                'taux_acompte'   => self::ACOMPTE_TAUX,
                'montant_total'  => $montantTotal,
                'source'         => 'kkiapay_widget_callback',
            ];
        }

        $transaction->save();

        // Créer le paiement dans la table paiements
        if ($reservation) {
            $alreadyPaid = Paiement::where('id_reservation', $reservation->id)
                ->whereIn('statut', ['reussi', 'complete'])
                ->exists();

            if (! $alreadyPaid) {
                $client = Client::find($reservation->id_client);

                Paiement::create([
                    'id_reservation'        => $reservation->id,
                    'id_utilisateur'        => $client?->id_utilisateur,
                    'montant'               => $montantAcompte > 0 ? $montantAcompte : $montantTotal,
                    'methode_paiement'      => 'kkiapay',
                    'payment_provider'      => 'kkiapay',
                    'statut'                => 'reussi',
                    'reference_transaction' => $transactionId,
                    'date_paiement'         => now(),
                    'type_transaction'      => 'acompte',
                ]);

                // Mettre à jour l'acompte versé sur la réservation
                $reservation->update([
                    'acompte_verse' => $montantAcompte > 0 ? $montantAcompte : $montantTotal,
                    'statut'        => in_array($reservation->statut, ['confirmee', 'confirme', 'en_attente'], true)
                        ? 'en_cours'
                        : $reservation->statut,
                ]);
            }

            $montantAffiche = number_format($montantAcompte > 0 ? $montantAcompte : $montantTotal, 0, '.', ' ');

            // ── Notifier l'artisan ────────────────────────────────────────────
            if ($reservation->id_artisan) {
                $artisan = Artisan::with('user')->find($reservation->id_artisan);
                if ($artisan && $artisan->user) {
                    AppNotification::notifier(
                        $artisan->user->id,
                        "💰 Acompte de {$montantAffiche} FCFA reçu via KkiaPay pour la réservation #{$reservation->id}. Référence : {$transactionId}.",
                        'paiement'
                    );
                }
            }

            // ── Notifier le client ────────────────────────────────────────────
            $client = Client::find($reservation->id_client);
            if ($client && $client->id_utilisateur) {
                AppNotification::notifier(
                    $client->id_utilisateur,
                    "✅ Votre acompte de {$montantAffiche} FCFA a été confirmé (réf. {$transactionId}). La réservation #{$reservation->id} est en cours.",
                    'paiement'
                );

                // ── SMS de confirmation au client ─────────────────────────────
                try {
                    $sms = new SmsNotificationService();
                    $sms->sendPaiementConfirmeSms(
                        $client->user?->telephone ?? '',
                        $montantAffiche,
                        $transactionId
                    );
                } catch (\Throwable $e) {
                    Log::warning('SMS paiement non envoyé', ['error' => $e->getMessage()]);
                }
            }
            return redirect()->route('client.reservations.show', $reservation->id)
                ->with('success', "Acompte de {$montantAffiche} FCFA confirmé avec succès !");
        }

        return redirect()->route('client.reservations')
            ->with('success', 'Paiement confirmé avec succès !');
    }
}
