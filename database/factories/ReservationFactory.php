<?php

namespace Database\Factories;

use App\Models\Artisan;
use App\Models\Client;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReservationFactory extends Factory
{
    protected $model = Reservation::class;

    public function definition(): array
    {
        return [
            'id_client'          => Client::factory(),
            'id_artisan'         => Artisan::factory(),
            'statut'             => $this->faker->randomElement(['en_cours', 'confirmee', 'terminee']),
            'date'               => $this->faker->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
            'date_debut'         => $this->faker->dateTimeBetween('now', '+1 month'),
            'creneau'            => $this->faker->randomElement(['matin', 'apres_midi', 'soir']),
            'description_besoin' => $this->faker->sentence(),
            'montant_total'      => $this->faker->randomFloat(2, 10000, 100000),
            'acompte_verse'      => 0,
            'solde_paye'         => 0,
            'date_creation'      => now(),
        ];
    }

    public function confirmee(): static
    {
        return $this->state(['statut' => 'confirmee']);
    }

    public function terminee(): static
    {
        return $this->state(['statut' => 'terminee']);
    }

    public function enCours(): static
    {
        return $this->state(['statut' => 'en_cours']);
    }
}
