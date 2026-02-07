<?php

namespace App\Services;

use App\Models\Event;
use App\Models\WaitlistEntry;
use App\Models\Purchase;
use App\Models\TicketType;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WaitlistService
{
    /**
     * Admit next for a specific event. Returns array with purchase and entry.
     */
    public function admitNextForEvent(Event $event)
    {
        return DB::transaction(function () use ($event) {
            $entry = WaitlistEntry::where('event_id', $event->id)
                ->where('status', 'queued')
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

            if (!$entry) {
                return null;
            }

            $ticketType = TicketType::where('event_id', $event->id)
                ->whereRaw('quantity_total - quantity_sold > 0')
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (!$ticketType) {
                // no tickets available
                return null;
            }

            $ticketType->quantity_sold = $ticketType->quantity_sold + 1;
            $ticketType->save();

            // Reserve 1 ticket per admit (user can add more during checkout up to 10)
            $purchase = Purchase::create([
                'user_id' => $entry->user_id,
                'event_id' => $event->id,
                'ticket_type_id' => $ticketType->id,
                'quantity' => 1,
                'unit_price' => $ticketType->price,
                'total_amount' => $ticketType->price,
                'status' => 'reserved',
                'reserved_until' => Carbon::now()->addMinutes(15),
            ]);

            $token = strtoupper(bin2hex(random_bytes(16)));
            $entry->update([
                'status' => 'admitted',
                'token' => $token,
                'ttl_until' => Carbon::now()->addMinutes(15),
            ]);

            return ['entry' => $entry, 'purchase' => $purchase, 'token' => $token];
        });
    }

    /**
     * Process expired reservations: release reserved purchases past reserved_until,
     * mark associated waitlist entries expired and admit next queued users.
     */
    public function processExpiredReservations()
    {
        // find expired reserved purchases
        $now = Carbon::now();

        $expired = Purchase::where('status', 'reserved')
            ->whereNotNull('reserved_until')
            ->where('reserved_until', '<', $now)
            ->get();

        foreach ($expired as $purchase) {
            DB::transaction(function () use ($purchase, $now) {
                // mark purchase cancelled/expired
                $purchase->update(['status' => 'cancelled']);

                // release ticket count
                $tt = TicketType::where('id', $purchase->ticket_type_id)->lockForUpdate()->first();
                if ($tt) {
                    $tt->quantity_sold = max(0, $tt->quantity_sold - $purchase->quantity);
                    $tt->save();
                }

                // mark waitlist entry expired for this user/event if present
                $entry = WaitlistEntry::where('event_id', $purchase->event_id)
                    ->where('user_id', $purchase->user_id)
                    ->where('status', 'admitted')
                    ->first();

                if ($entry) {
                    $entry->update(['status' => 'expired']);
                }

                // try to admit next in queue for this event
                $this->admitNextForEvent($purchase->event);
            });
        }
    }
}
