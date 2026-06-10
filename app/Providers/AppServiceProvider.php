<?php

namespace App\Providers;

use App\Contracts\ContratServiceInterface;
use App\Contracts\PdfGeneratorServiceInterface;
use App\Contracts\SignatureServiceInterface;
use App\Models\Contrat;
use App\Policies\ContratPolicy;
use App\Services\AutomationConfigService;
use App\Services\AutomationEngine;
use App\Services\ContratService;
use App\Services\NotificationService;
use App\Services\PdfGeneratorService;
use App\Services\SignatureService;
use App\Services\SmsNotificationService;
use App\Services\WalletService;
use Illuminate\Support\Facades\Gate;
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

        // Bind PdfGeneratorService
        $this->app->bind(PdfGeneratorServiceInterface::class, function ($app) {
            return new PdfGeneratorService();
        });

        // Bind ContratService — lazily resolved so PdfGeneratorService binding
        // (registered in ContratServiceProvider or later) is available first.
        $this->app->bind(ContratServiceInterface::class, function ($app) {
            return new ContratService(
                $app->make(PdfGeneratorServiceInterface::class),
            );
        });

        // Bind SignatureService
        $this->app->bind(SignatureServiceInterface::class, function ($app) {
            return new SignatureService();
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
        // Register ContratPolicy
        Gate::policy(Contrat::class, ContratPolicy::class);
    }
}
