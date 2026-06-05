<?php

use App\Models\Artisan;
use App\Models\Wallet;
use App\Models\WalletTransaction;
use App\Services\WalletService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeArtisan(): Artisan
{
    return Artisan::factory()->create();
}

function makeWallet(Artisan $artisan, float $solde = 0, float $enAttente = 0): Wallet
{
    return Wallet::create([
        'id_artisan'       => $artisan->id,
        'solde'            => $solde,
        'solde_en_attente' => $enAttente,
        'total_credit'     => 0,
        'total_debit'      => 0,
        'devise'           => 'XOF',
        'actif'            => true,
    ]);
}

// ─────────────────────────────────────────────────────────────────────────────
// getOrCreate
// ─────────────────────────────────────────────────────────────────────────────

test('getOrCreate crée un wallet avec solde zéro si inexistant', function () {
    $artisan = makeArtisan();
    $service = new WalletService();

    $wallet = $service->getOrCreate($artisan);

    expect($wallet)->toBeInstanceOf(Wallet::class)
        ->and((float) $wallet->solde)->toBe(0.0)
        ->and((float) $wallet->solde_en_attente)->toBe(0.0)
        ->and($wallet->devise)->toBe('XOF')
        ->and($wallet->actif)->toBeTrue();
});

test('getOrCreate retourne le wallet existant sans en créer un second', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 5000);
    $service = new WalletService();

    $wallet = $service->getOrCreate($artisan);

    expect(Wallet::where('id_artisan', $artisan->id)->count())->toBe(1)
        ->and((float) $wallet->solde)->toBe(5000.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// getBalance
// ─────────────────────────────────────────────────────────────────────────────

test('getBalance retourne 0.0 si aucun wallet', function () {
    $artisan = makeArtisan();
    $service = new WalletService();

    expect($service->getBalance($artisan))->toBe(0.0);
});

test('getBalance retourne le solde exact', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 12500);
    $service = new WalletService();

    expect($service->getBalance($artisan))->toBe(12500.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// credit
// ─────────────────────────────────────────────────────────────────────────────

test('credit augmente le solde et total_credit', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 1000);
    $service = new WalletService();

    $service->credit($artisan, 500, 'acompte_kkiapay');

    $wallet = Wallet::where('id_artisan', $artisan->id)->first();
    expect((float) $wallet->solde)->toBe(1500.0)
        ->and((float) $wallet->total_credit)->toBe(500.0);
});

test('credit crée une WalletTransaction avec les bons champs', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 2000);
    $service = new WalletService();

    $tx = $service->credit($artisan, 1000, 'liberation_fonds', 'REF-001', [
        'id_reservation' => 42,
        'id_paiement'    => 7,
        'metadata'       => ['note' => 'test'],
    ]);

    expect($tx)->toBeInstanceOf(WalletTransaction::class)
        ->and($tx->type)->toBe('credit')
        ->and((float) $tx->montant)->toBe(1000.0)
        ->and((float) $tx->solde_avant)->toBe(2000.0)
        ->and((float) $tx->solde_apres)->toBe(3000.0)
        ->and($tx->motif)->toBe('liberation_fonds')
        ->and($tx->reference)->toBe('REF-001')
        ->and($tx->id_reservation)->toBe(42)
        ->and($tx->id_paiement)->toBe(7)
        ->and($tx->devise)->toBe('XOF');
});

test('credit crée le wallet automatiquement si inexistant', function () {
    $artisan = makeArtisan();
    $service = new WalletService();

    $service->credit($artisan, 300, 'bonus');

    expect(Wallet::where('id_artisan', $artisan->id)->exists())->toBeTrue()
        ->and($service->getBalance($artisan))->toBe(300.0);
});

test('credit lève InvalidArgumentException pour montant nul ou négatif', function () {
    $artisan = makeArtisan();
    makeWallet($artisan);
    $service = new WalletService();

    expect(fn () => $service->credit($artisan, 0, 'test'))
        ->toThrow(\InvalidArgumentException::class);

    expect(fn () => $service->credit($artisan, -100, 'test'))
        ->toThrow(\InvalidArgumentException::class);
});

test('plusieurs credits successifs s\'accumulent correctement', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 0);
    $service = new WalletService();

    $service->credit($artisan, 1000, 'acompte_1');
    $service->credit($artisan, 2000, 'acompte_2');
    $service->credit($artisan, 500, 'acompte_3');

    $wallet = Wallet::where('id_artisan', $artisan->id)->first();
    expect((float) $wallet->solde)->toBe(3500.0)
        ->and((float) $wallet->total_credit)->toBe(3500.0);
});

// ─────────────────────────────────────────────────────────────────────────────
// debit
// ─────────────────────────────────────────────────────────────────────────────

test('debit diminue le solde et augmente total_debit', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 5000);
    $service = new WalletService();

    $service->debit($artisan, 1500, 'retrait');

    $wallet = Wallet::where('id_artisan', $artisan->id)->first();
    expect((float) $wallet->solde)->toBe(3500.0)
        ->and((float) $wallet->total_debit)->toBe(1500.0);
});

test('debit crée une WalletTransaction de type debit', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 3000);
    $service = new WalletService();

    $tx = $service->debit($artisan, 1000, 'commission', 'REF-DEBIT');

    expect($tx->type)->toBe('debit')
        ->and((float) $tx->montant)->toBe(1000.0)
        ->and((float) $tx->solde_avant)->toBe(3000.0)
        ->and((float) $tx->solde_apres)->toBe(2000.0)
        ->and($tx->motif)->toBe('commission')
        ->and($tx->reference)->toBe('REF-DEBIT');
});

