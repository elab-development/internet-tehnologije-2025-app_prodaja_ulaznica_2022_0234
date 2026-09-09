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
use Illuminate\Support\Facades\Log;

class WaitlistEntryController extends Controller
{
    public function join(Request $request, Event $event)
    {
        $user = $request->user();
        $userId = $user->id;
        $eventId = $event->id;

        // SQL Injection safe: koristi parametre preko Eloquent
        $existing = WaitlistEntry::where('event_id', $eventId)
            ->where('user_id', $userId)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Already in waitlist',
                'waitlist_entry' => new WaitlistEntryResource($existing),
            ], 409);
        }

        $entry = WaitlistEntry::create([
            'event_id'  => $eventId,
            'user_id'   => $userId,
            'status'    => 'queued',
            'token'     => null,
            'ttl_until' => null,
        ]);

        // position calculation
        $position = WaitlistEntry::where('event_id', $eventId)
            ->where('status', 'queued')
            ->where('id', '<=', $entry->id)
            ->count();

        return response()->json([
            'message' => 'Joined waitlist',
            'waitlist_entry' => new WaitlistEntryResource($entry),
            'position' => $position,
            'queue_size' => WaitlistEntry::where('event_id', $eventId)->where('status', 'queued')->count(),
        ], 201);
    }

    public function status(Request $request, Event $event)
    {
        $userId = $request->user()->id;
        $eventId = $event->id;

        $entry = WaitlistEntry::where('event_id', $eventId)
            ->where('user_id', $userId)
            ->first();

        if (!$entry) {
            return response()->json(['message' => 'Not in waitlist'], 404);
        }

        $position = WaitlistEntry::where('event_id', $eventId)
            ->where('status', 'queued')
            ->where('id', '<=', $entry->id)
            ->count();

        $reservation = Purchase::where('user_id', $userId)
            ->where('event_id', $eventId)
            ->where('status', 'reserved')
            ->where('reserved_until', '>', Carbon::now())
            ->first();

        return response()->json([
            'waitlist_entry' => new WaitlistEntryResource($entry),
            'position' => $position,
            'queue_size' => WaitlistEntry::where('event_id', $eventId)->where('status', 'queued')->count(),
            'reservation' => $reservation ? [
                'purchase_id' => $reservation->id,
                'expires_at' => optional($reservation->reserved_until)?->toISOString()
            ] : null,
        ]);
    }

    public function leave(Request $request, Event $event)
    {
        $userId = $request->user()->id;
        $eventId = $event->id;

        $entry = WaitlistEntry::where('event_id', $eventId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $entry->delete();

        return response()->json([
            'message' => 'Left waitlist',
        ], 200);
    }

    public function admitNext(Request $request, Event $event)
    {
        $this->authorize('admin');

        $service = new WaitlistService();

        try {
            $result = $service->admitNextForEvent($event);

            if (!$result) {
                return response()->json(['message' => 'No queued users or no tickets available'], 404);
            }

            return response()->json([
                'message' => 'User admitted and reserved a ticket',
                'waitlist_entry' => new WaitlistEntryResource($result['entry']),
                'reservation' => [
                    'purchase_id' => $result['purchase']->id,
                    'expires_at' => $result['purchase']->reserved_until->toISOString()
                ],
                'gate_token' => $result['token'],
            ], 200);
        } catch (\Exception $e) {
            // logovanje za debugging, ne izlagati korisniku raw error
            Log::error($e->getMessage());
            return response()->json(['message' => 'Could not admit user'], 400);
        }
    }

    public function listByEvent(Request $request, Event $event)
    {
        $eventId = $event->id;

        $entries = WaitlistEntry::where('event_id', $eventId)
            ->with(['user'])
            ->orderBy('status')
            ->orderBy('id')
            ->paginate(50);

        return WaitlistEntryResource::collection($entries);
    }
}