<?php

namespace App\Http\Controllers\Portal;

use App\Http\Controllers\Controller;
use App\Models\Paiement;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ArtisanEarningsController extends Controller
{
    public function __invoke()
    {
        $user = Auth::user();
        if (! $user || ! $user->artisan) {
            abort(403);
        }

        $artisan = $user->artisan;

        // ── Transactions (table transactions — webhook serveur) ──────────────
        $txQuery = $artisan->transactions()->where('status', 'succeeded');
        $totalFromTransactions = (float) $txQuery->sum('amount');
        $totalTransactions     = $txQuery->count();

        // ── Paiements (table paiements — widget KkiaPay + autres) ───────────
        // Les paiements liés aux réservations de cet artisan
        $paiementsQuery = Paiement::query()
            ->whereHas('reservation', fn ($q) => $q->where('id_artisan', $artisan->id))
            ->whereIn('statut', ['reussi', 'complete']);

        $totalFromPaiements  = (float) $paiementsQuery->sum('montant');
        $totalPaiements      = $paiementsQuery->count();

        // Revenu total = somme des deux sources (dédupliqué par référence)
        // Pour éviter le double-comptage, on vérifie si la transaction existe déjà
        // dans les deux tables via reference_transaction / provider_transaction_id
        $paiementRefs = Paiement::query()
            ->whereHas('reservation', fn ($q) => $q->where('id_artisan', $artisan->id))
            ->whereIn('statut', ['reussi', 'complete'])
            ->whereNotNull('reference_transaction')
            ->pluck('reference_transaction')
            ->toArray();

        // Transactions qui ne sont PAS déjà dans la table paiements
        $txNotInPaiements = $artisan->transactions()
            ->where('status', 'succeeded')
            ->whereNotIn('provider_transaction_id', $paiementRefs)
            ->sum('amount');

        $totalRevenue      = $totalFromPaiements + (float) $txNotInPaiements;
        $totalTransactions = $totalPaiements + $artisan->transactions()
            ->where('status', 'succeeded')
            ->whereNotIn('provider_transaction_id', $paiementRefs)
            ->count();

        // ── Payouts ──────────────────────────────────────────────────────────
        $outstandingPayouts = (float) $artisan->payouts()
            ->whereIn('status', ['requested', 'processing', 'completed'])
            ->sum('amount');

        $completedPayouts = (float) $artisan->payouts()
            ->where('status', 'completed')
            ->sum('amount');

        $availableBalance = $totalRevenue - $outstandingPayouts;

        // ── Transactions récentes (depuis table paiements en priorité) ───────
        $recentPaiements = Paiement::query()
            ->whereHas('reservation', fn ($q) => $q->where('id_artisan', $artisan->id))
            ->with('reservation.client.user')
            ->orderByDesc('date_paiement')
            ->limit(10)
            ->get()
            ->map(fn ($p) => [
                'id'         => 'p-' . $p->id,
                'amount'     => (float) $p->montant,
                'currency'   => 'XOF',
                'provider'   => $p->payment_provider ?? $p->methode_paiement ?? 'kkiapay',
                'status'     => $p->statut === 'reussi' ? 'succeeded' : $p->statut,
                'created_at' => optional($p->date_paiement ?? $p->created_at)->toDateTimeString(),
                'metadata'   => [
                    'reservation_id' => $p->id_reservation,
                    'reference'      => $p->reference_transaction,
                    'client'         => $p->reservation?->client?->user
                        ? trim($p->reservation->client->user->prenom . ' ' . $p->reservation->client->user->nom)
                        : null,
                ],
            ])
            ->toArray();

        // Compléter avec les transactions webhook non présentes dans paiements
        $recentTxWebhook = $artisan->transactions()
            ->where('status', 'succeeded')
            ->whereNotIn('provider_transaction_id', $paiementRefs)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($t) => [
                'id'         => 't-' . $t->id,
                'amount'     => (float) $t->amount,
                'currency'   => $t->currency,
                'provider'   => $t->provider,
                'status'     => $t->status,
                'created_at' => optional($t->created_at)->toDateTimeString(),
                'metadata'   => $t->metadata,
            ])
            ->toArray();

        // Fusionner et trier par date décroissante
        $allRecentTransactions = collect(array_merge($recentPaiements, $recentTxWebhook))
            ->sortByDesc('created_at')
            ->take(10)
            ->values()
            ->toArray();

        // ── Payouts récents ──────────────────────────────────────────────────
        $recentPayouts = $artisan->payouts()
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn ($payout) => [
                'id'         => $payout->id,
                'amount'     => (float) $payout->amount,
                'currency'   => $payout->currency,
                'provider'   => $payout->provider,
                'status'     => $payout->status,
                'created_at' => optional($payout->created_at)->toDateTimeString(),
                'metadata'   => $payout->metadata,
            ])
            ->toArray();

        return Inertia::render('artisan/earnings', [
            'summary' => [
                'totalRevenue'       => $totalRevenue,
                'totalTransactions'  => $totalTransactions,
                'outstandingPayouts' => $outstandingPayouts,
                'completedPayouts'   => $completedPayouts,
                'availableBalance'   => $availableBalance,
            ],
            'recentTransactions' => $allRecentTransactions,
            'recentPayouts'      => $recentPayouts,
        ]);
    }
}
