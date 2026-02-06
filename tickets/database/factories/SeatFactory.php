<?php

namespace Database\Factories;

use App\Models\Seat;
use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;

class SeatFactory extends Factory
{
    protected $model = Seat::class;

    public function definition(): array
    {
        $rowLetter = chr(65 + $this->faker->numberBetween(0, 9)); // A-J
        $column = $this->faker->numberBetween(1, 50);

        return [
            'venue_id'    => Venue::factory(),
            'seat_number' => $rowLetter . $column,
            'row'         => $rowLetter,
            'column'      => $column,
            'status'      => 'available',
            'price'       => null,
        ];
    }
}