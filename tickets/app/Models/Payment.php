<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'amount',
        'status',
        'payment_method',
        'transaction_id',
        'response_data',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'response_data' => 'array',
    ];

    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }
}