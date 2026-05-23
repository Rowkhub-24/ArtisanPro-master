<?php
// database/migrations/2026_05_12_000024_add_payment_provider_to_paiements_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            if (! Schema::hasColumn('paiements', 'payment_provider')) {
                $table->enum('payment_provider', ['kkiapay', 'fedapay'])->nullable()->after('methode_paiement');
            }
        });
    }

    public function down(): void
    {
        Schema::table('paiements', function (Blueprint $table) {
            if (Schema::hasColumn('paiements', 'payment_provider')) {
                $table->dropColumn('payment_provider');
            }
        });
    }
};