<?php

namespace App\Http\Controllers\Payment;

use App\Events\PaiementValide;
use App\Http\Controllers\Controller;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Notification as AppNotification;
use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\Transaction;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Callback de redirection navigateur apres paiement KkiaPay.
 *
 * Paramètres GET attendus :
 *   - transaction_id  : ID de la transaction KkiaPay
 *   - status          : "success" | "failed"
 *   - reservation_id  : ID de la reservation
 *
 * Apres validation :
 *   - Cree Transaction + Paiement
 *   - Declenche PaiementValide (event) -> wallet credit + SMS artisan + SMS client
 */
class KkiapayCallbackController extends Controller
{
    /** Taux d'acompte fixe : 30% du montant total */
    const ACOMPTE_TAUX = 0.30;

    public function __invoke(Request $request)
    {
        // Kkiapay envoie les paramètres en camelCase (transactionId) OU snake_case
        // selon la version du widget — on accepte les deux formats
        $transactionId = $request->query('transaction_id')
            ?? $request->query('transactionId');
        $status        = $request->query('status', 'failed');
        $reservationId = $request->query('reservation_id')
            ?? $request->query('reservationId');

        Log::info('KkiaPay callback recu', [
            'transaction_id' => $transactionId,
            'status'         => $status,
            'reservation_id' => $reservationId,
            'all_params'     => $request->query(),
        ]);

        if (! $transactionId) {
            Log::warning('KkiaPay callback sans transaction_id');
            return redirect()->route('client.reservations')
                ->with('error', 'Paiement invalide : identifiant de transaction manquant.');
        }

        if ($status !== 'success') {
            // Vérifier si le paiement a déjà été confirmé via le canal JS (onSuccess)
            // Le POST /kkiapay-confirm enregistre le paiement avant ce callback GET
            if ($reservationId) {
                $alreadyPaid = \App\Models\Paiement::query()
                    ->where('id_reservation', $reservationId)
                    ->whereIn('statut', ['reussi', 'complete'])
                    ->exists();

                if ($alreadyPaid) {
                    Log::info('KkiaPay callback: paiement déjà confirmé via onSuccess JS', [
                        'reservation_id' => $reservationId,
                    ]);
                    return redirect()->route('client.reservations.show', $reservationId)
                        ->with('success', 'Paiement confirmé avec succès !');
                }
            }

            return redirect()->route('client.reservations')
                ->with('error', 'Le paiement a echoue ou a ete annule. Veuillez reessayer.');
        }

        $reservation    = $reservationId ? Reservation::find($reservationId) : null;
        $montantTotal   = (float) ($reservation?->montant_total ?? 0);
        $montantAcompte = round($montantTotal * self::ACOMPTE_TAUX);

        // ── Enregistrer la transaction ────────────────────────────────────────
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

        // ── Creer le paiement ─────────────────────────────────────────────────
        $paiement = null;
        if ($reservation) {
            $alreadyPaid = Paiement::where('id_reservation', $reservation->id)
                ->whereIn('statut', ['reussi', 'complete'])
                ->exists();

            if (! $alreadyPaid) {
                $client = Client::find($reservation->id_client);

                $montantReel = $montantAcompte > 0 ? $montantAcompte : $montantTotal;

                $paiement = Paiement::create([
                    'id_reservation'        => $reservation->id,
                    'id_utilisateur'        => $client?->id_utilisateur,
                    'montant'               => $montantReel,
                    'methode_paiement'      => 'kkiapay',
                    'payment_provider'      => 'kkiapay',
                    'statut'                => 'reussi',
                    'reference_transaction' => $transactionId,
                    'date_paiement'         => now(),
                    'type_transaction'      => 'acompte',
                ]);

                $reservation->update([
                    'acompte_verse' => $montantReel,
                    'statut'        => in_array($reservation->statut, ['confirmee', 'confirme', 'en_attente'], true)
                        ? 'en_cours'
                        : $reservation->statut,
                ]);
            }

            $montantAffiche = number_format($montantAcompte > 0 ? $montantAcompte : $montantTotal, 0, '.', ' ');

            // ── Notifications in-app (synchrones, non bloquantes) ─────────────
            if ($reservation->id_artisan) {
                $artisan = Artisan::with('user')->find($reservation->id_artisan);
                if ($artisan?->user) {
                    AppNotification::notifier(
                        $artisan->user->id,
                        "Acompte de {$montantAffiche} FCFA recu via KkiaPay pour la reservation #{$reservation->id}. Ref : {$transactionId}.",
                        'paiement'
                    );
                }
            }

            $client = Client::find($reservation->id_client);
            if ($client?->id_utilisateur) {
                AppNotification::notifier(
                    $client->id_utilisateur,
                    "Votre acompte de {$montantAffiche} FCFA a ete confirme (ref. {$transactionId}). La reservation #{$reservation->id} est en cours.",
                    'paiement'
                );
            }

            // ── Event PaiementValide -> wallet credit + SMS (asynchrone/queue) ─
            if ($paiement) {
                try {
                    $reservation->load(['artisan.user', 'client.user']);
                    PaiementValide::dispatch($paiement, $reservation, $transactionId);
                } catch (\Throwable $e) {
                    Log::warning('KkiapayCallback: PaiementValide event non envoye.', ['error' => $e->getMessage()]);
                }
            }

            return redirect()->route('client.reservations.show', $reservation->id)
                ->with('success', "Acompte de {$montantAffiche} FCFA confirme avec succes !");
        }

        return redirect()->route('client.reservations')
            ->with('success', 'Paiement confirme avec succes !');
    }
}
