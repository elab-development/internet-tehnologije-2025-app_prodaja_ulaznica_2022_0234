<?php

namespace App\Http\Controllers;

use OpenApi\Attributes as OA;

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
        #[OA\Get(
        path: "/api/purchases",
        tags: ["Purchases"],
        summary: "Get all purchases for authenticated user",
        description: "Returns all purchases for the logged-in user",
        responses: [
            new OA\Response(response: 200, description: "List of user purchases"),
            new OA\Response(response: 401, description: "Unauthenticated")
        ]
    )]

    public function index(Request $request): JsonResponse
    {
        $purchases = Purchase::where('user_id', Auth::id())
            ->with(['event', 'ticketType'])
            ->get();

        return response()->json($purchases);
    }

    #[OA\Get(
        path: "/api/purchases/{purchase}",
        tags: ["Purchases"],
        summary: "Get single purchase",
        description: "Returns purchase details for authenticated user",
        parameters: [
            new OA\Parameter(
                name: "purchase",
                in: "path",
                required: true,
                description: "Purchase ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Purchase details"),
            new OA\Response(response: 403, description: "Unauthorized - not your purchase"),
            new OA\Response(response: 404, description: "Purchase not found")
        ]
    )]

    public function show(Purchase $purchase): JsonResponse
    {
        if ($purchase->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($purchase->load(['event', 'ticketType']));
    }

    #[OA\Post(
        path: "/api/events/{event}/purchases/reserve",
        tags: ["Purchases"],
        summary: "Reserve tickets for an event",
        description: "Creates a pending purchase reservation",
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
            required: true,
            content: new OA\JsonContent(
                required: ["ticket_type_id", "quantity"],
                properties: [
                    new OA\Property(property: "ticket_type_id", type: "integer", example: 1),
                    new OA\Property(property: "quantity", type: "integer", example: 2),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Reservation created"),
            new OA\Response(response: 400, description: "Validation error")
        ]
    )]

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

    #[OA\Post(
        path: "/api/purchases",
        tags: ["Purchases"],
        summary: "Create purchase with multiple ticket types",
        description: "Creates purchases for multiple ticket types in a single transaction",
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ["event_id", "tickets"],
                properties: [
                    new OA\Property(property: "event_id", type: "integer", example: 1),
                    new OA\Property(
                        property: "tickets",
                        type: "array",
                        items: new OA\Items(
                            properties: [
                                new OA\Property(property: "ticket_type_id", type: "integer", example: 1),
                                new OA\Property(property: "quantity", type: "integer", example: 2)
                            ]
                        ),
                        example: [
                            ["ticket_type_id" => 1, "quantity" => 2],
                            ["ticket_type_id" => 2, "quantity" => 1]
                        ]
                    ),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 201, description: "Purchases created successfully"),
            new OA\Response(response: 400, description: "Not enough tickets or validation error")
        ]
    )]

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

    #[OA\Post(
        path: "/api/purchases/{purchase}/pay",
        tags: ["Purchases"],
        summary: "Pay for a purchase",
        description: "Marks a pending purchase as completed",
        parameters: [
            new OA\Parameter(
                name: "purchase",
                in: "path",
                required: true,
                description: "Purchase ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Payment successful"),
            new OA\Response(response: 400, description: "Cannot pay for this purchase")
        ]
    )]

    public function pay(Purchase $purchase): JsonResponse
    {
        if ($purchase->status !== 'pending') {
            return response()->json(['message' => 'Cannot pay for this purchase'], 400);
        }

        $purchase->update(['status' => 'completed']);

        return response()->json($purchase);
    }

    #[OA\Post(
        path: "/api/purchases/{purchase}/cancel",
        tags: ["Purchases"],
        summary: "Cancel a purchase",
        description: "Cancels a pending purchase",
        parameters: [
            new OA\Parameter(
                name: "purchase",
                in: "path",
                required: true,
                description: "Purchase ID",
                schema: new OA\Schema(type: "integer")
            )
        ],
        responses: [
            new OA\Response(response: 200, description: "Purchase cancelled"),
            new OA\Response(response: 400, description: "Cannot cancel a completed purchase")
        ]
    )]
    public function cancel(Purchase $purchase): JsonResponse
    {
        if ($purchase->status === 'completed') {
            return response()->json(['message' => 'Cannot cancel a completed purchase'], 400);
        }

        $purchase->update(['status' => 'cancelled']);

        return response()->json($purchase);
    }

    #[OA\Put(
        path: "/api/events/{event}/queue/join",
        tags: ["Queue"],
        summary: "Join queue for an event",
        description: "Adds user to waiting queue (legacy endpoint)",
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
            required: true,
            content: new OA\JsonContent(
                required: ["ticket_type_id"],
                properties: [
                    new OA\Property(property: "ticket_type_id", type: "integer", example: 1),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Joined queue successfully")
        ]
    )]
    public function joinQueue(Request $request, Event $event): JsonResponse
    {
        $validated = $request->validate([
            'ticket_type_id' => 'required|exists:ticket_types,id',
        ]);

        return response()->json(['message' => 'Joined queue'], 200);
    }

    #[OA\Get(
        path: "/api/events/{event}/queue/status",
        tags: ["Queue"],
        summary: "Get queue status",
        description: "Returns user's position in queue (legacy endpoint)",
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
            new OA\Response(response: 200, description: "Queue status")
        ]
    )]

    public function queueStatus(Event $event): JsonResponse
    {
        // Implementation for queue status
        return response()->json(['position' => null], 200);
    }

    #[OA\Post(
        path: "/api/events/{event}/queue/admit",
        tags: ["Queue"],
        summary: "Admit users from queue",
        description: "Admin only - Admits next users from waiting queue",
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
                    new OA\Property(property: "count", type: "integer", example: 50, description: "Number of users to admit (default 50, max 2000)"),
                ]
            )
        ),
        responses: [
            new OA\Response(response: 200, description: "Users admitted successfully"),
            new OA\Response(response: 403, description: "Admin access required")
        ]
    )]
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