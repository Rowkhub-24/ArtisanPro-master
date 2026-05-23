<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('avis', function (Blueprint $table) {
            $table->foreignId('id_reservation')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('avis', function (Blueprint $table) {
            $table->foreignId('id_reservation')->nullable(false)->change();
        });
    }
};
