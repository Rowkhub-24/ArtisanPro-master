<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsLog extends Model
{
    protected $table = 'sms_logs';

    protected $fillable = [
        'recipient',
        'message',
        'status',
        'provider',
        'type',
        'context_id',
        'context_type',
        'response',
        'error_message',
        'attempt',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
        'attempt' => 'integer',
    ];

    // ── Scopes ────────────────────────────────────────────────────────────────

    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    public function scopeFailed($query)
    {
        return $query->where('status', 'failed');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('sent_at', today());
    }

    public function scopeThisMonth($query)
    {
        return $query->whereMonth('sent_at', now()->month)
                     ->whereYear('sent_at', now()->year);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Estimated cost of this SMS in XOF.
     */
    public function getCoutEstimeAttribute(): int
    {
        return (int) config('africastalking.cost_per_sms_xof', 25);
    }

    /**
     * Status badge color for UI display.
     */
    public function getBadgeColorAttribute(): string
    {
        return match ($this->status) {
            'sent'     => 'green',
            'pending'  => 'yellow',
            'retrying' => 'orange',
            'failed'   => 'red',
            default    => 'gray',
        };
    }
}
