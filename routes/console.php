<?php

use App\Console\Commands\RecalculerScoresArtisans;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Recalcul automatique des scores de confiance chaque nuit à 2h
Schedule::command(RecalculerScoresArtisans::class)->dailyAt('02:00');
