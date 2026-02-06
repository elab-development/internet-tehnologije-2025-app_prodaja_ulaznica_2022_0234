<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SeatResource extends JsonResource
{
    public static $wrap = 'seat';

    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'venue_id'     => $this->venue_id,
            'seat_number'  => $this->seat_number,
            'row'          => $this->row,
            'column'       => (int) $this->column,
            'status'       => $this->status,
            'price'        => $this->price !== null ? (float) $this->price : null,
            'venue'        => new VenueResource($this->whenLoaded('venue')),
        ];
    }
}