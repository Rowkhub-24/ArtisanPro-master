<?php

namespace App\Services;

use App\Models\Artisan;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Service de gestion du portefeuille artisan.
 *
 * Toutes les operations sont atomiques (DB::transaction).
 * Chaque credit/debit enregistre un WalletTransaction avec
 * le solde avant/apres pour une piste d'audit complete.
 */
class WalletService
{
    /**
     * Retourne ou cree le wallet d'un artisan.
     */
    public function getOrCreate(Artisan $artisan): Wallet
    {
        return Wallet::firstOrCreate(
            ['id_artisan' => $artisan->id],
            [
                'solde'            => 0,
                'solde_en_attente' => 0,
                'total_credit'     => 0,
                'total_debit'      => 0,
                'devise'           => 'XOF',
                'actif'            => true,
            ]
        );
    }

    /**
     * Retourne le solde disponible d'un artisan.
     */
    public function getBalance(Artisan $artisan): float
    {
        $wallet = Wallet::where('id_artisan', $artisan->id)->first();
        return $wallet ? (float) $wallet->solde : 0.0;
    }

    /**
     * Credite le portefeuille de l'artisan.
     *
     * @param  Artisan  $artisan
     * @param  float    $montant   Montant en XOF
     * @param  string   $motif     Raison du credit ('acompte_kkiapay', 'liberation_fonds', etc.)
     * @param  string|null $reference  Reference de transaction externe
     * @param  array    $context   [id_reservation, id_paiement, metadata]
     * @return WalletTransaction
     */
    public function credit(
        Artisan $artisan,
        float $montant,
        string $motif,
        ?string $reference = null,
        array $context = []
    ): WalletTransaction {
        if ($montant <= 0) {
            throw new \InvalidArgumentException("Le montant du credit doit etre positif. Recu: {$montant}");
        }

        return DB::transaction(function () use ($artisan, $montant, $motif, $reference, $context) {
            // Verrouillage pessimiste pour eviter les race conditions
            $wallet = Wallet::where('id_artisan', $artisan->id)->lockForUpdate()->first();

            if (! $wallet) {
                $wallet = $this->getOrCreate($artisan);
                $wallet = Wallet::where('id_artisan', $artisan->id)->lockForUpdate()->first();
            }

            $soldeAvant = (float) $wallet->solde;
            $soldeApres = $soldeAvant + $montant;

            $wallet->solde        = $soldeApres;
            $wallet->total_credit = (float) $wallet->total_credit + $montant;
            $wallet->save();

            $walletTx = WalletTransaction::create([
                'wallet_id'      => $wallet->id,
                'id_artisan'     => $artisan->id,
                'type'           => 'credit',
                'montant'        => $montant,
                'solde_avant'    => $soldeAvant,
                'solde_apres'    => $soldeApres,
                'devise'         => $wallet->devise,
                'motif'          => $motif,
                'reference'      => $reference,
                'id_reservation' => $context['id_reservation'] ?? null,
                'id_paiement'    => $context['id_paiement'] ?? null,
                'metadata'       => $context['metadata'] ?? null,
            ]);

            Log::info("Wallet credit: artisan #{$artisan->id}", [
                'montant'    => $montant,
                'motif'      => $motif,
                'solde_apres' => $soldeApres,
                'reference'  => $reference,
            ]);

            return $walletTx;
        });
    }

    /**
     * Debite le portefeuille de l'artisan.
     *
     * @throws \RuntimeException Si le solde est insuffisant
     */
    public function debit(
        Artisan $artisan,
        float $montant,
        string $motif,
        ?string $reference = null,
        array $context = []
    ): WalletTransaction {
        if ($montant <= 0) {
            throw new \InvalidArgumentException("Le montant du debit doit etre positif. Recu: {$montant}");
        }

        return DB::transaction(function () use ($artisan, $montant, $motif, $reference, $context) {
            $wallet = Wallet::where('id_artisan', $artisan->id)->lockForUpdate()->first();

            if (! $wallet || (float) $wallet->solde < $montant) {
                $solde = $wallet ? (float) $wallet->solde : 0;
                throw new \RuntimeException(
                    "Solde insuffisant pour le debit. Solde: {$solde} XOF, Debit demande: {$montant} XOF"
                );
            }

            $soldeAvant = (float) $wallet->solde;
            $soldeApres = $soldeAvant - $montant;

            $wallet->solde       = $soldeApres;
            $wallet->total_debit = (float) $wallet->total_debit + $montant;
            $wallet->save();

            $walletTx = WalletTransaction::create([
                'wallet_id'      => $wallet->id,
                'id_artisan'     => $artisan->id,
                'type'           => 'debit',
                'montant'        => $montant,
                'solde_avant'    => $soldeAvant,
                'solde_apres'    => $soldeApres,
                'devise'         => $wallet->devise,
                'motif'          => $motif,
                'reference'      => $reference,
                'id_reservation' => $context['id_reservation'] ?? null,
                'id_paiement'    => $context['id_paiement'] ?? null,
                'metadata'       => $context['metadata'] ?? null,
            ]);

            Log::info("Wallet debit: artisan #{$artisan->id}", [
                'montant'     => $montant,
                'motif'       => $motif,
                'solde_apres' => $soldeApres,
                'reference'   => $reference,
            ]);

            return $walletTx;
        });
    }

    /**
     * Met le montant en attente (sequestre).
     * Credite le solde_en_attente sans toucher au solde disponible.
     */
    public function mettreEnAttente(Artisan $artisan, float $montant): void
    {
        if ($montant <= 0) return;

        DB::transaction(function () use ($artisan, $montant) {
            $wallet = Wallet::where('id_artisan', $artisan->id)->lockForUpdate()->first()
                ?? $this->getOrCreate($artisan);

            $wallet->increment('solde_en_attente', $montant);
            $wallet->increment('solde', $montant);
        });
    }

    /**
     * Libere les fonds en attente (apres confirmation de prestation).
     * Decremente solde_en_attente (le solde reste inchange).
     */
    public function libererFondsEnAttente(Artisan $artisan, float $montant): void
    {
        if ($montant <= 0) return;

        DB::transaction(function () use ($artisan, $montant) {
            $wallet = Wallet::where('id_artisan', $artisan->id)->lockForUpdate()->first();
            if (! $wallet) return;

            $newPending = max(0, (float) $wallet->solde_en_attente - $montant);
            $wallet->solde_en_attente = $newPending;
            $wallet->save();
        });
    }
}
