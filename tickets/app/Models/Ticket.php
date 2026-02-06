<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ticket extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'seat_id',
        'ticket_type_id',
        'status',
        'price',
        'qr_code',
        'ticket_number',
    ];

    protected $casts = [
        'price' => 'decimal:2',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    public function seat()
    {
        return $this->belongsTo(Seat::class);
    }

    public function ticketType()
    {
        return $this->belongsTo(TicketType::class);
    }
}