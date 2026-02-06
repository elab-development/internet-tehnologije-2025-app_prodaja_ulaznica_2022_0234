<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseResource extends JsonResource
{
    public static $wrap = 'purchase';

    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'user_id'        => $this->user_id,
            'event_id'       => $this->event_id,
            'ticket_type_id' => $this->ticket_type_id,
            'quantity'       => (int) $this->quantity,
            'unit_price'     => (float) $this->unit_price,
            'total_amount'   => (float) $this->total_amount,
            'status'         => $this->status,
            'reserved_until' => optional($this->reserved_until)?->toISOString(),
            'created_at'     => optional($this->created_at)?->toISOString(),
            'tickets'        => TicketResource::collection($this->whenLoaded('tickets')),
            'payment'        => new PaymentResource($this->whenLoaded('payment')),
        ];
    }
}