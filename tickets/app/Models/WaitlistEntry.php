<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaitlistEntry extends Model
{
    use HasFactory;

    protected $table = 'waitlist_entries';

    protected $fillable = [
        'event_id',
        'user_id',
        'status',
        'token',
        'ttl_until',
    ];

    protected $casts = [
        'ttl_until' => 'datetime',
    ];

    public function event()
    {
        return $this->belongsTo(Event::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}