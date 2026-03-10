<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;
use App\Http\Resources\TicketTypeResource;
use App\Models\Event;
use App\Models\TicketType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class TicketTypeController extends Controller
{
        #[OA\Get(
        path: "/api/events/{event}/ticket-types",
        tags: ["Ticket Types"],
        summary: "Get ticket types for an event",
        description: "Returns paginated list of ticket types with optional filters",
        parameters: [
            new OA\Parameter(
                name: "event",
                in: "path",
                required: true,
                description: "Event ID",
                schema: new OA\Schema(type: "integer")
            ),
            new OA\Parameter(name: "is_active", in: "query", description: "Filter by active status", schema: new OA\Schema(type: "boolean")),
            new OA\Parameter(name: "category", in: "query", description: "Filter by category", schema: new OA\Schema(type: "string")),
            new OA\Parameter(name: "min_price", in: "query", description: "Minimum price", schema: new OA\Schema(type: "number")),
            new OA\Parameter(name: "max_price", in: "query", description: "Maximum price", schema: new OA\Schema(type: "number")),
            new OA\Parameter(name: "sort_by", in: "query", description: "Sort field", schema: new OA\Schema(type: "string", enum: ["price", "name", "created_at"])),
            new OA\Parameter(name: "sort_dir", in: "query", description: "Sort direction", schema: new OA\Schema(type: "string", enum: ["asc", "desc"])),
            new OA\Parameter(name: "page", in: "query", description: "Page number", schema: new OA\Schema(type: "integer")),
            new OA\Parameter(name: "per_page", in: "query", description: "Items per page", schema: new OA\Schema(type: "integer")),
        ],
        responses: [
            new OA\Response(response: 200, description: "List of ticket types"),
            new OA\Response(response: 404, description: "No ticket types found")
        ]
    )]

    public function indexForEvent(Request $request, Event $event)
    {
        $validated = $request->validate([
            'is_active' => ['sometimes', Rule::in(['0','1',0,1,true,false])],
            'category'  => ['sometimes', 'string', 'max:255'],
            'min_price' => ['sometimes', 'numeric', 'min:0'],
            'max_price' => ['sometimes', 'numeric', 'min:0'],
            'sort_by'   => ['sometimes', Rule::in(['price','name','created_at'])],
            'sort_dir'  => ['sometimes', Rule::in(['asc','desc'])],
            'page'      => ['sometimes', 'integer', 'min:1'],
            'per_page'  => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);

        $sortBy  = $validated['sort_by'] ?? 'price';
        $sortDir = $validated['sort_dir'] ?? 'asc';
        $perPage = $validated['per_page'] ?? 15;

        $query = TicketType::where('event_id', $event->id);

        if (isset($validated['is_active'])) {
            $query->where('is_active', filter_var($validated['is_active'], FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? (int)$validated['is_active']);
        }

        if (!empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        if (!empty($validated['min_price'])) {
            $query->where('price', '>=', $validated['min_price']);
        }

        if (!empty($validated['max_price'])) {
            $query->where('price', '<=', $validated['max_price']);
        }

        $query->orderBy($sortBy, $sortDir);

        $types = $query->paginate($perPage);

        if ($types->isEmpty()) {
            return response()->json(['message' => 'No ticket types found.'], 404);
        }

        return TicketTypeResource::collection($types);
    }

    public function store(Request $request, Event $event)
    {
        if (!Auth::check() || Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Only admins can create ticket types'], 403);
        }

        $validated = $request->validate([
            'name'           => ['required','string','max:255'],
            'category'       => ['nullable','string','max:255'],
            'price'          => ['required','numeric','min:0'],
            'quantity_total' => ['required','integer','min:1'],
            'quantity_sold'  => ['sometimes','integer','min:0'],
            'sales_start_at' => ['nullable','date'],
            'sales_end_at'   => ['nullable','date','after_or_equal:sales_start_at'],
            'is_active'      => ['sometimes','boolean'],
        ]);

        $ticketType = TicketType::create(array_merge($validated, ['event_id' => $event->id]));

        return response()->json([
            'message'     => 'Ticket type created successfully',
            'ticket_type' => new TicketTypeResource($ticketType),
        ], 201);
    }

    #[OA\Get(
        path: "/api/ticket-types/{ticketType}",
        tags: ["Ticket Types"],
        summary: "Get single ticket type",
        description: "Returns ticket type details with event",
        parameters: [
            new OA\Parameter(
                name: "ticketType",
                in: "path",
                required: true,
                description: "Ticket Type ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Ticket type details"),
            new OA\Response(response: 404, description: "Ticket type not found")
        ]
    )]

    public function show(TicketType $ticketType)
    {
        $ticketType->load('event');

        return response()->json([
            'ticket_type' => new TicketTypeResource($ticketType),
        ]);
    }

    #[OA\Put(
        path: "/api/ticket-types/{ticketType}",
        tags: ["Ticket Types"],
        summary: "Update ticket type",
        description: "Admin only - Updates ticket type details",
        parameters: [
            new OA\Parameter(
                name: "ticketType",
                in: "path",
                required: true,
                description: "Ticket Type ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        requestBody: new OA\RequestBody(
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: "name", type: "string"),
                    new OA\Property(property: "category", type: "string"),
                    new OA\Property(property: "price", type: "number"),
                    new OA\Property(property: "quantity_total", type: "integer"),
                    new OA\Property(property: "sales_start_at", type: "string", format: "date-time"),
                    new OA\Property(property: "sales_end_at", type: "string", format: "date-time"),
                    new OA\Property(property: "is_active", type: "boolean"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Ticket type updated successfully"),
            new OA\Response(response: 403, description: "Only admins can update ticket types"),
            new OA\Response(response: 404, description: "Ticket type not found")
        ]
    )]

    public function update(Request $request, TicketType $ticketType)
    {
        if (!Auth::check() || Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Only admins can update ticket types'], 403);
        }

        $validated = $request->validate([
            'name'           => ['sometimes','string','max:255'],
            'category'       => ['sometimes','nullable','string','max:255'],
            'price'          => ['sometimes','numeric','min:0'],
            'quantity_total' => ['sometimes','integer','min:1'],
            // quantity_sold ne otvaramo za update, kontrola je kroz kupovinu
            'sales_start_at' => ['sometimes','nullable','date'],
            'sales_end_at'   => ['sometimes','nullable','date','after_or_equal:sales_start_at'],
            'is_active'      => ['sometimes','boolean'],
        ]);

        $ticketType->update($validated);

        return response()->json([
            'message'     => 'Ticket type updated successfully',
            'ticket_type' => new TicketTypeResource($ticketType),
        ]);
    }

    #[OA\Delete(
        path: "/api/ticket-types/{ticketType}",
        tags: ["Ticket Types"],
        summary: "Delete ticket type",
        description: "Admin only - Deletes a ticket type",
        parameters: [
            new OA\Parameter(
                name: "ticketType",
                in: "path",
                required: true,
                description: "Ticket Type ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Ticket type deleted successfully"),
            new OA\Response(response: 403, description: "Only admins can delete ticket types"),
            new OA\Response(response: 404, description: "Ticket type not found")
        ]
    )]
    
    public function destroy(TicketType $ticketType)
    {
        if (!Auth::check() || Auth::user()->role !== 'admin') {
            return response()->json(['error' => 'Only admins can delete ticket types'], 403);
        }

        $ticketType->delete();

        return response()->json(['message' => 'Ticket type deleted successfully']);
    }
}