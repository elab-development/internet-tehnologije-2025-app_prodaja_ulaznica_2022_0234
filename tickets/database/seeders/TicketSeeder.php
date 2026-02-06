<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ticket;
use App\Models\TicketType;
use Illuminate\Support\Str;

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

            // Kreiraj karte u chunks-ima od 500 da izbegneš memory issues
            $chunks = array_chunk(range(1, $needed), 500);

            foreach ($chunks as $chunk) {
                $tickets = [];
                foreach ($chunk as $i) {
                    $tickets[] = [
                        'purchase_id'    => null,
                        'seat_id'        => null,
                        'ticket_type_id' => $type->id,
                        'status'         => 'available',
                        'price'          => $type->price,
                        'qr_code'        => null,
                        'ticket_number'  => strtoupper(Str::random(10)) . '-' . uniqid(),
                        'created_at'     => now(),
                        'updated_at'     => now(),
                    ];
                }

                // Bulk insert chunk
                Ticket::insert($tickets);
            }
        }
    }
}