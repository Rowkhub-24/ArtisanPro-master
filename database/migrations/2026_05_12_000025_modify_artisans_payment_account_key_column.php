<?php
// database/migrations/2026_05_12_000025_modify_artisans_payment_account_key_column.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('artisans', function (Blueprint $table) {
            $table->text('payment_account_key')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('artisans', function (Blueprint $table) {
            $table->string('payment_account_key', 255)->nullable()->change();
        });
    }
};