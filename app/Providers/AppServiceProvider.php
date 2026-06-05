<?php

namespace App\Providers;

use App\Services\AutomationConfigService;
use App\Services\AutomationEngine;
use App\Services\NotificationService;
use App\Services\SmsNotificationService;
use App\Services\WalletService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind SMS service as singleton so config is loaded once
        $this->app->singleton(SmsNotificationService::class, function ($app) {
            return new SmsNotificationService();
        });

        // Bind WalletService as singleton
        $this->app->singleton(WalletService::class, function ($app) {
            return new WalletService();
        });

        // Bind AutomationEngine as singleton
        $this->app->singleton(AutomationEngine::class, function ($app) {
            return new AutomationEngine(
                $app->make(AutomationConfigService::class),
                $app->make(SmsNotificationService::class),
                $app->make(NotificationService::class),
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
