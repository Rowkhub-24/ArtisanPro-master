<?php

use App\Models\Artisan;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\Reservation;
use App\Models\User;
use App\Contracts\SignatureServiceInterface;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Crée un contrat complet avec client, artisan et réservation liés.
 *
 * @return array{contrat: Contrat, clientUser: User, artisanUser: User, client: Client, artisan: Artisan}
 */
function makeContrat(array $attrs = []): array
{
    $clientUser = User::factory()->create(['type_utilisateur' => 'client']);
    $artisanUser = User::factory()->create(['type_utilisateur' => 'artisan']);

    $client  = Client::factory()->create(['id_utilisateur' => $clientUser->id]);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $artisanUser->id]);

    $reservation = Reservation::factory()->create([
        'id_client'  => $client->id,
        'id_artisan' => $artisan->id,
        'statut'     => 'confirmee',
    ]);

    $contrat = Contrat::create(array_merge([
        'id_reservation'         => $reservation->id,
        'id_client'              => $client->id,
        'id_artisan'             => $artisan->id,
        'numero_contrat'         => 'CP-2025-00001',
        'nom_client'             => $clientUser->prenom . ' ' . $clientUser->nom,
        'nom_artisan'            => $artisanUser->prenom . ' ' . $artisanUser->nom,
        'description_prestation' => 'Travaux de plomberie',
        'montant_total'          => 50000.00,
        'date_debut_prestation'  => now()->addDays(7),
        'adresse_intervention'   => 'Cotonou, Bénin',
        'statut'                 => Contrat::STATUT_GENERE,
        'genere_at'              => now(),
    ], $attrs));

    return compact('contrat', 'clientUser', 'artisanUser', 'client', 'artisan');
}

// ═══════════════════════════════════════════════════════════════════════════════
//  PORTAIL — ContratController
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /portal/contrats/{contrat} ───────────────────────────────────────────

test('GET portal/contrats/{contrat} retourne 200 pour le client propriétaire', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeContrat();

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200);
});

test("GET portal/contrats/{contrat} retourne 200 pour l'artisan propriétaire", function () {
    ['contrat' => $contrat, 'artisanUser' => $artisanUser] = makeContrat();

    $this->actingAs($artisanUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200);
});

test('GET portal/contrats/{contrat} retourne 403 pour un utilisateur tiers', function () {
    ['contrat' => $contrat] = makeContrat();

    $otherUser = User::factory()->create(['type_utilisateur' => 'client']);
    Client::factory()->create(['id_utilisateur' => $otherUser->id]);

    $this->actingAs($otherUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(403);
});

test('GET portal/contrats/{contrat} redirige vers login pour un visiteur non authentifié', function () {
    ['contrat' => $contrat] = makeContrat();

    $this->get("/portal/contrats/{$contrat->id}")
        ->assertRedirect(route('login'));
});

// ─── POST /portal/contrats/{contrat}/signer ───────────────────────────────────

test('POST portal/contrats/{contrat}/signer enregistre la signature du client', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeContrat([
        'statut' => Contrat::STATUT_GENERE,
    ]);

    // Binder un mock léger du SignatureService pour éviter la génération PDF dans ce test
    $signatureMock = \Mockery::mock(SignatureServiceInterface::class);
    $signatureMock->shouldReceive('signer')
        ->once()
        ->andReturnUsing(function (Contrat $c, User $u, string $role) {
            $c->update([
                'signature_client_at'   => now(),
                'signature_client_hash' => 'fake-hash',
                'statut'                => Contrat::STATUT_PARTIELLEMENT_SIGNE,
            ]);
            return $c->fresh();
        });
    app()->instance(SignatureServiceInterface::class, $signatureMock);

    $this->actingAs($clientUser)
        ->post("/portal/contrats/{$contrat->id}/signer")
        ->assertRedirect();

    $contrat->refresh();
    expect($contrat->signature_client_at)->not->toBeNull();
});

