<?php
// database/migrations/2026_05_12_000009_create_reservations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_client')
                  ->constrained('clients')
                  ->onDelete('cascade');
            $table->foreignId('id_artisan')
                  ->constrained('artisans')
                  ->onDelete('cascade');
            $table->foreignId('id_devis')
                  ->nullable()
                  ->constrained('devis')
                  ->onDelete('set null');
            $table->dateTime('date_debut');
            $table->dateTime('date_fin')->nullable();
            $table->date('date');
            $table->string('creneau', 50)->nullable();
            $table->enum('statut', ['en_cours', 'confirmee', 'terminee', 'annulee', 'litige'])->default('en_cours');
            $table->text('description_besoin')->nullable();
            $table->decimal('montant_total', 10, 2)->nullable();
            $table->decimal('acompte_verse', 10, 2)->default(0);
            $table->decimal('solde_paye', 10, 2)->default(0);
            $table->dateTime('date_creation');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};