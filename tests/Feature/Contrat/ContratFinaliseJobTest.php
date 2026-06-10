<?php

use App\Contracts\PdfGeneratorServiceInterface;
use App\Jobs\ContratFinaliseJob;
use App\Mail\ContratFinalise;
use App\Models\Artisan;
use App\Models\Client;
use App\Models\Contrat;
use App\Models\Reservation;
use App\Models\User;
use App\Services\SmsNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Crée un contrat avec ses relations client et artisan (incluant les utilisateurs).
 */
function creerContratAvecParties(array $contratAttrs = []): Contrat
{
    $clientUser   = User::factory()->create([
        'type_utilisateur'      => 'client',
        'email'                 => 'client@artisanpro.test',
        'telephone'             => '+22991000001',
        'sms_notifications_enabled' => true,
    ]);
    $artisanUser  = User::factory()->create([
        'type_utilisateur'      => 'artisan',
        'email'                 => 'artisan@artisanpro.test',
        'telephone'             => '+22991000002',
        'sms_notifications_enabled' => true,
    ]);

    $client  = Client::factory()->create(['id_utilisateur' => $clientUser->id]);
    $artisan = Artisan::factory()->create(['id_utilisateur' => $artisanUser->id]);

    $reservation = Reservation::factory()->create([
        'id_client'  => $client->id,
        'id_artisan' => $artisan->id,
        'statut'     => 'confirmee',
    ]);

    return Contrat::create(array_merge([
        'id_reservation'        => $reservation->id,
        'id_client'             => $client->id,
        'id_artisan'            => $artisan->id,
        'numero_contrat'        => 'CP-2025-00001',
        'nom_client'            => $clientUser->prenom . ' ' . $clientUser->nom,
        'nom_artisan'           => $artisanUser->prenom . ' ' . $artisanUser->nom,
        'description_prestation'=> 'Travaux de plomberie',
        'montant_total'         => 50000.00,
        'date_debut_prestation' => now()->addDays(7),
        'adresse_intervention'  => 'Cotonou, Bénin',
        'statut'                => Contrat::STATUT_PARTIELLEMENT_SIGNE,
        'signature_client_at'   => now()->subMinutes(10),
        'signature_artisan_at'  => now()->subMinutes(5),
    ], $contratAttrs));
}

// ─── Test 1 : Génération du PDF final ─────────────────────────────────────────

test('le job génère le PDF final et persiste chemin_pdf_final', function () {
    Storage::fake();
    Mail::fake();

    $contrat = creerContratAvecParties();

    // Mock du générateur PDF : simule la création du fichier et retourne le chemin
    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererFinal')
        ->once()
        ->with(\Mockery::on(fn($arg) => $arg->id === $contrat->id))
        ->andReturnUsing(function (Contrat $c) {
            $chemin = "contrats/{$c->id_reservation}/final.pdf";
            Storage::put($chemin, '%PDF-1.4 fake content');
            return $chemin;
        });

    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    $smsMock = \Mockery::mock(SmsNotificationService::class);
    $smsMock->shouldReceive('envoyerContratFinalise')->andReturn(null);
    app()->instance(SmsNotificationService::class, $smsMock);

    $job = new ContratFinaliseJob($contrat);
    $job->handle(
        app(PdfGeneratorServiceInterface::class),
        app(SmsNotificationService::class),
    );

    $contrat->refresh();
    expect($contrat->chemin_pdf_final)->toBe("contrats/{$contrat->id_reservation}/final.pdf");
    Storage::assertExists("contrats/{$contrat->id_reservation}/final.pdf");
});

// ─── Test 2 : Email envoyé au client ──────────────────────────────────────────

test('le job envoie un email au client', function () {
    Storage::fake();
    Mail::fake();

    $contrat = creerContratAvecParties();

    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererFinal')->andReturn("contrats/{$contrat->id_reservation}/final.pdf");
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    $smsMock = \Mockery::mock(SmsNotificationService::class);
    $smsMock->shouldReceive('envoyerContratFinalise')->andReturn(null);
    app()->instance(SmsNotificationService::class, $smsMock);

    $job = new ContratFinaliseJob($contrat);
    $job->handle(
        app(PdfGeneratorServiceInterface::class),
        app(SmsNotificationService::class),
    );

    $clientEmail = $contrat->client->user->email;

    Mail::assertSent(ContratFinalise::class, function (ContratFinalise $mail) use ($clientEmail) {
        return $mail->hasTo($clientEmail);
    });
});

// ─── Test 3 : Email envoyé à l'artisan ────────────────────────────────────────

test("le job envoie un email à l'artisan", function () {
    Storage::fake();
    Mail::fake();

    $contrat = creerContratAvecParties();

    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererFinal')->andReturn("contrats/{$contrat->id_reservation}/final.pdf");
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    $smsMock = \Mockery::mock(SmsNotificationService::class);
    $smsMock->shouldReceive('envoyerContratFinalise')->andReturn(null);
    app()->instance(SmsNotificationService::class, $smsMock);

    $job = new ContratFinaliseJob($contrat);
    $job->handle(
        app(PdfGeneratorServiceInterface::class),
        app(SmsNotificationService::class),
    );

    $artisanEmail = $contrat->artisan->user->email;

    Mail::assertSent(ContratFinalise::class, function (ContratFinalise $mail) use ($artisanEmail) {
        return $mail->hasTo($artisanEmail);
    });
});

// ─── Test 4 : Email envoyé aux deux parties ───────────────────────────────────

