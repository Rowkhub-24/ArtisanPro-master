<?php
// database/migrations/2026_05_12_000008_create_devis_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_client')
                  ->constrained('clients')
                  ->onDelete('cascade');
            $table->foreignId('id_artisan')
                  ->constrained('artisans')
                  ->onDelete('cascade');
            $table->text('description_travaux');
            $table->json('photos')->nullable();
            $table->dateTime('date_demande');
            $table->dateTime('date_reponse')->nullable();
            $table->decimal('montant_propose', 10, 2)->nullable();
            $table->enum('statut', ['en_attente', 'accepte', 'refuse', 'contre_offre'])->default('en_attente');
            $table->dateTime('date_acceptation')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('devis');
    }
};