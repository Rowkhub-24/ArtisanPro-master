<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates the devis_templates table for automatic quote generation per trade.
     * Requirements: 8.3
     */
    public function up(): void
    {
        Schema::create('devis_templates', function (Blueprint $table) {
            $table->id();
            $table->string('metier', 100)->notNull();
            $table->foreignId('categorie_id')
                  ->nullable()
                  ->constrained('categories')
                  ->onDelete('set null');
            $table->text('description_type')->nullable();
            $table->decimal('tarif_base', 10, 2)->notNull()->default(0);
            $table->decimal('tarif_horaire', 10, 2)->notNull()->default(0);
            $table->integer('duree_estimee_min')->notNull()->default(60);
            $table->boolean('materiaux_inclus')->default(false);
            // majoration_urgence must be >= 1.00 (enforced at application layer per Req 3.7)
            $table->decimal('majoration_urgence', 5, 2)->notNull()->default(1.00);
            $table->boolean('actif')->default(true);
            $table->timestamps();

            $table->index('metier');
            $table->index('actif');
        });
    }

    /**
     * Reverse the migrations.
     * Requirements: 8.6
     */
    public function down(): void
    {
        Schema::dropIfExists('devis_templates');
    }
};
