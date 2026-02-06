<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Venue;
use App\Models\Seat;

class VenueSeeder extends Seeder
{
    public function run(): void
    {
        $defs = [
            [
                'name' => 'Štark Arena',
                'city' => 'Beograd',
                'rows' => 20,
                'columns' => 40,
            ],
            [
                'name' => 'SPENS',
                'city' => 'Novi Sad',
                'rows' => 12,
                'columns' => 30,
            ],
            [
                'name' => 'Stadion Rajko Mitić',
                'city' => 'Beograd',
                'rows' => 30,
                'columns' => 100,
            ],
        ];

        foreach ($defs as $d) {
            $venue = Venue::updateOrCreate(
                ['name' => $d['name']],
                [
                    'city' => $d['city'] ?? null,
                    'address' => null,
                    'rows' => $d['rows'],
                    'columns' => $d['columns'],
                    'total_seats' => $d['rows'] * $d['columns'],
                    'description' => null,
                ]
            );

            // create seats if not present (use updateOrCreate to avoid duplicates)
            $rows = $venue->rows;
            $cols = $venue->columns;
            for ($r = 0; $r < $rows; $r++) {
                $rowLetter = chr(65 + ($r % 26)); // A..Z repeating if >26
                for ($c = 1; $c <= $cols; $c++) {
                    $seatNumber = $rowLetter . $c;
                    Seat::updateOrCreate(
                        [
                            'venue_id' => $venue->id,
                            'seat_number' => $seatNumber,
                        ],
                        [
                            'row' => $rowLetter,
                            'column' => $c,
                            'status' => 'available',
                            'price' => null,
                        ]
                    );
                }
            }
        }
    }
}