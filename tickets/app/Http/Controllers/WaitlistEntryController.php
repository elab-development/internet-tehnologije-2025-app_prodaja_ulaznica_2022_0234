<?php

namespace App\Http\Controllers;

use App\Models\WaitlistEntry;
use App\Models\Event;
use App\Http\Resources\WaitlistEntryResource;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Carbon\Carbon;

class WaitlistEntryController extends Controller
{
    /**
     * Join the waitlist for an event
     */
    public function join(Request $request, Event $event)
    {
        $user = $request->user();

        $request->validate([
            'ticket_type_id' => 'required|exists:ticket_types,id',
        ]);

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

        return response()->json([
            'message' => 'Joined waitlist',
            'waitlist_entry' => new WaitlistEntryResource($entry),
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
            ->firstOrFail();

        // Calculate position in queue (for context)
        $position = WaitlistEntry::where('event_id', $event->id)
            ->where('status', 'queued')
            ->where('id', '<=', $entry->id)
            ->count();

        return response()->json([
            'waitlist_entry' => new WaitlistEntryResource($entry),
            'queue_position' => $position,
            'queue_size'     => WaitlistEntry::where('event_id', $event->id)->where('status', 'queued')->count(),
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
        $this->authorize('admin'); // or your admin gate

        // Get next queued entry
        $entry = WaitlistEntry::where('event_id', $event->id)
            ->where('status', 'queued')
            ->orderBy('id')
            ->firstOrFail();

        $token = strtoupper(Str::random(32));
        $entry->update([
            'status'    => 'admitted',
            'token'     => $token,
            'ttl_until' => Carbon::now()->addHours(2),
        ]);

        return response()->json([
            'message'        => 'User admitted',
            'waitlist_entry' => new WaitlistEntryResource($entry),
            'gate_token'     => $token,
        ], 200);
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