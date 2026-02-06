<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ticket;
use App\Models\TicketType;

class TicketSeeder extends Seeder
{
    public function run(): void
    {
        $types = TicketType::all();

        foreach ($types as $type) {
            $existing = Ticket::where('ticket_type_id', $type->id)->count();
            $needed = max(0, (int)$type->quantity_total - $existing);

            if ($needed <= 0) {
                continue;
            }

            Ticket::factory()->count($needed)->create([
                'ticket_type_id' => $type->id,
                'price' => $type->price,
                'status' => 'available',
            ]);
        }
    }
}