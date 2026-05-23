<?php
// database/migrations/2026_05_12_000020_create_fournisseur_partenaires_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fournisseur_partenaires', function (Blueprint $table) {
            $table->id();
            $table->string('nom_fournisseur', 200);
            $table->text('description')->nullable();
            $table->string('contact_email', 255);
            $table->string('contact_telephone', 20);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fournisseur_partenaires');
    }
};
