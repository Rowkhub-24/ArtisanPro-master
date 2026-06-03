<?php
// database/migrations/2026_06_01_000001_create_academie_parcours_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('academie_parcours');
        Schema::create('academie_parcours', function (Blueprint $table) {
            $table->id();
            $table->string('titre', 200);
            $table->text('description')->nullable();
            $table->integer('points_bonus')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academie_parcours');
    }
};
