<?php

namespace App\Console\Commands;

use App\Models\Artisan;
use App\Services\ScoringService;
use Illuminate\Console\Command;

class RecalculerScoresArtisans extends Command
{
    protected $signature   = 'artisans:recalculer-scores {--artisan= : ID d\'un artisan spécifique}';
    protected $description = 'Recalcule le score de confiance et le badge de tous les artisans actifs';

    public function handle(ScoringService $scoring): int
    {
        $artisanId = $this->option('artisan');

        if ($artisanId) {
            $artisan = Artisan::find($artisanId);
            if (! $artisan) {
                $this->error("Artisan #{$artisanId} introuvable.");
                return self::FAILURE;
            }
            $this->recalculerArtisan($artisan, $scoring);
            $this->info("Score recalculé pour l'artisan #{$artisanId}.");
            return self::SUCCESS;
        }

        $artisans = Artisan::with(['user', 'portfolioImages', 'certifications'])
            ->whereHas('user', fn ($q) => $q->where('statut', 'actif'))
            ->get();

        $bar = $this->output->createProgressBar($artisans->count());
        $bar->start();

        foreach ($artisans as $artisan) {
            $this->recalculerArtisan($artisan, $scoring);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info("{$artisans->count()} artisans mis à jour.");

        return self::SUCCESS;
    }

    private function recalculerArtisan(Artisan $artisan, ScoringService $scoring): void
    {
        $score = $scoring->calculer($artisan);
        $badge = $scoring->badgeDepuisScore($score);

        // Recalcule aussi la note moyenne (avis non masqués uniquement)
        $noteMoyenne = \App\Models\Avis::where('id_artisan', $artisan->id)
            ->where('masque', false)
            ->avg('note') ?? 0;

        $artisan->update([
            'score_confiance' => $score,
            'note_moyenne'    => round($noteMoyenne, 2),
            'badge'           => $badge,
        ]);
    }
}
