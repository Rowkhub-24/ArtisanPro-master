<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CallSession extends Model
{
    protected $table = 'call_sessions';

    protected $fillable = [
        'caller_id',
        'callee_id',
        'type',
        'statut',
        'offer',
        'answer',
    ];

    public function caller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'caller_id');
    }

    public function callee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'callee_id');
    }

    public function candidates(): HasMany
    {
        return $this->hasMany(CallSessionCandidate::class);
    }
}
