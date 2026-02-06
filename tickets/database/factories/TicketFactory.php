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
        return [
            'purchase_id'    => null,
            'seat_id'        => null,
            'ticket_type_id' => TicketType::factory(), // will be overridden by create(['ticket_type_id' => $id])
            'status'         => 'available',
            'price'          => $this->faker->randomFloat(2, 500, 10000),
            'qr_code'        => null,
            'ticket_number'  => strtoupper(Str::random(10)),
        ];
    }
}