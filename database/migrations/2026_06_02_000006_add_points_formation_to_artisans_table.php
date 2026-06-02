<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artisans', function (Blueprint $table) {
            if (! Schema::hasColumn('artisans', 'points_formation')) {
                $table->integer('points_formation')->default(0)->after('score_confiance');
            }
        });
    }

    public function down(): void
    {
        Schema::table('artisans', function (Blueprint $table) {
            $table->dropColumn('points_formation');
        });
    }
};
