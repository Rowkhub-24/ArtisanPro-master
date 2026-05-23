<?php
// database/migrations/2026_05_12_000011_create_avis_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('avis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_client')
                  ->constrained('clients')
                  ->onDelete('cascade');
            $table->foreignId('id_artisan')
                  ->constrained('artisans')
                  ->onDelete('cascade');
            $table->foreignId('id_reservation')
                  ->unique()
                  ->constrained('reservations')
                  ->onDelete('cascade');
            $table->tinyInteger('note')->unsigned()->between(0, 5);
            $table->text('commentaire')->nullable();
            $table->dateTime('date_avis');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('avis');
    }
};