test('POST portal/contrats/{contrat}/signer retourne 403 si la ContratPolicy signer échoue (déjà signé)', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeContrat([
        'statut'              => Contrat::STATUT_PARTIELLEMENT_SIGNE,
        'signature_client_at' => now()->subMinutes(5),  // Déjà signé par le client
        'signature_client_hash' => 'existing-hash',
    ]);

    $this->actingAs($clientUser)
        ->post("/portal/contrats/{$contrat->id}/signer")
        ->assertStatus(403);
});

test('POST portal/contrats/{contrat}/signer redirige vers login pour un visiteur', function () {
    ['contrat' => $contrat] = makeContrat();

    $this->post("/portal/contrats/{$contrat->id}/signer")
        ->assertRedirect(route('login'));
});

// ─── GET /portal/contrats/{contrat}/telecharger ───────────────────────────────

test('GET portal/contrats/{contrat}/telecharger streame le PDF pour le client propriétaire', function () {
    Storage::fake();

    // Créer un faux fichier PDF dans le storage
    Storage::put('contrats/1/brouillon.pdf', '%PDF-1.4 fake pdf content');

    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeContrat([
        'chemin_pdf_brouillon' => 'contrats/1/brouillon.pdf',
    ]);

    $response = $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}/telecharger");

    $response->assertStatus(200);
    expect($response->headers->get('Content-Type'))->toContain('application/pdf');
});

test('GET portal/contrats/{contrat}/telecharger retourne 403 pour un utilisateur tiers', function () {
    Storage::fake();

    $otherUser = User::factory()->create(['type_utilisateur' => 'client']);
    Client::factory()->create(['id_utilisateur' => $otherUser->id]);

    ['contrat' => $contrat] = makeContrat([
        'chemin_pdf_brouillon' => 'contrats/99/brouillon.pdf',
    ]);

    $this->actingAs($otherUser)
        ->get("/portal/contrats/{$contrat->id}/telecharger")
        ->assertStatus(403);
});

test('GET portal/contrats/{contrat}/telecharger retourne 404 si aucun PDF n\'existe', function () {
    Storage::fake(); // Aucun fichier créé

    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeContrat([
        'chemin_pdf_brouillon' => null,
        'chemin_pdf_final'     => null,
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}/telecharger")
        ->assertStatus(404);
});

// ═══════════════════════════════════════════════════════════════════════════════
//  ADMIN — Admin\ContratController
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET /admin/contrats ──────────────────────────────────────────────────────

test('GET /admin/contrats retourne 200 pour un administrateur', function () {
    makeContrat(); // Seed au moins un contrat

    $admin = User::factory()->create(['type_utilisateur' => 'admin']);

    $this->actingAs($admin)
        ->get('/admin/contrats')
        ->assertStatus(200);
});

test('GET /admin/contrats retourne 403 pour un utilisateur non-admin', function () {
    $clientUser = User::factory()->create(['type_utilisateur' => 'client']);
    Client::factory()->create(['id_utilisateur' => $clientUser->id]);

    $this->actingAs($clientUser)
        ->get('/admin/contrats')
        ->assertStatus(403);
});

test('GET /admin/contrats redirige vers login pour un visiteur non authentifié', function () {
    $this->get('/admin/contrats')
        ->assertRedirect(route('login'));
});

// ─── GET /admin/contrats/{contrat} ────────────────────────────────────────────

test('GET /admin/contrats/{contrat} retourne 200 pour un administrateur', function () {
    ['contrat' => $contrat] = makeContrat();

    $admin = User::factory()->create(['type_utilisateur' => 'admin']);

    $this->actingAs($admin)
        ->get("/admin/contrats/{$contrat->id}")
        ->assertStatus(200);
});

test('GET /admin/contrats/{contrat} retourne 403 pour un utilisateur non-admin', function () {
    ['contrat' => $contrat] = makeContrat();

    $artisanUser = User::factory()->create(['type_utilisateur' => 'artisan']);
    Artisan::factory()->create(['id_utilisateur' => $artisanUser->id]);

    $this->actingAs($artisanUser)
        ->get("/admin/contrats/{$contrat->id}")
        ->assertStatus(403);
});
