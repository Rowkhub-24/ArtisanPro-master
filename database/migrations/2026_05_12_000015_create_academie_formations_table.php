<?php
// database/migrations/2026_05_12_000015_create_academie_formations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academie_formations', function (Blueprint $table) {
            $table->id();
            $table->string('titre', 200);
            $table->text('description')->nullable();
            $table->string('url_contenu', 500);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academie_formations');
    }
};