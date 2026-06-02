<?php

namespace App\Providers;

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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
