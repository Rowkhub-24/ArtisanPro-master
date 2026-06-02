<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sms_logs', function (Blueprint $table) {
            $table->id();
            $table->string('recipient', 30);          // Phone number E.164
            $table->text('message');                   // SMS body
            $table->string('status', 20)->default('pending'); // pending|sent|failed|retrying
            $table->string('provider', 30)->default('africastalking');
            $table->string('type', 50)->default('general'); // general|confirmation|annulation|paiement|litige|inscription|bienvenue
            $table->unsignedBigInteger('context_id')->nullable(); // reservation_id, paiement_id, etc.
            $table->string('context_type', 50)->nullable();       // reservation, paiement, litige
            $table->text('response')->nullable();      // Raw API response (JSON)
            $table->string('error_message')->nullable();
            $table->unsignedTinyInteger('attempt')->default(1);   // Retry count
            $table->timestamp('sent_at')->nullable();
            $table->timestamps();

            $table->index('recipient');
            $table->index('status');
            $table->index('type');
            $table->index('sent_at');
            $table->index(['context_type', 'context_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sms_logs');
    }
};
