<?php

namespace Database\Factories;

use App\Models\WaitlistEntry;
use App\Models\Event;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use Carbon\Carbon;

class WaitlistEntryFactory extends Factory
{
    protected $model = WaitlistEntry::class;

    public function definition(): array
    {
        return [
            'event_id'  => Event::factory(),
            'user_id'   => User::factory(),
            'status'    => $this->faker->randomElement(['queued', 'admitted', 'expired']),
            'token'     => $this->faker->boolean(70) ? strtoupper(Str::random(32)) : null,
            'ttl_until' => $this->faker->boolean(70) ? Carbon::now()->addHours(2) : null,
        ];
    }

    public function queued()
    {
        return $this->state([
            'status'    => 'queued',
            'token'     => null,
            'ttl_until' => null,
        ]);
    }

    public function admitted()
    {
        return $this->state([
            'status'    => 'admitted',
            'token'     => strtoupper(Str::random(32)),
            'ttl_until' => Carbon::now()->addHours(2),
        ]);
    }
}