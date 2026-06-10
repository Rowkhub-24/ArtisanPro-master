<?php

namespace App\Contracts;

use App\Models\Contrat;

/**
 * Interface PdfGeneratorServiceInterface
 *
 * Responsable de la génération des fichiers PDF du contrat via
 * barryvdh/laravel-dompdf à partir du template Blade dédié.
 */
interface PdfGeneratorServiceInterface
{
    /**
     * Génère le PDF brouillon du contrat (avant signatures).
     *
     * - Utilise le template Blade `resources/views/pdf/contrat.blade.php`
     *   avec le flag brouillon = true pour afficher le filigrane "À SIGNER".
     * - Stocke le fichier dans `storage/app/contrats/{id_reservation}/brouillon.pdf`.
     * - Crée le répertoire de stockage si inexistant.
     *
     * @param  Contrat  $contrat  Le contrat pour lequel générer le brouillon.
     * @return string             Le chemin relatif du fichier généré (stocké dans chemin_pdf_brouillon).
     */
    public function genererBrouillon(Contrat $contrat): string;

    /**
     * Génère le PDF final du contrat (après les deux signatures).
     *
     * - Utilise le template Blade avec le flag brouillon = false.
     * - Inclut les horodatages de signatures, les empreintes HMAC et les mentions légales.
     * - Stocke le fichier dans `storage/app/contrats/{id_reservation}/final.pdf`.
     * - Crée le répertoire de stockage si inexistant.
     *
     * @param  Contrat  $contrat  Le contrat finalisé (avec les deux signatures).
     * @return string             Le chemin relatif du fichier généré (stocké dans chemin_pdf_final).
     */
    public function genererFinal(Contrat $contrat): string;
}
