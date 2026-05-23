<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallSessionCandidate extends Model
{
    protected $table = 'call_session_candidates';

    protected $fillable = [
        'call_session_id',
        'sender_id',
        'direction',
        'candidate',
    ];

    protected $casts = [
        'candidate' => 'array',
    ];

    public function callSession(): BelongsTo
    {
        return $this->belongsTo(CallSession::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
