<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Guard against partial previous run
        Schema::dropIfExists('artisan_parcours');

        Schema::create('artisan_parcours', function (Blueprint $table) {
            $table->unsignedBigInteger('id_artisan');
            $table->unsignedBigInteger('id_parcours');
            $table->dateTime('date_completion')->nullable();
            $table->integer('points_attribues')->default(0);
            $table->primary(['id_artisan', 'id_parcours']);
            $table->foreign('id_artisan')->references('id')->on('artisans')->onDelete('cascade');
            $table->foreign('id_parcours')->references('id')->on('academie_parcours')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('artisan_parcours');
    }
};
