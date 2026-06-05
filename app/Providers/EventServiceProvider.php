<?php

namespace App\Providers;

use App\Events\ArtisanValide;
use App\Events\PaiementValide;
use App\Events\ReservationAnnulee;
use App\Events\ReservationConfirmee;
use App\Events\ReservationCreee;
use App\Events\ReservationTerminee;
use App\Events\UserRegistered;
use App\Listeners\EnvoyerSmsAnnulation;
use App\Listeners\EnvoyerSmsArtisanValide;
use App\Listeners\EnvoyerSmsConfirmationReservation;
use App\Listeners\EnvoyerSmsInscription;
use App\Listeners\EnvoyerSmsMissionTerminee;
use App\Listeners\EnvoyerSmsNouvelleReservation;
use App\Listeners\EnvoyerSmsPaiement;
use App\Listeners\ReservationAutoAcceptListener;
use Illuminate\Auth\Events\Registered;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /**
     * Event → Listener mappings.
     *
     * All SMS listeners implement ShouldQueue and are dispatched
     * on the 'sms' queue so they never block HTTP responses.
     */
    protected $listen = [
        // Laravel built-in Registered event (from RegisteredUserController)
        Registered::class => [
            // handled by Laravel's SendEmailVerificationNotification automatically
        ],

        // ArtisanPro custom events
        UserRegistered::class => [
            EnvoyerSmsInscription::class,
        ],

        ReservationCreee::class => [
            EnvoyerSmsNouvelleReservation::class,
            ReservationAutoAcceptListener::class,
        ],

        ReservationConfirmee::class => [
            EnvoyerSmsConfirmationReservation::class,
        ],

        ReservationAnnulee::class => [
            EnvoyerSmsAnnulation::class,
        ],

        ReservationTerminee::class => [
            EnvoyerSmsMissionTerminee::class,
        ],

        PaiementValide::class => [
            EnvoyerSmsPaiement::class,
        ],

        ArtisanValide::class => [
            EnvoyerSmsArtisanValide::class,
        ],
    ];

    public function boot(): void {}

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
