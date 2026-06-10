<?php

namespace App\Services;

use App\Contracts\PdfGeneratorServiceInterface;
use App\Models\Contrat;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * PdfGeneratorService
 *
 * Génère les PDFs brouillon et final des contrats de prestation en utilisant
 * barryvdh/laravel-dompdf et le template Blade `resources/views/pdf/contrat.blade.php`.
 */
class PdfGeneratorService implements PdfGeneratorServiceInterface
{
    /**
     * Génère le PDF brouillon du contrat (avant signatures).
     *
     * Rend le template Blade avec `$brouillon = true` (filigrane "À SIGNER"),
     * stocke le fichier dans `storage/app/contrats/{id_reservation}/brouillon.pdf`
     * et retourne le chemin relatif.
     *
     * @param  Contrat  $contrat  Le contrat pour lequel générer le brouillon.
     * @return string             Le chemin relatif du fichier généré.
     */
    public function genererBrouillon(Contrat $contrat): string
    {
        $cheminRelatif = "contrats/{$contrat->id_reservation}/brouillon.pdf";

        $this->genererEtSauvegarder($contrat, $cheminRelatif, brouillon: true);

        return $cheminRelatif;
    }

    /**
     * Génère le PDF final du contrat (après les deux signatures).
     *
     * Rend le template Blade avec `$brouillon = false` (inclut horodatages,
     * empreintes HMAC et mentions légales), stocke le fichier dans
     * `storage/app/contrats/{id_reservation}/final.pdf` et retourne le chemin relatif.
     *
     * @param  Contrat  $contrat  Le contrat finalisé (avec les deux signatures).
     * @return string             Le chemin relatif du fichier généré.
     */
    public function genererFinal(Contrat $contrat): string
    {
        $cheminRelatif = "contrats/{$contrat->id_reservation}/final.pdf";

        $this->genererEtSauvegarder($contrat, $cheminRelatif, brouillon: false);

        return $cheminRelatif;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Méthodes privées
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Rend le template Blade en PDF et le sauvegarde dans le storage local.
     *
     * @param  Contrat  $contrat        Le contrat à rendre.
     * @param  string   $cheminRelatif  Chemin relatif dans storage/app/ (ex. "contrats/42/brouillon.pdf").
     * @param  bool     $brouillon      Passe le flag au template Blade pour le filigrane et les mentions légales.
     */
    private function genererEtSauvegarder(Contrat $contrat, string $cheminRelatif, bool $brouillon): void
    {
        // Créer le répertoire parent si nécessaire
        $repertoire = dirname($cheminRelatif);
        if (! Storage::exists($repertoire)) {
            Storage::makeDirectory($repertoire);
        }

        // Générer le contenu PDF depuis le template Blade
        $pdf = Pdf::loadView('pdf.contrat', [
            'contrat'   => $contrat,
            'brouillon' => $brouillon,
        ]);

        $pdf->setPaper('A4', 'portrait');

        // Sauvegarder via le disque local de Storage (storage/app/)
        $contenuPdf = $pdf->output();

        Storage::put($cheminRelatif, $contenuPdf);

        Log::info('PdfGeneratorService: PDF généré', [
            'contrat_id'     => $contrat->id,
            'id_reservation' => $contrat->id_reservation,
            'chemin'         => $cheminRelatif,
            'brouillon'      => $brouillon,
        ]);
    }
}
