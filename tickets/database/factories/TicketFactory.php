<?php

namespace Database\Factories;

use App\Models\Ticket;
use App\Models\TicketType;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    public function definition(): array
    {
        $tt = TicketType::factory()->create();

        return [
            'purchase_id'   => null,
            'seat_id'       => null,
            'ticket_type_id'=> $tt->id,
            'status'        => 'available',
            'price'         => $tt->price,
            'qr_code'       => null,
            'ticket_number' => strtoupper(Str::random(10)),
        ];
    }
}