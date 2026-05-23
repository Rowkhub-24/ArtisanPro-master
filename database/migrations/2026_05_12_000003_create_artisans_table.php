<?php
// database/migrations/2026_05_12_000003_create_artisans_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artisans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_utilisateur')
                  ->constrained('utilisateurs')
                  ->onDelete('cascade');
            $table->string('metier', 150);
            $table->text('description')->nullable();
            $table->text('bio')->nullable();
            $table->text('zone_intervention')->nullable();
            $table->decimal('tarifs_horaire', 10, 2)->nullable();
            $table->decimal('note_moyenne', 3, 2)->default(0);
            $table->enum('badge', ['aucun', 'certifie', 'elite'])->default('aucun');
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artisans');
    }
};