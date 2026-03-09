<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

use App\Http\Resources\EventResource;
use App\Models\Event;
use App\Models\Seat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;



class EventController extends Controller
{
       #[OA\Get(
        path: "/api/events",
        tags: ["Events"],
        summary: "Get all events",
        description: "Returns paginated list of events with optional filters",
        parameters: [
            new OA\Parameter(name: "q", in: "query", description: "Search query", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "city", in: "query", description: "Filter by city", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "date_from", in: "query", description: "Start date (Y-m-d)", schema: new OA\Schema(type: "string", format: "date")),
            new OA\Parameter(name: "date_to", in: "query", description: "End date (Y-m-d)", schema: new OA\Schema(type: "string", format: "date")),
            new OA\Parameter(name: "sort_by", in: "query", description: "Sort field", schema: new OA\Schema(type: "string", enum: ["title", "start_at", "created_at"])),
            new OA\Parameter(name: "sort_dir", in: "query", description: "Sort direction", schema: new OA\Schema(type: "string", enum: ["asc", "desc"])),
            new OA\Parameter(name: "page", in: "query", description: "Page number", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "per_page", in: "query", description: "Items per page", schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "List of events"),
            new OA\Response(response: 404, description: "No events found")
        ]
    )]

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

    #[OA\Post(
        path: "/api/events",
        tags: ["Events"],
        summary: "Create new event",
        description: "Admin only - Creates a new event with seats",
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["title", "slug", "venue", "start_at"],
                properties: [
                    new OA\Property(property: "title", type: "string", example: "Summer Concert"),
                    new OA\Property(property: "slug", type: "string", example: "summer-concert-2026"),
                    new OA\Property(property: "description", type: "string", example: "Amazing summer concert"),
                    new OA\Property(property: "venue", type: "string", example: "Arena Belgrade"),
                    new OA\Property(property: "city", type: "string", example: "Belgrade"),
                    new OA\Property(property: "start_at", type: "string", format: "date-time", example: "2026-07-15 20:00:00"),
                    new OA\Property(property: "end_at", type: "string", format: "date-time", example: "2026-07-15 23:00:00"),
                    new OA\Property(property: "rows", type: "integer", example: 10),
                    new OA\Property(property: "columns", type: "integer", example: 10),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Event created successfully"),
            new OA\Response(response: 403, description: "Only admins can create events")
        ]
    )]


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

    #[OA\Get(
        path: "/api/events/{event}",
        tags: ["Events"],
        summary: "Get single event",
        description: "Returns event details with ticket types",
        parameters: [
            new OA\Parameter(
                name: "event",
                in: "path",
                required: true,
                description: "Event ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Event details"),
            new OA\Response(response: 404, description: "Event not found")
        ]
    )]

    public function show(Event $event)
    {
        $event->load('ticketTypes');

        
        return new EventResource($event);
    }

    #[OA\Put(
        path: "/api/events/{event}",
        tags: ["Events"],
        summary: "Update event",
        description: "Admin only - Updates event details",
        parameters: [
            new OA\Parameter(
                name: "event",
                in: "path",
                required: true,
                description: "Event ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "title", type: "string"),
                    new OA\Property(property: "slug", type: "string"),
                    new OA\Property(property: "description", type: "string"),
                    new OA\Property(property: "venue", type: "string"),
                    new OA\Property(property: "city", type: "string"),
                    new OA\Property(property: "start_at", type: "string", format: "date-time"),
                    new OA\Property(property: "end_at", type: "string", format: "date-time"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Event updated successfully"),
            new OA\Response(response: 403, description: "Only admins can update events"),
            new OA\Response(response: 404, description: "Event not found")
        ]
    )]

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
    
    #[OA\Delete(
        path: "/api/events/{event}",
        tags: ["Events"],
        summary: "Delete event",
        description: "Admin only - Deletes an event",
        parameters: [
            new OA\Parameter(
                name: "event",
                in: "path",
                required: true,
                description: "Event ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Event deleted successfully"),
            new OA\Response(response: 403, description: "Only admins can delete events"),
            new OA\Response(response: 404, description: "Event not found")
        ]
    )]

    public function destroy(Event $event)
    {
        if (!Auth::check() || Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Only admins can delete events'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Event deleted successfully']);
    }
}