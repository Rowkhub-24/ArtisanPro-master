<?php

namespace App\Jobs;

use App\Services\ScoringService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

/**
 * Recalcule les scores de confiance et badges de tous les artisans actifs.
 *
 * Planifié : chaque nuit à minuit via console.php
 */
class RecalculerScoresArtisans implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Timeout : recalcul peut prendre du temps sur beaucoup d'artisans.
     */
    public int $timeout = 120;

    public function handle(ScoringService $scoring): void
    {
        $scoring->recalculerTous();

        Log::info('RecalculerScoresArtisans : scores recalculés.');
    }
}
