<?php

namespace App\Http\Controllers;

use App\Models\WaitlistEntry;
use App\Models\Event;
use App\Models\Purchase;
use App\Models\TicketType;
use App\Services\WaitlistService;
use App\Http\Resources\WaitlistEntryResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class WaitlistEntryController extends Controller
{
    /**
     * Join the waitlist for an event
     */
    public function join(Request $request, Event $event)
    {
        $user = $request->user();
        // Check if already in waitlist
        $existing = WaitlistEntry::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Already in waitlist',
                'waitlist_entry' => new WaitlistEntryResource($existing),
            ], 409);
        }

        $entry = WaitlistEntry::create([
            'event_id'  => $event->id,
            'user_id'   => $user->id,
            'status'    => 'queued',
            'token'     => null,
            'ttl_until' => null,
        ]);

        // compute position
        $position = WaitlistEntry::where('event_id', $event->id)
            ->where('status', 'queued')
            ->where('id', '<=', $entry->id)
            ->count();

        return response()->json([
            'message' => 'Joined waitlist',
            'waitlist_entry' => new WaitlistEntryResource($entry),
            'position' => $position,
            'queue_size' => WaitlistEntry::where('event_id', $event->id)->where('status', 'queued')->count(),
        ], 201);
    }

    /**
     * Get waitlist status for a user on an event
     */
    public function status(Request $request, Event $event)
    {
        $user = $request->user();

        $entry = WaitlistEntry::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->first();

        if (!$entry) {
            return response()->json(['message' => 'Not in waitlist'], 404);
        }

        // Calculate position in queue (for context)
        $position = WaitlistEntry::where('event_id', $event->id)
            ->where('status', 'queued')
            ->where('id', '<=', $entry->id)
            ->count();

        // If admitted, check for a reserved purchase
        $reservation = Purchase::where('user_id', $user->id)
            ->where('event_id', $event->id)
            ->where('status', 'reserved')
            ->where('reserved_until', '>', Carbon::now())
            ->first();

        return response()->json([
            'waitlist_entry' => new WaitlistEntryResource($entry),
            'position' => $position,
            'queue_size'     => WaitlistEntry::where('event_id', $event->id)->where('status', 'queued')->count(),
            'reservation' => $reservation ? ['purchase_id' => $reservation->id, 'expires_at' => optional($reservation->reserved_until)?->toISOString()] : null,
        ]);
    }

    /**
     * Leave the waitlist
     */
    public function leave(Request $request, Event $event)
    {
        $user = $request->user();

        $entry = WaitlistEntry::where('event_id', $event->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $entry->delete();

        return response()->json([
            'message' => 'Left waitlist',
        ], 200);
    }

    /**
     * Admit next user from queue (Admin only)
     */
    public function admitNext(Request $request, Event $event)
    {
        $this->authorize('admin'); // ensure admin

        $service = new WaitlistService();
        try {
            $result = $service->admitNextForEvent($event);
            if (!$result) {
                return response()->json(['message' => 'No queued users or no tickets available'], 404);
            }

            return response()->json([
                'message' => 'User admitted and reserved a ticket',
                'waitlist_entry' => new WaitlistEntryResource($result['entry']),
                'reservation' => ['purchase_id' => $result['purchase']->id, 'expires_at' => $result['purchase']->reserved_until->toISOString()],
                'gate_token' => $result['token'],
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }

    /**
     * List all waitlist entries for an event (Admin only)
     */
    public function listByEvent(Request $request, Event $event)
    {
        $this->authorize('admin');

        $entries = WaitlistEntry::where('event_id', $event->id)
            ->with(['user'])
            ->orderBy('status')
            ->orderBy('id')
            ->paginate(50);

        return WaitlistEntryResource::collection($entries);
    }
}
