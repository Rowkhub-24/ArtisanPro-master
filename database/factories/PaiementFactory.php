<?php

namespace Database\Factories;

use App\Models\Paiement;
use App\Models\Reservation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaiementFactory extends Factory
{
    protected $model = Paiement::class;

    public function definition(): array
    {
        return [
            'id_reservation'        => Reservation::factory(),
            'id_utilisateur'        => User::factory(),
            'montant'               => $this->faker->randomFloat(2, 1000, 50000),
            'commission'            => $this->faker->randomFloat(2, 100, 5000),
            'type_transaction'      => 'acompte',
            'methode_paiement'      => 'kkiapay',
            'payment_provider'      => 'kkiapay',
            'statut'                => 'reussi',
            'reference_transaction' => 'TXN-' . Str::upper(Str::random(8)),
            'date_paiement'         => now(),
        ];
    }

    public function reussi(): static
    {
        return $this->state(['statut' => 'reussi']);
    }

    public function enAttente(): static
    {
        return $this->state(['statut' => 'en_attente']);
    }
}
