<?php
// database/migrations/2026_05_12_000001_create_utilisateurs_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('utilisateurs', function (Blueprint $table) {
            $table->id();
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 255)->unique();
            $table->string('telephone', 20)->nullable();
            $table->string('mot_de_passe', 255);
            $table->enum('type_utilisateur', ['client', 'artisan', 'admin']);
            $table->text('adresse')->nullable();
            $table->enum('statut', ['actif', 'suspendu', 'banni'])->default('actif');
            $table->dateTime('date_inscription');
            $table->dateTime('derniere_connexion')->nullable();
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('utilisateurs');
    }
};