test('le job envoie exactement 2 emails (client + artisan)', function () {
    Storage::fake();
    Mail::fake();

    $contrat = creerContratAvecParties();

    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererFinal')->andReturn("contrats/{$contrat->id_reservation}/final.pdf");
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    $smsMock = \Mockery::mock(SmsNotificationService::class);
    $smsMock->shouldReceive('envoyerContratFinalise')->andReturn(null);
    app()->instance(SmsNotificationService::class, $smsMock);

    $job = new ContratFinaliseJob($contrat);
    $job->handle(
        app(PdfGeneratorServiceInterface::class),
        app(SmsNotificationService::class),
    );

    Mail::assertSent(ContratFinalise::class, 2);
});

// ─── Test 5 : finalise_at est renseigné ───────────────────────────────────────

test('le job renseigne finalise_at sur le contrat', function () {
    Storage::fake();
    Mail::fake();

    $contrat = creerContratAvecParties(['finalise_at' => null]);

    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererFinal')->andReturn("contrats/{$contrat->id_reservation}/final.pdf");
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    $smsMock = \Mockery::mock(SmsNotificationService::class);
    $smsMock->shouldReceive('envoyerContratFinalise')->andReturn(null);
    app()->instance(SmsNotificationService::class, $smsMock);

    expect($contrat->finalise_at)->toBeNull();

    $job = new ContratFinaliseJob($contrat);
    $job->handle(
        app(PdfGeneratorServiceInterface::class),
        app(SmsNotificationService::class),
    );

    $contrat->refresh();
    expect($contrat->finalise_at)->not->toBeNull();
});

// ─── Test 6 : Dégradation gracieuse — échec PDF ───────────────────────────────

test("le job ne lève pas d'exception si la génération PDF échoue", function () {
    Storage::fake();
    Mail::fake();

    $contrat = creerContratAvecParties();

    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererFinal')
        ->andThrow(new \RuntimeException('Erreur DomPDF simulée'));
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    $smsMock = \Mockery::mock(SmsNotificationService::class);
    $smsMock->shouldReceive('envoyerContratFinalise')->andReturn(null);
    app()->instance(SmsNotificationService::class, $smsMock);

    $job = new ContratFinaliseJob($contrat);

    // Le job ne doit PAS propager l'exception
    expect(fn() => $job->handle(
        app(PdfGeneratorServiceInterface::class),
        app(SmsNotificationService::class),
    ))->not->toThrow(\Throwable::class);
});

// ─── Test 7 : Dégradation gracieuse — échec email ────────────────────────────

test("le job ne lève pas d'exception si l'envoi d'email échoue", function () {
    Storage::fake();

    $contrat = creerContratAvecParties();

    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererFinal')->andReturn("contrats/{$contrat->id_reservation}/final.pdf");
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    $smsMock = \Mockery::mock(SmsNotificationService::class);
    $smsMock->shouldReceive('envoyerContratFinalise')->andReturn(null);
    app()->instance(SmsNotificationService::class, $smsMock);

    // Simuler une exception lors de l'envoi d'email via Mail::shouldReceive
    Mail::shouldReceive('to')->andThrow(new \RuntimeException('Serveur SMTP indisponible'));

    $job = new ContratFinaliseJob($contrat);

    expect(fn() => $job->handle(
        app(PdfGeneratorServiceInterface::class),
        app(SmsNotificationService::class),
    ))->not->toThrow(\Throwable::class);
});

// ─── Test 8 : SMS envoyé au client et à l'artisan ────────────────────────────

test("le job envoie le SMS de finalisation au client et à l'artisan", function () {
    Storage::fake();
    Mail::fake();

    $contrat = creerContratAvecParties();

    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererFinal')->andReturn("contrats/{$contrat->id_reservation}/final.pdf");
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    $smsMock = \Mockery::mock(SmsNotificationService::class);
    $smsMock->shouldReceive('envoyerContratFinalise')
        ->twice()
        ->with(
            \Mockery::type('string'),
            $contrat->numero_contrat,
            \Mockery::type(User::class),
        );
    app()->instance(SmsNotificationService::class, $smsMock);

    $job = new ContratFinaliseJob($contrat);
    $job->handle(
        app(PdfGeneratorServiceInterface::class),
        app(SmsNotificationService::class),
    );
});

// ─── Test 9 : L'échec d'un email ne bloque pas l'envoi du SMS ────────────────

test("l'échec de l'email client ne bloque pas l'envoi du SMS", function () {
    Storage::fake();

    $contrat = creerContratAvecParties();

    $pdfMock = \Mockery::mock(PdfGeneratorServiceInterface::class);
    $pdfMock->shouldReceive('genererFinal')->andReturn("contrats/{$contrat->id_reservation}/final.pdf");
    app()->instance(PdfGeneratorServiceInterface::class, $pdfMock);

    // Le SMS doit quand même être envoyé (2 fois)
    $smsMock = \Mockery::mock(SmsNotificationService::class);
    $smsMock->shouldReceive('envoyerContratFinalise')->twice();
    app()->instance(SmsNotificationService::class, $smsMock);

    // Mail::to() lève une exception
    Mail::shouldReceive('to')->andThrow(new \RuntimeException('SMTP down'));

    $job = new ContratFinaliseJob($contrat);

    expect(fn() => $job->handle(
        app(PdfGeneratorServiceInterface::class),
        app(SmsNotificationService::class),
    ))->not->toThrow(\Throwable::class);
});
