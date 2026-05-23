<?php
// database/migrations/2026_05_12_000026_add_payment_method_to_artisans_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artisans', function (Blueprint $table) {
            $table->enum('payment_method', ['card', 'mobile_money', 'virement'])->nullable()->after('payment_provider');
        });
    }

    public function down(): void
    {
        Schema::table('artisans', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });
    }
};