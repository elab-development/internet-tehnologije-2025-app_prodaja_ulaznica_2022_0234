<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WaitlistEntry;
use App\Models\Event;
use App\Models\User;

class WaitlistEntrySeeder extends Seeder
{
    public function run(): void
    {
        $events = Event::all();
        $users = User::all();

        if ($events->isEmpty() || $users->isEmpty()) {
            return;
        }

        foreach ($events as $event) {
            $sample = $users->shuffle()->take(min(8, $users->count()));

            foreach ($sample as $user) {
                WaitlistEntry::firstOrCreate(
                    [
                        'event_id' => $event->id,
                        'user_id'  => $user->id,
                    ],
                    [
                        'status'    => 'queued',
                        'token'     => null,
                        'ttl_until' => null,
                    ]
                );
            }
        }
    }
}