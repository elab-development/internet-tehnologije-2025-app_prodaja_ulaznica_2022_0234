<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Seat;
use App\Models\Ticket;
use App\Models\TicketType;
use App\Models\Purchase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SeatSelectionController extends Controller
{
    // GET /events/{event}/seat-selection/{ticketType}
    public function show(Event $event, TicketType $ticketType)
    {
        if ($ticketType->event_id !== $event->id || !$ticketType->is_active) {
            return response()->json(['error' => 'Ticket type not available'], 422);
        }

        // Get seats directly by event_id
        $seats = Seat::where('event_id', $event->id)
            ->orderBy('row')
            ->orderBy('column')
            ->get();

        // Determine seat status by existing tickets (reserved/sold)
        $ticketStatuses = Ticket::where('ticket_type_id', $ticketType->id)
            ->whereIn('status', ['reserved', 'sold'])
            ->pluck('status', 'seat_id')
            ->toArray();

        $payloadSeats = $seats->map(function($s) use ($ticketStatuses) {
            $status = $ticketStatuses[$s->id] ?? $s->status;
            return [
                'id' => $s->id,
                'seat_number' => $s->seat_number,
                'row' => $s->row,
                'column' => $s->column,
                'status' => $status,
                'price' => $s->price,
            ];
        });

        return response()->json([
            'event_id' => $event->id,
            'event_title' => $event->title,
            'venue' => [
                'id' => $event->id,
                'name' => $event->venue,
                'rows' => $seats->pluck('row')->unique()->count(),
                'columns' => $seats->where('row', $seats->first()->row ?? 'A')->count(),
                'total_seats' => $seats->count(),
            ],
            'seats' => $payloadSeats,
            'ticket_type_id' => $ticketType->id,
            'ticket_type_name' => $ticketType->name,
            'quantity_to_purchase' => 1,
            'unit_price' => (float) $ticketType->price,
        ]);
    }

    // POST /events/{event}/seat-selection/{ticketType}/reserve
    public function reserve(Request $request, Event $event, TicketType $ticketType)
    {
        if (!Auth::check()) {
            return response()->json(['error' => 'Must be logged in'], 403);
        }

        $data = $request->validate([
            'seat_ids' => ['required','array','min:1'],
            'seat_ids.*' => ['integer','distinct'],
            'gate_token' => ['sometimes','string'],
            'ttl_minutes' => ['sometimes','integer','min:2','max:60'],
        ]);

        // Optional gate_token validation using waitlist_entries
        if (!empty($data['gate_token'])) {
            $row = DB::table('waitlist_entries')
                ->where([
                    'event_id' => $event->id,
                    'user_id' => Auth::id(),
                    'token' => $data['gate_token'],
                    'status' => 'admitted'
                ])->first();

            if (!$row) {
                return response()->json(['error' => 'Invalid gate_token'], 403);
            }
        }

        $seatIds = $data['seat_ids'];
        $ttlMinutes = $data['ttl_minutes'] ?? 10;

        DB::beginTransaction();
        try {
            // Lock seats
            $seats = Seat::whereIn('id', $seatIds)
                ->where('event_id', $event->id)
                ->lockForUpdate()
                ->get();

            if (count($seats) !== count($seatIds)) {
                DB::rollBack();
                return response()->json(['error' => 'Some seats not found'], 422);
            }

            foreach ($seats as $s) {
                if ($s->status !== 'available') {
                    DB::rollBack();
                    return response()->json(['error' => "Seat {$s->seat_number} not available"], 422);
                }
            }

            // create purchase
            $purchase = Purchase::create([
                'user_id' => Auth::id(),
                'event_id' => $event->id,
                'ticket_type_id' => $ticketType->id,
                'quantity' => count($seatIds),
                'unit_price' => $ticketType->price,
                'total_amount' => $ticketType->price * count($seatIds),
                'status' => 'pending',
                'reserved_until' => Carbon::now()->addMinutes($ttlMinutes),
            ]);

            // create tickets and mark seats reserved
            foreach ($seats as $s) {
                Ticket::create([
                    'purchase_id' => $purchase->id,
                    'seat_id' => $s->id,
                    'ticket_type_id' => $ticketType->id,
                    'status' => 'reserved',
                    'price' => $s->price ?? $ticketType->price,
                ]);
                $s->update(['status' => 'reserved']);
            }

            DB::commit();

            return response()->json([
                'message' => 'Seats reserved',
                'purchase_id' => $purchase->id,
                'reserved_until' => $purchase->reserved_until,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Reservation failed', 'detail' => $e->getMessage()], 500);
        }
    }
}