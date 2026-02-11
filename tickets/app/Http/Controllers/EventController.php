<?php

namespace App\Http\Controllers;

use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\Seat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class EventController extends Controller
{

    public function index(Request $request)
    {
        $validated = $request->validate([
            'q'         => ['sometimes', 'string', 'max:255'],
            'city'      => ['sometimes', 'string', 'max:255'],
            'date_from' => ['sometimes', 'date_format:Y-m-d'],
            'date_to'   => ['sometimes', 'date_format:Y-m-d'],
            'sort_by'   => ['sometimes', Rule::in(['title', 'start_at', 'created_at'])],
            'sort_dir'  => ['sometimes', Rule::in(['asc', 'desc'])],
            'page'      => ['sometimes', 'integer', 'min:1'],
            'per_page'  => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $sortBy  = $validated['sort_by'] ?? 'start_at';
        $sortDir = $validated['sort_dir'] ?? 'asc';
        $perPage = $validated['per_page'] ?? 15;

        $query = Event::query();

        // search
        if (!empty($validated['q'])) {
            $q = $validated['q'];
            $query->where(function ($w) use ($q) {
                $w->where('title', 'like', "%{$q}%")
                    ->orWhere('description', 'like', "%{$q}%")
                    ->orWhere('venue', 'like', "%{$q}%")
                    ->orWhere('city', 'like', "%{$q}%");
            });
        }

        // filter: city
        if (!empty($validated['city'])) {
            $query->where('city', $validated['city']);
        }

        // filter: date range po start_at
        if (!empty($validated['date_from'])) {
            $query->whereDate('start_at', '>=', $validated['date_from']);
        }
        if (!empty($validated['date_to'])) {
            $query->whereDate('start_at', '<=', $validated['date_to']);
        }

        // sort
        $query->orderBy($sortBy, $sortDir);

        $events = $query->withCount('ticketTypes')->paginate($perPage);

        if ($events->isEmpty()) {
            return response()->json('No events found.', 404);
        }

        return EventResource::collection($events);
    }


    public function store(Request $request)
{
    if (!Auth::check() || Auth::user()->role !== 'admin') {
        return response()->json(['error' => 'Only admins can create events'], 403);
    }

    $validated = $request->validate([
        'title'       => ['required', 'string', 'max:255'],
        'slug'        => ['required', 'string', 'max:255', 'unique:events,slug'],
        'description' => ['nullable', 'string'],
        'venue'       => ['required', 'string', 'max:255'],
        'city'        => ['nullable', 'string', 'max:255'],
        'start_at'    => ['required', 'date'],
        'end_at'      => ['nullable', 'date', 'after_or_equal:start_at'],
        'rows'        => ['sometimes', 'integer', 'min:1', 'max:26'],
        'columns'     => ['sometimes', 'integer', 'min:1', 'max:50'],
    ]);

    $rows = $validated['rows'] ?? 10;
    $columns = $validated['columns'] ?? 10;

    // 1. Create Event
    $event = Event::create([
        'title'       => $validated['title'],
        'slug'        => $validated['slug'],
        'description' => $validated['description'] ?? null,
        'venue'       => $validated['venue'],
        'city'        => $validated['city'] ?? null,
        'start_at'    => $validated['start_at'],
        'end_at'      => $validated['end_at'] ?? null,
    ]);

    // 2. Create Seats for the event
    try {
    $rowLetters = range('A', 'Z');
    for ($r = 0; $r < $rows; $r++) {
        $rowLetter = $rowLetters[$r];
        for ($c = 1; $c <= $columns; $c++) {
            Seat::create([
                'event_id'    => $event->id,
                'venue_id'    => null,
                'seat_number' => $rowLetter . $c,
                'row'         => $rowLetter,
                'column'      => $c,
                'status'      => 'available',
                'price'       => null,
            ]);
        }
    }
        } catch (\Exception $e) {
         return response()->json([
           'message' => 'Event created but seats failed',
          'error' => $e->getMessage(),
          'event' => new EventResource($event),
         ], 201);
}

    return response()->json([
        'message' => 'Event created successfully',
        'event'   => new EventResource($event),
    ], 201);
}



    public function show(Event $event)
    {
        $event->load('ticketTypes');

        
        return new EventResource($event);
    }

    public function update(Request $request, Event $event)
    {
        if (!Auth::check() || Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Only admins can update events'], 403);
        }

        $validated = $request->validate([
            'title'       => ['sometimes', 'string', 'max:255'],
            'slug'        => ['sometimes', 'string', 'max:255', Rule::unique('events', 'slug')->ignore($event->id)],
            'description' => ['sometimes', 'nullable', 'string'],
            'venue'       => ['sometimes', 'string', 'max:255'],
            'city'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'start_at'    => ['sometimes', 'date'],
            'end_at'      => ['sometimes', 'nullable', 'date', 'after_or_equal:start_at'],
        ]);

        $event->update($validated);

        return response()->json([
            'message' => 'Event updated successfully',
            'event'   => new EventResource($event),
        ]);
    }


    public function destroy(Event $event)
    {
        if (!Auth::check() || Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Only admins can delete events'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }
}