test('debit lève RuntimeException si solde insuffisant', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 100);
    $service = new WalletService();

    expect(fn () => $service->debit($artisan, 500, 'retrait'))
        ->toThrow(\RuntimeException::class, 'Solde insuffisant');
});

test('debit lève RuntimeException si aucun wallet', function () {
    $artisan = makeArtisan();
    $service = new WalletService();

    expect(fn () => $service->debit($artisan, 100, 'retrait'))
        ->toThrow(\RuntimeException::class);
});

test('debit exact au centime près fonctionne (solde final = 0)', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 250);
    $service = new WalletService();

    $service->debit($artisan, 250, 'retrait_total');

    expect($service->getBalance($artisan))->toBe(0.0);
});

test('debit lève InvalidArgumentException pour montant nul ou négatif', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 1000);
    $service = new WalletService();

    expect(fn () => $service->debit($artisan, 0, 'test'))
        ->toThrow(\InvalidArgumentException::class);

    expect(fn () => $service->debit($artisan, -50, 'test'))
        ->toThrow(\InvalidArgumentException::class);
});

// ─────────────────────────────────────────────────────────────────────────────
// mettreEnAttente
// ─────────────────────────────────────────────────────────────────────────────

test('mettreEnAttente augmente solde et solde_en_attente', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 0, 0);
    $service = new WalletService();

    $service->mettreEnAttente($artisan, 2000);

    $wallet = Wallet::where('id_artisan', $artisan->id)->first();
    expect((float) $wallet->solde)->toBe(2000.0)
        ->and((float) $wallet->solde_en_attente)->toBe(2000.0);
});

test('mettreEnAttente ne fait rien si montant est 0', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 500, 100);
    $service = new WalletService();

    $service->mettreEnAttente($artisan, 0);

    $wallet = Wallet::where('id_artisan', $artisan->id)->first();
    expect((float) $wallet->solde_en_attente)->toBe(100.0);
});

test('mettreEnAttente crée le wallet si inexistant', function () {
    $artisan = makeArtisan();
    $service = new WalletService();

    $service->mettreEnAttente($artisan, 1000);

    expect(Wallet::where('id_artisan', $artisan->id)->exists())->toBeTrue();
});

// ─────────────────────────────────────────────────────────────────────────────
// libererFondsEnAttente
// ─────────────────────────────────────────────────────────────────────────────

test('libererFondsEnAttente décrémente solde_en_attente sans toucher au solde', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 5000, 3000);
    $service = new WalletService();

    $service->libererFondsEnAttente($artisan, 1000);

    $wallet = Wallet::where('id_artisan', $artisan->id)->first();
    expect((float) $wallet->solde_en_attente)->toBe(2000.0)
        ->and((float) $wallet->solde)->toBe(5000.0); // solde inchangé
});

test('libererFondsEnAttente ne descend pas en dessous de 0', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 3000, 500);
    $service = new WalletService();

    $service->libererFondsEnAttente($artisan, 9999);

    $wallet = Wallet::where('id_artisan', $artisan->id)->first();
    expect((float) $wallet->solde_en_attente)->toBe(0.0);
});

test('libererFondsEnAttente ne fait rien si montant est 0', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 2000, 800);
    $service = new WalletService();

    $service->libererFondsEnAttente($artisan, 0);

    $wallet = Wallet::where('id_artisan', $artisan->id)->first();
    expect((float) $wallet->solde_en_attente)->toBe(800.0);
});

test('libererFondsEnAttente ne fait rien si wallet inexistant', function () {
    $artisan = makeArtisan();
    $service = new WalletService();

    // Ne doit pas lever d'exception
    $service->libererFondsEnAttente($artisan, 500);

    expect(Wallet::where('id_artisan', $artisan->id)->exists())->toBeFalse();
});

// ─────────────────────────────────────────────────────────────────────────────
// Piste d'audit (audit trail)
// ─────────────────────────────────────────────────────────────────────────────

test('chaque credit et debit génère une transaction avec solde_avant et solde_apres cohérents', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 0);
    $service = new WalletService();

    $service->credit($artisan, 1000, 'depot_1');
    $service->credit($artisan, 500, 'depot_2');
    $service->debit($artisan, 300, 'retrait_1');

    $txs = WalletTransaction::where('id_artisan', $artisan->id)
        ->orderBy('id')
        ->get();

    expect($txs)->toHaveCount(3);

    // tx1 : credit 1000 (0 → 1000)
    expect((float) $txs[0]->solde_avant)->toBe(0.0)
        ->and((float) $txs[0]->solde_apres)->toBe(1000.0);

    // tx2 : credit 500 (1000 → 1500)
    expect((float) $txs[1]->solde_avant)->toBe(1000.0)
        ->and((float) $txs[1]->solde_apres)->toBe(1500.0);

    // tx3 : debit 300 (1500 → 1200)
    expect((float) $txs[2]->solde_avant)->toBe(1500.0)
        ->and((float) $txs[2]->solde_apres)->toBe(1200.0);
});

test('solde_apres de chaque transaction correspond au solde_avant de la suivante', function () {
    $artisan = makeArtisan();
    makeWallet($artisan, 0);
    $service = new WalletService();

    foreach ([800, 1200, 400, 600] as $montant) {
        $service->credit($artisan, $montant, 'depot');
    }

    $txs = WalletTransaction::where('id_artisan', $artisan->id)
        ->orderBy('id')
        ->get();

    for ($i = 0; $i < $txs->count() - 1; $i++) {
        expect((float) $txs[$i]->solde_apres)->toBe((float) $txs[$i + 1]->solde_avant);
    }
});

test('solde_disponible = solde - solde_en_attente', function () {
    $artisan = makeArtisan();
    $wallet  = makeWallet($artisan, 5000, 1500);

    expect($wallet->solde_disponible)->toBe(3500.0);
});
