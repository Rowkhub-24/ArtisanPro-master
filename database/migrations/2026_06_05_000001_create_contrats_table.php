<?php
// database/migrations/2026_06_05_000001_create_contrats_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contrats', function (Blueprint $table) {
            $table->id();

            // Références aux entités liées
            $table->foreignId('id_reservation')
                  ->unique()
                  ->constrained('reservations')
                  ->onDelete('restrict');

            $table->foreignId('id_client')
                  ->constrained('clients')
                  ->onDelete('restrict');

            $table->foreignId('id_artisan')
                  ->constrained('artisans')
                  ->onDelete('restrict');

            // Données du contrat (snapshot au moment de la génération)
            $table->string('numero_contrat', 30)->unique();          // CP-2025-00001
            $table->string('nom_client', 255);
            $table->string('nom_artisan', 255);
            $table->text('description_prestation');
            $table->decimal('montant_total', 12, 2);
            $table->dateTime('date_debut_prestation');
            $table->dateTime('date_fin_prestation')->nullable();
            $table->text('adresse_intervention')->nullable();

            // Statut du cycle de vie
            $table->enum('statut', [
                'genere',
                'en_attente_signatures',
                'partiellement_signe',
                'finalise',
                'annule',
            ])->default('genere');

            // Signatures électroniques
            $table->dateTime('signature_client_at')->nullable();
            $table->string('signature_client_hash', 128)->nullable();   // HMAC-SHA256
            $table->dateTime('signature_artisan_at')->nullable();
            $table->string('signature_artisan_hash', 128)->nullable();  // HMAC-SHA256

            // Fichiers PDF
            $table->string('chemin_pdf_brouillon', 500)->nullable();
            $table->string('chemin_pdf_final', 500)->nullable();

            // Clauses de litige (JSON pour flexibilité)
            $table->json('clauses_litige')->nullable();

            // Audit
            $table->timestamp('genere_at')->nullable();
            $table->timestamp('finalise_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contrats');
    }
};
