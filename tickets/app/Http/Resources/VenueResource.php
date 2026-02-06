<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VenueResource extends JsonResource
{
    public static $wrap = 'venue';

    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'city'        => $this->city,
            'address'     => $this->address,
            'rows'        => (int) $this->rows,
            'columns'     => (int) $this->columns,
            'total_seats' => (int) $this->total_seats,
            'description' => $this->description,
            'seats'       => SeatResource::collection($this->whenLoaded('seats')),
        ];
    }
}