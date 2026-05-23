<?php
// database/migrations/2026_05_12_000023_add_payment_fields_to_artisans_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artisans', function (Blueprint $table) {
            $table->enum('payment_provider', ['kkiapay', 'fedapay'])->nullable()->after('tarifs_horaire');
            $table->string('payment_account_id')->nullable()->after('payment_provider');
            $table->string('payment_account_key')->nullable()->after('payment_account_id');
        });
    }

    public function down(): void
    {
        Schema::table('artisans', function (Blueprint $table) {
            $table->dropColumn(['payment_provider', 'payment_account_id', 'payment_account_key']);
        });
    }
};