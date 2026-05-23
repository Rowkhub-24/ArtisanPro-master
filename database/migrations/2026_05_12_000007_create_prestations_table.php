<?php
// database/migrations/2026_05_12_000007_create_prestations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prestations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_artisan')
                  ->constrained('artisans')
                  ->onDelete('cascade');
            $table->string('titre', 200);
            $table->text('description')->nullable();
            $table->decimal('tarif_min', 10, 2)->nullable();
            $table->decimal('tarif_max', 10, 2)->nullable();
            $table->integer('duree_estimee')->nullable();
            $table->foreignId('id_categorie')
                  ->constrained('categories')
                  ->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prestations');
    }
};