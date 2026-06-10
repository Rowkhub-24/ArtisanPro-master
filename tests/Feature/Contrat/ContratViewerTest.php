<?php

/**
 * Tests du composant ContratViewer (tâche 10.2)
 *
 * Vérifie le rendu Inertia de la page `portal/contrat-viewer` et le calcul de
 * `peut_signer` / `role_utilisateur` par le contrôleur pour chaque scénario.
 *
 * Requirements : 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */

use App\Models\Artisan;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

// ─── Helper local ─────────────────────────────────────────────────────────────

/**
 * Crée un contrat complet avec client, artisan et réservation liés.
 *
 * @return array{contrat: Contrat, clientUser: User, artisanUser: User, client: Client, artisan: Artisan}
 */
function makeViewerContrat(array $attrs = []): array
{
    $clientUser  = User::factory()->create(['type_utilisateur' => 'client']);
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
        'numero_contrat'         => 'CP-2025-V' . rand(10000, 99999),
        'nom_client'             => $clientUser->prenom . ' ' . $clientUser->nom,
        'nom_artisan'            => $artisanUser->prenom . ' ' . $artisanUser->nom,
        'description_prestation' => 'Travaux de peinture',
        'montant_total'          => 75000.00,
        'date_debut_prestation'  => now()->addDays(5),
        'adresse_intervention'   => 'Cotonou, Bénin',
        'statut'                 => Contrat::STATUT_GENERE,
        'genere_at'              => now(),
    ], $attrs));

    return compact('contrat', 'clientUser', 'artisanUser', 'client', 'artisan');
}

// ═══════════════════════════════════════════════════════════════════════════════
//  1. Rendu Inertia — page portal/contrat-viewer pour chaque statut
// ═══════════════════════════════════════════════════════════════════════════════

test('rendu Inertia portal/contrat-viewer pour statut genere', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut' => Contrat::STATUT_GENERE,
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('contrat.statut', Contrat::STATUT_GENERE)
        );
});

test('rendu Inertia portal/contrat-viewer pour statut partiellement_signe', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut'               => Contrat::STATUT_PARTIELLEMENT_SIGNE,
        'signature_client_at'  => now()->subMinutes(10),
        'signature_client_hash' => 'hash-client-test',
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('contrat.statut', Contrat::STATUT_PARTIELLEMENT_SIGNE)
        );
});

test('rendu Inertia portal/contrat-viewer pour statut finalise', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut'                => Contrat::STATUT_FINALISE,
        'signature_client_at'   => now()->subMinutes(30),
        'signature_client_hash' => 'hash-client-final',
        'signature_artisan_at'  => now()->subMinutes(20),
        'signature_artisan_hash' => 'hash-artisan-final',
        'finalise_at'           => now()->subMinutes(15),
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('contrat.statut', Contrat::STATUT_FINALISE)
        );
});

test('rendu Inertia portal/contrat-viewer pour statut annule', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut' => Contrat::STATUT_ANNULE,
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('contrat.statut', Contrat::STATUT_ANNULE)
        );
});

// ═══════════════════════════════════════════════════════════════════════════════
//  2. peut_signer = true — client n'a pas encore signé, statut signable
// ═══════════════════════════════════════════════════════════════════════════════

test('peut_signer est true pour le client quand le contrat est genere et non signé', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut'              => Contrat::STATUT_GENERE,
        'signature_client_at' => null,
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('peut_signer', true)
        );
});

test('peut_signer est true pour l artisan quand le contrat est genere et non signé', function () {
    ['contrat' => $contrat, 'artisanUser' => $artisanUser] = makeViewerContrat([
        'statut'               => Contrat::STATUT_GENERE,
        'signature_artisan_at' => null,
    ]);

    $this->actingAs($artisanUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('peut_signer', true)
        );
});

test('peut_signer est true pour le client quand statut est partiellement_signe et client pas encore signé', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut'                => Contrat::STATUT_PARTIELLEMENT_SIGNE,
        // L'artisan a signé, mais pas le client
        'signature_artisan_at'  => now()->subMinutes(10),
        'signature_artisan_hash' => 'hash-artisan',
        'signature_client_at'   => null,
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('peut_signer', true)
        );
});

// ═══════════════════════════════════════════════════════════════════════════════
//  3. peut_signer = false — le client a déjà signé
// ═══════════════════════════════════════════════════════════════════════════════

