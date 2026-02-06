<?php

namespace Database\Factories;

use App\Models\Payment;
use App\Models\Purchase;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    public function definition(): array
    {
        return [
            'purchase_id'    => Purchase::factory(),
            'amount'         => $this->faker->randomFloat(2, 100, 10000),
            'status'         => $this->faker->randomElement(['pending', 'completed', 'failed', 'cancelled']),
            'payment_method' => $this->faker->randomElement(['card', 'bank_transfer']),
            'transaction_id' => strtoupper(Str::random(12)),
            'response_data'  => null,
        ];
    }
}