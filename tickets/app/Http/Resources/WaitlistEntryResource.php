<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WaitlistEntryResource extends JsonResource
{
    public static $wrap = 'waitlist_entry';

    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'event_id'   => $this->event_id,
            'user_id'    => $this->user_id,
            'status'     => $this->status,
            'token'      => $this->token,
            'ttl_until'  => optional($this->ttl_until)?->toISOString(),
            'position'   => $this->position, // computed property (optional)
            'event'      => new EventResource($this->whenLoaded('event')),
            'user'       => new UserResource($this->whenLoaded('user')),
        ];
    }
}