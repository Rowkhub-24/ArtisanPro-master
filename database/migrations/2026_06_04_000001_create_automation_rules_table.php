<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates the automation_rules table for storing configurable automation rules.
     * Requirements: 8.1
     */
    public function up(): void
    {
        Schema::create('automation_rules', function (Blueprint $table) {
            $table->id();
            $table->string('cle', 100)->unique()->notNull();
            $table->json('valeur');
            $table->text('description')->nullable();
            $table->string('categorie', 50)->nullable();
            $table->boolean('actif')->default(true);
            $table->foreignId('modifie_par')
                  ->nullable()
                  ->constrained('utilisateurs')
                  ->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     * Requirements: 8.6
     */
    public function down(): void
    {
        Schema::dropIfExists('automation_rules');
    }
};
