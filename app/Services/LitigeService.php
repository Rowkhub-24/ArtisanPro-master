<?php

namespace App\Services;

use App\Models\Litige;
use Illuminate\Support\Facades\Log;

/**
 * Service de gestion du cycle de vie des litiges P2.
 *
 * Contraintes métier :
 * - Escalade : automatique uniquement après 72h, jamais manuelle (Q16)
 * - Libération des fonds : toujours possible même si gelés (Q11)
 * - Alerte litiges : uniquement quand count > 10, pas >= 10 (Q17)
 * - Décision : raison obligatoire d'au moins 50 caractères
 */
class LitigeService
{
    /**
     * Ouvre un litige en gelant les fonds associés.
     */
    public function ouvrirLitige(Litige $litige): void
    {
        $litige->fonds_geles = true;
        $litige->save();
    }

    /**
     * Libère les fonds d'un litige, même si ceux-ci sont gelés (Q11).
     * La libération est toujours autorisée quelle que soit l'état du gel.
     */
    public function libererFonds(Litige $litige): void
    {
        $litige->fonds_geles = false;
        $litige->save();
    }

    /**
     * Escalade automatique des litiges expirés (> 72h sans escalade).
     *
     * Trouve tous les litiges ouverts créés il y a plus de 72 heures
     * et non encore escaladés, puis les marque comme escaladés (Q16).
     * Logue une alerte si le nombre total de litiges ouverts est > 10 (Q17).
     *
     * @return int Nombre de litiges escaladés
     */
    public function escaladerLitigesExpires(): int
    {
        $expiration = now()->subHours(72);

        $litigesAEscalader = Litige::where('statut', 'ouvert')
            ->where('escalade', false)
            ->where('created_at', '<', $expiration)
            ->get();

        $count = 0;

        foreach ($litigesAEscalader as $litige) {
            $litige->escalade      = true;
            $litige->date_escalade = now();
            $litige->save();
            $count++;
        }

        // Alerte si le nombre total de litiges ouverts est strictement > 10 (Q17)
        $totalOuverts = Litige::where('statut', 'ouvert')->count();

        if ($totalOuverts > 10) {
            Log::warning('ALERTE LITIGES : Le nombre de litiges ouverts est supérieur à 10.', [
                'total_ouverts' => $totalOuverts,
            ]);
        }

        return $count;
    }

    /**
     * Enregistre la décision administrative sur un litige.
     *
     * @throws \InvalidArgumentException Si la raison fait moins de 50 caractères
     */
    public function decider(Litige $litige, string $raison, string $decision): void
    {
        if (mb_strlen($raison) < 50) {
            throw new \InvalidArgumentException(
                'La raison de la décision doit comporter au moins 50 caractères.'
            );
        }

        $litige->raison_decision = $raison;
        $litige->date_decision   = now();
        $litige->statut          = 'resolu';
        $litige->save();
    }
}