test('peut_signer est false pour le client qui a déjà signé', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut'               => Contrat::STATUT_PARTIELLEMENT_SIGNE,
        'signature_client_at'  => now()->subMinutes(5),
        'signature_client_hash' => 'hash-client-existant',
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('peut_signer', false)
        );
});

test('peut_signer est false pour l artisan qui a déjà signé', function () {
    ['contrat' => $contrat, 'artisanUser' => $artisanUser] = makeViewerContrat([
        'statut'                => Contrat::STATUT_PARTIELLEMENT_SIGNE,
        'signature_artisan_at'  => now()->subMinutes(5),
        'signature_artisan_hash' => 'hash-artisan-existant',
    ]);

    $this->actingAs($artisanUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('peut_signer', false)
        );
});

// ═══════════════════════════════════════════════════════════════════════════════
//  4. peut_signer = false — contrat finalise
// ═══════════════════════════════════════════════════════════════════════════════

test('peut_signer est false quand le contrat est finalise (client)', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut'                => Contrat::STATUT_FINALISE,
        'signature_client_at'   => now()->subMinutes(30),
        'signature_client_hash' => 'hash-client',
        'signature_artisan_at'  => now()->subMinutes(20),
        'signature_artisan_hash' => 'hash-artisan',
        'finalise_at'           => now()->subMinutes(15),
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('peut_signer', false)
        );
});

test('peut_signer est false quand le contrat est finalise (artisan)', function () {
    ['contrat' => $contrat, 'artisanUser' => $artisanUser] = makeViewerContrat([
        'statut'                => Contrat::STATUT_FINALISE,
        'signature_client_at'   => now()->subMinutes(30),
        'signature_client_hash' => 'hash-client',
        'signature_artisan_at'  => now()->subMinutes(20),
        'signature_artisan_hash' => 'hash-artisan',
        'finalise_at'           => now()->subMinutes(15),
    ]);

    $this->actingAs($artisanUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('peut_signer', false)
        );
});

// ═══════════════════════════════════════════════════════════════════════════════
//  5. peut_signer = false — contrat annule
// ═══════════════════════════════════════════════════════════════════════════════

test('peut_signer est false quand le contrat est annule (client)', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut' => Contrat::STATUT_ANNULE,
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('peut_signer', false)
        );
});

test('peut_signer est false quand le contrat est annule (artisan)', function () {
    ['contrat' => $contrat, 'artisanUser' => $artisanUser] = makeViewerContrat([
        'statut' => Contrat::STATUT_ANNULE,
    ]);

    $this->actingAs($artisanUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('peut_signer', false)
        );
});

// ═══════════════════════════════════════════════════════════════════════════════
//  6. role_utilisateur = 'client' pour un utilisateur client
// ═══════════════════════════════════════════════════════════════════════════════

test("role_utilisateur est 'client' pour le client du contrat", function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat();

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('role_utilisateur', 'client')
        );
});

// ═══════════════════════════════════════════════════════════════════════════════
//  7. role_utilisateur = 'artisan' pour un utilisateur artisan
// ═══════════════════════════════════════════════════════════════════════════════

test("role_utilisateur est 'artisan' pour l'artisan du contrat", function () {
    ['contrat' => $contrat, 'artisanUser' => $artisanUser] = makeViewerContrat();

    $this->actingAs($artisanUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->where('role_utilisateur', 'artisan')
        );
});

// ═══════════════════════════════════════════════════════════════════════════════
//  8. Données du contrat présentes dans les props Inertia
// ═══════════════════════════════════════════════════════════════════════════════

test('les props contrat contiennent les champs essentiels', function () {
    ['contrat' => $contrat, 'clientUser' => $clientUser] = makeViewerContrat([
        'statut' => Contrat::STATUT_GENERE,
    ]);

    $this->actingAs($clientUser)
        ->get("/portal/contrats/{$contrat->id}")
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page
            ->component('portal/contrat-viewer')
            ->has('contrat.id')
            ->has('contrat.numero_contrat')
            ->has('contrat.statut')
            ->has('contrat.nom_client')
            ->has('contrat.nom_artisan')
            ->has('contrat.description_prestation')
            ->has('contrat.montant_total')
            ->has('peut_signer')
            ->has('role_utilisateur')
        );
});
