<?php

namespace App\Services;

use App\Models\Artisan;
use App\Models\Avis;
use App\Models\Reservation;

/**
 * Service de calcul du score de confiance automatique pour les artisans.
 *
 * Score sur 100 basé sur :
 * - Note moyenne des avis (40 pts)
 * - Taux de complétion des réservations (25 pts)
 * - Ancienneté sur la plateforme (10 pts)
 * - Complétude du profil (15 pts)
 * - Nombre d'avis (10 pts)
 */
class ScoringService
{
    public function calculer(Artisan $artisan): int
    {
        $score = 0;

        // ── 1. Note moyenne des avis (0–40 pts) ──────────────────────────────
        $noteMoyenne = (float) ($artisan->note_moyenne ?? 0);
        $score += (int) round(($noteMoyenne / 5) * 40);

        // ── 2. Taux de complétion des réservations (0–25 pts) ─────────────────
        $totalRes    = Reservation::where('id_artisan', $artisan->id)->count();
        $termineesRes = Reservation::where('id_artisan', $artisan->id)
            ->whereIn('statut', ['terminee', 'termine'])
            ->count();

        if ($totalRes > 0) {
            $tauxCompletion = $termineesRes / $totalRes;
            $score += (int) round($tauxCompletion * 25);
        }

        // ── 3. Ancienneté (0–10 pts) ──────────────────────────────────────────
        $moisAnciennete = $artisan->created_at
            ? (int) $artisan->created_at->diffInMonths(now())
            : 0;
        $score += min(10, (int) ($moisAnciennete / 3)); // 1 pt par 3 mois, max 10

        // ── 4. Complétude du profil (0–15 pts) ────────────────────────────────
        $profilScore = 0;
        if ($artisan->description)       $profilScore += 3;
        if ($artisan->bio)               $profilScore += 2;
        if ($artisan->zone_intervention) $profilScore += 2;
        if ($artisan->tarifs_horaire)    $profilScore += 2;
        if ($artisan->latitude && $artisan->longitude) $profilScore += 2;
        if ($artisan->portfolioImages()->exists())     $profilScore += 2;
        if ($artisan->certifications()->exists())      $profilScore += 2;
        $score += min(15, $profilScore);

        // ── 5. Nombre d'avis (0–10 pts) ───────────────────────────────────────
        $nbAvis = Avis::where('id_artisan', $artisan->id)->count();
        $score += min(10, (int) ($nbAvis / 2)); // 1 pt par 2 avis, max 10

        return min(100, max(0, $score));
    }

    /**
     * Recalcule et met à jour le score + badge de tous les artisans actifs.
     */
    public function recalculerTous(): void
    {
        Artisan::with(['user', 'portfolioImages', 'certifications'])
            ->whereHas('user', fn ($q) => $q->where('statut', 'actif'))
            ->each(function (Artisan $artisan) {
                $score = $this->calculer($artisan);
                $badge = $this->badgeDepuisScore($score);

                // Recalcule aussi la note moyenne
                $noteMoyenne = Avis::where('id_artisan', $artisan->id)->avg('note') ?? 0;

                $artisan->update([
                    'note_moyenne' => round($noteMoyenne, 2),
                    'badge'        => $badge,
                ]);
            });
    }

    /**
     * Détermine le badge automatique selon le score.
     */
    public function badgeDepuisScore(int $score): string
    {
        if ($score >= 80) return 'elite';
        if ($score >= 55) return 'certifie';
        return 'aucun';
    }
}
