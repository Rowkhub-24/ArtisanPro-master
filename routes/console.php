<?php

use App\Jobs\EscaladerLitigesExpires;
use App\Jobs\LibererFondsSequestre;
use App\Jobs\NotifierArtisansInactifs;
use App\Jobs\RecalculerScoresArtisans;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ── Scores & badges ───────────────────────────────────────────────────────────
// Recalcul automatique des scores de confiance chaque nuit à minuit
Schedule::job(new RecalculerScoresArtisans)->daily()->at('00:00');

// ── Litiges ───────────────────────────────────────────────────────────────────
// Escalade automatique des litiges expirés (> 72h sans réponse) — toutes les heures
Schedule::job(new EscaladerLitigesExpires)->hourly();

// ── Paiements séquestre ───────────────────────────────────────────────────────
// Libération automatique des fonds séquestre après 24h de prestation terminée
Schedule::job(new LibererFondsSequestre)->hourly();

// ── Artisans inactifs ─────────────────────────────────────────────────────────
// Notification des artisans sans réservation depuis 60 jours — chaque lundi à 9h
Schedule::job(new NotifierArtisansInactifs)->weeklyOn(1, '09:00');

// ── Commande manuelle (conservée) ────────────────────────────────────────────
Schedule::command('artisans:recalculer-scores')->daily()->at('00:05');
