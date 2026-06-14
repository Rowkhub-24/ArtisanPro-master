<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('devis_materiels', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('id_devis');
            $table->foreign('id_devis')
                  ->references('id')
                  ->on('devis')
                  ->onDelete('cascade');
            $table->string('nom', 255);
            $table->decimal('quantite', 10, 3);
            $table->string('unite', 50)->default('unité');
            $table->decimal('prix_unitaire', 10, 2)->default(0.00);
            $table->smallInteger('ordre')->default(0);
            $table->timestamps();

            $table->index('id_devis', 'idx_devis_materiels_id_devis');
        });

        Schema::table('devis', function (Blueprint $table) {
            $table->text('notes_artisan')->nullable()->after('statut');
            $table->decimal('sous_total_materiels', 10, 2)->nullable()->default(0.00)->after('notes_artisan');
        });
    }

    public function down(): void
    {
        Schema::table('devis', function (Blueprint $table) {
            $table->dropColumn(['notes_artisan', 'sous_total_materiels']);
        });

        Schema::dropIfExists('devis_materiels');
    }
};
