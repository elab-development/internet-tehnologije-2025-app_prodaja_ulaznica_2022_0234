<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public static $wrap = 'payment';

    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'purchase_id'    => $this->purchase_id,
            'amount'         => (float) $this->amount,
            'status'         => $this->status,
            'payment_method' => $this->payment_method,
            'transaction_id' => $this->transaction_id,
            'response_data'  => $this->response_data,
            'created_at'     => optional($this->created_at)?->toISOString(),
        ];
    }
}