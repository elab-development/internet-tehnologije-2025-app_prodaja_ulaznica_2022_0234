<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Payment;
use App\Models\Purchase;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $purchases = Purchase::where('status', 'completed')->doesntHave('payment')->get();

        foreach ($purchases as $purchase) {
            Payment::factory()->create([
                'purchase_id' => $purchase->id,
                'amount' => $purchase->total_amount,
                'status' => 'completed',
            ]);
        }
    }
}