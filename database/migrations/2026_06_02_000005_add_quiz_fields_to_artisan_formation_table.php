<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add quiz fields to artisan_formation pivot table.
     * Requirements: 10.5
     */
    public function up(): void
    {
        Schema::table('artisan_formation', function (Blueprint $table) {
            $table->tinyInteger('score_quiz')->nullable();
            $table->integer('tentatives')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('artisan_formation', function (Blueprint $table) {
            $table->dropColumn(['score_quiz', 'tentatives']);
        });
    }
};
