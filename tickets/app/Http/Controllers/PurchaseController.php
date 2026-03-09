<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Event;
use App\Models\TicketType;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PurchaseController extends Controller
{
    /**
     * Get all purchases for authenticated user
     */
    public function index(Request $request): JsonResponse
    {
        $purchases = Purchase::where('user_id', Auth::id())
            ->with(['event', 'ticketType'])
            ->get();

        return response()->json($purchases);
    }

    /**
     * Get a specific purchase
     */
    public function show(Purchase $purchase): JsonResponse
    {
        if ($purchase->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($purchase->load(['event', 'ticketType']));
    }

    /**
     * Reserve tickets for an event
     */
    public function reserve(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'ticket_type_id' => 'required|exists:ticket_types,id',
            'quantity'       => 'required|integer|min:1|max:10',
        ]);

        $ticketType = TicketType::where('id', $validated['ticket_type_id'])
            ->where('event_id', $event->id)
            ->lockForUpdate()
            ->firstOrFail();

        $available = $ticketType->quantity_total - $ticketType->quantity_sold;
        if ($available < $validated['quantity']) {
            return response()->json(['message' => 'Not enough tickets available'], 400);
        }

        $ticketType->increment('quantity_sold', $validated['quantity']);

        $purchase = Purchase::create([
            'user_id'        => Auth::id(),
            'event_id'       => $event->id,
            'ticket_type_id' => $ticketType->id,
            'quantity'       => $validated['quantity'],
            'unit_price'     => $ticketType->price,
            'total_amount'   => $ticketType->price * $validated['quantity'],
            'status'         => 'pending',
        ]);

        return response()->json($purchase, 201);
    }

    /**
     * Create purchases for multiple ticket types
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'event_id'        => 'required|exists:events,id',
            'tickets'         => 'required|array|min:1',
            'tickets.*.ticket_type_id' => 'required|exists:ticket_types,id',
            'tickets.*.quantity'       => 'required|integer|min:1|max:10',
        ]);

        $userId = Auth::id();
        $eventId = $validated['event_id'];

        try {
            $firstPurchaseId = DB::transaction(function () use ($validated, $userId, $eventId) {
                $firstId = null;

                foreach ($validated['tickets'] as $t) {
                    $ticketType = TicketType::where('id', $t['ticket_type_id'])
                        ->where('event_id', $eventId)
                        ->lockForUpdate()
                        ->firstOrFail();

                    $available = $ticketType->quantity_total - $ticketType->quantity_sold;
                    if ($available < $t['quantity']) {
                        throw new \Exception('Not enough tickets for: ' . $ticketType->name);
                    }

                    $ticketType->increment('quantity_sold', $t['quantity']);

                    $purchase = Purchase::create([
                        'user_id'        => $userId,
                        'event_id'       => $eventId,
                        'ticket_type_id' => $ticketType->id,
                        'quantity'       => $t['quantity'],
                        'unit_price'     => $ticketType->price,
                        'total_amount'   => $ticketType->price * $t['quantity'],
                        'status'         => 'pending',
                    ]);

                    if (!$firstId) {
                        $firstId = $purchase->id;
                    }
                }

                return $firstId;
            });

            return response()->json(['purchase_id' => $firstPurchaseId], 201);
        } catch (\Exception $e) {
            Log::error($e->getMessage());
            return response()->json(['message' => 'Could not create purchase'], 400);
        }
    }

    /**
     * Pay for a purchase
     */
    public function pay(Purchase $purchase): JsonResponse
    {
        if ($purchase->status !== 'pending') {
            return response()->json(['message' => 'Cannot pay for this purchase'], 400);
        }

        $purchase->update(['status' => 'completed']);

        return response()->json($purchase);
    }

    /**
     * Cancel a purchase
     */
    public function cancel(Purchase $purchase): JsonResponse
    {
        if ($purchase->status === 'completed') {
            return response()->json(['message' => 'Cannot cancel a completed purchase'], 400);
        }

        $purchase->update(['status' => 'cancelled']);

        return response()->json($purchase);
    }

    /**
     * Join queue for an event (legacy)
     */
    public function joinQueue(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'ticket_type_id' => 'required|exists:ticket_types,id',
        ]);

        return response()->json(['message' => 'Joined queue'], 200);
    }

    /**
     * Admit next people from queue (admin)
     */
    public function admitNext(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'count' => ['sometimes', 'integer', 'min:1', 'max:2000'],
        ]);

        $count = $validated['count'] ?? 50;
        $admitted = [];

        DB::transaction(function () use ($event, $count, &$admitted) {
            $rows = DB::table('waitlist_entries')
                ->where('event_id', $event->id)
                ->where('status', 'queued')
                ->orderBy('id', 'asc')
                ->limit($count)
                ->lockForUpdate()
                ->get();

            foreach ($rows as $row) {
                $token = \Illuminate\Support\Str::random(32);

                DB::table('waitlist_entries')
                    ->where('id', $row->id)
                    ->update([
                        'status'     => 'admitted',
                        'token'      => $token,
                        'ttl_until'  => null,
                        'updated_at' => now(),
                    ]);

                $admitted[] = ['user_id' => $row->user_id, 'token' => $token];
            }
        });

        return response()->json([
            'message'  => 'Admitted users',
            'event_id' => $event->id,
            'count'    => count($admitted),
            'admitted' => $admitted,
        ]);
    }
}