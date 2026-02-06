<?php

namespace Database\Factories;

use App\Models\Venue;
use Illuminate\Database\Eloquent\Factories\Factory;

class VenueFactory extends Factory
{
    protected $model = Venue::class;

    public function definition(): array
    {
        $rows = $this->faker->numberBetween(1, 20);
        $columns = $this->faker->numberBetween(5, 50);

        return [
            'name'        => $this->faker->company . ' Hall',
            'city'        => $this->faker->city,
            'address'     => $this->faker->address,
            'rows'        => $rows,
            'columns'     => $columns,
            'total_seats' => $rows * $columns,
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}