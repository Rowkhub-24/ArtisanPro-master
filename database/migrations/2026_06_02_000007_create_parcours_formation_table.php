<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Table may already exist if a previous migration attempt partially ran.
        // Drop and recreate to ensure the FK constraints are correctly applied.
        Schema::dropIfExists('parcours_formation');

        Schema::create('parcours_formation', function (Blueprint $table) {
            $table->unsignedBigInteger('id_parcours');
            $table->unsignedBigInteger('id_formation');
            $table->integer('ordre')->default(0);
            $table->primary(['id_parcours', 'id_formation']);
            $table->foreign('id_parcours')->references('id')->on('academie_parcours')->onDelete('cascade');
            $table->foreign('id_formation')->references('id')->on('academie_formations')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('parcours_formation');
    }
};
