<?php

namespace App\Jobs;

use App\Contracts\PdfGeneratorServiceInterface;
use App\Mail\ContratFinalise;
use App\Models\Contrat;
use App\Services\SmsNotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

/**
 * Job asynchrone déclenché lorsque les deux parties ont signé le contrat.
 *
 * Responsabilités :
 *  - Générer le PDF final via PdfGeneratorService::genererFinal()
 *  - Envoyer l'email avec le PDF en pièce jointe au client et à l'artisan
 *  - Envoyer le SMS de notification via SmsNotificationService::envoyerContratFinalise()
 *  - Mettre à jour contrat.finalise_at = now() et sauvegarder
 *  - Chaque opération est encapsulée dans un try/catch qui logue l'erreur sans lever d'exception
 */
class ContratFinaliseJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Nombre maximum de tentatives avant abandon.
     */
    public int $tries = 3;

    /**
     * Délais de backoff exponentiel entre les tentatives (en secondes).
     *
     * @return array<int>
     */
    public function backoff(): array
    {
        return [30, 60, 120];
    }

    /**
     * Timeout maximum par tentative (secondes).
     */
    public int $timeout = 120;

    public function __construct(
        public readonly Contrat $contrat,
    ) {}

    /**
     * Exécuter le job.
     *
     * Laravel injecte automatiquement PdfGeneratorServiceInterface et
     * SmsNotificationService depuis le conteneur de services.
     * Chaque opération est isolée dans son propre try/catch afin qu'un
     * échec partiel (ex. email) ne bloque pas les opérations suivantes.
     */
    public function handle(
        PdfGeneratorServiceInterface $pdfGenerator,
        SmsNotificationService $smsService,
    ): void {
        Log::info("ContratFinaliseJob : démarrage pour le contrat #{$this->contrat->id}", [
            'contrat_id'     => $this->contrat->id,
            'numero_contrat' => $this->contrat->numero_contrat,
        ]);

        // ── 1. Générer le PDF final ────────────────────────────────────────────
        try {
            $cheminPdfFinal = $pdfGenerator->genererFinal($this->contrat);
            $this->contrat->chemin_pdf_final = $cheminPdfFinal;
            $this->contrat->save();

            Log::info("ContratFinaliseJob : PDF final généré pour le contrat #{$this->contrat->id}", [
                'chemin_pdf_final' => $cheminPdfFinal,
            ]);
        } catch (\Throwable $e) {
            Log::error("ContratFinaliseJob : échec génération PDF final pour le contrat #{$this->contrat->id}", [
                'error' => $e->getMessage(),
            ]);
        }

        // ── 2. Envoyer l'email au client ──────────────────────────────────────
        try {
            $clientUser = $this->contrat->client?->user;
            $clientEmail = $clientUser?->email;

            if ($clientEmail) {
                $mailable = new ContratFinalise($this->contrat);

                // Attacher le PDF final si disponible
                if ($this->contrat->chemin_pdf_final && Storage::exists($this->contrat->chemin_pdf_final)) {
                    $mailable->attach(
                        Storage::path($this->contrat->chemin_pdf_final),
                        [
                            'as'   => "contrat-{$this->contrat->numero_contrat}.pdf",
                            'mime' => 'application/pdf',
                        ]
                    );
                }

                Mail::to($clientEmail)->send($mailable);

                Log::info("ContratFinaliseJob : email envoyé au client pour le contrat #{$this->contrat->id}", [
                    'email' => $clientEmail,
                ]);
            } else {
                Log::warning("ContratFinaliseJob : aucun email client trouvé pour le contrat #{$this->contrat->id}");
            }
        } catch (\Throwable $e) {
            Log::error("ContratFinaliseJob : échec envoi email client pour le contrat #{$this->contrat->id}", [
                'error' => $e->getMessage(),
            ]);
        }

        // ── 3. Envoyer l'email à l'artisan ────────────────────────────────────
        try {
            $artisanUser = $this->contrat->artisan?->user;
            $artisanEmail = $artisanUser?->email;

            if ($artisanEmail) {
                $mailable = new ContratFinalise($this->contrat);

                // Attacher le PDF final si disponible
                if ($this->contrat->chemin_pdf_final && Storage::exists($this->contrat->chemin_pdf_final)) {
                    $mailable->attach(
                        Storage::path($this->contrat->chemin_pdf_final),
                        [
                            'as'   => "contrat-{$this->contrat->numero_contrat}.pdf",
                            'mime' => 'application/pdf',
                        ]
                    );
                }

                Mail::to($artisanEmail)->send($mailable);

                Log::info("ContratFinaliseJob : email envoyé à l'artisan pour le contrat #{$this->contrat->id}", [
                    'email' => $artisanEmail,
                ]);
            } else {
                Log::warning("ContratFinaliseJob : aucun email artisan trouvé pour le contrat #{$this->contrat->id}");
            }
        } catch (\Throwable $e) {
            Log::error("ContratFinaliseJob : échec envoi email artisan pour le contrat #{$this->contrat->id}", [
                'error' => $e->getMessage(),
            ]);
        }

        // ── 4. Envoyer le SMS via SmsNotificationService ──────────────────────
        try {
            $clientUser      = $this->contrat->client?->user;
            $artisanUser     = $this->contrat->artisan?->user;
            $numeroContrat   = $this->contrat->numero_contrat;

            // SMS au client
            if ($clientUser) {
                $smsService->envoyerContratFinalise(
                    $clientUser->telephone ?? '',
                    $numeroContrat,
                    $clientUser,
                );
            }

            // SMS à l'artisan
            if ($artisanUser) {
                $smsService->envoyerContratFinalise(
                    $artisanUser->telephone ?? '',
                    $numeroContrat,
                    $artisanUser,
                );
            }

            Log::info("ContratFinaliseJob : SMS envoyés pour le contrat #{$this->contrat->id}");
        } catch (\Throwable $e) {
            Log::error("ContratFinaliseJob : échec envoi SMS pour le contrat #{$this->contrat->id}", [
                'error' => $e->getMessage(),
            ]);
        }

        // ── 5. Mettre à jour finalise_at ──────────────────────────────────────
        try {
            $this->contrat->finalise_at = now();
            $this->contrat->save();

            Log::info("ContratFinaliseJob : contrat #{$this->contrat->id} finalisé avec succès", [
                'finalise_at' => $this->contrat->finalise_at,
            ]);
        } catch (\Throwable $e) {
            Log::error("ContratFinaliseJob : échec mise à jour finalise_at pour le contrat #{$this->contrat->id}", [
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Appelé lorsque toutes les tentatives ont échoué.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("ContratFinaliseJob : échec définitif après {$this->tries} tentatives pour le contrat #{$this->contrat->id}", [
            'contrat_id' => $this->contrat->id,
            'error'      => $exception->getMessage(),
        ]);
    }
}
