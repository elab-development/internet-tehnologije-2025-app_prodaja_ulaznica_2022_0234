<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public static $wrap = 'ticket';

    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'purchase_id'     => $this->purchase_id,
            'seat_id'         => $this->seat_id,
            'seat'            => new SeatResource($this->whenLoaded('seat')),
            'ticket_type_id'  => $this->ticket_type_id,
            'ticket_type'     => new TicketTypeResource($this->whenLoaded('ticketType')),
            'status'          => $this->status,
            'price'           => (float) $this->price,
            'qr_code'         => $this->qr_code,
            'ticket_number'   => $this->ticket_number,
            'created_at'      => optional($this->created_at)?->toISOString(),
        ];
    }
}