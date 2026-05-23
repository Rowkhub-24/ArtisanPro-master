<?php
// database/migrations/2026_05_12_000016_create_artisan_formation_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('artisan_formation', function (Blueprint $table) {
            $table->foreignId('id_artisan')
                  ->constrained('artisans')
                  ->onDelete('cascade');
            $table->foreignId('id_formation')
                  ->constrained('academie_formations')
                  ->onDelete('cascade');
            $table->date('date_achevement')->nullable();
            $table->primary(['id_artisan', 'id_formation']);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artisan_formation');
    }
};