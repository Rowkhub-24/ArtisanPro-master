<?php
// database/migrations/2026_05_12_000014_create_certifications_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('certifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_artisan')
                  ->constrained('artisans')
                  ->onDelete('cascade');
            $table->string('nom_certification', 200);
            $table->string('organisme_delivrance', 200);
            $table->date('date_obtention');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('certifications');
    }
};