<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Purchase;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: User can get their purchases
     */
    public function test_user_can_get_their_purchases(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)
            ->getJson('/api/purchases');

        $response->assertStatus(200);
    }

    /**
     * Test: Guest cannot get purchases
     */
    public function test_guest_cannot_get_purchases(): void
    {
        $response = $this->getJson('/api/purchases');

        $response->assertStatus(401);
    }

    /**
     * Test: User can create purchase
     */
    public function test_user_can_create_purchase(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $event = Event::factory()->create();
        $ticketType = TicketType::factory()->create([
            'event_id' => $event->id,
            'quantity_total' => 100,
            'quantity_sold' => 0,
        ]);

        $purchaseData = [
            'event_id' => $event->id,
            'tickets' => [
                [
                    'ticket_type_id' => $ticketType->id,
                    'quantity' => 2,
                ]
            ]
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/purchases', $purchaseData);

        $response->assertStatus(201);
    }

    /**
     * Test: User can pay for purchase
     */
    public function test_user_can_pay_for_purchase(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $event = Event::factory()->create();
        $ticketType = TicketType::factory()->create(['event_id' => $event->id]);
        
        $purchase = Purchase::factory()->create([
            'user_id' => $user->id,
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/purchases/{$purchase->id}/pay");

        $response->assertStatus(200);
    }

    /**
     * Test: User can cancel pending purchase
     */
    public function test_user_can_cancel_pending_purchase(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $event = Event::factory()->create();
        $ticketType = TicketType::factory()->create(['event_id' => $event->id]);
        
        $purchase = Purchase::factory()->create([
            'user_id' => $user->id,
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/purchases/{$purchase->id}/cancel");

        $response->assertStatus(200);
    }

    /**
     * Test: User cannot cancel completed purchase
     */
    public function test_user_cannot_cancel_completed_purchase(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $event = Event::factory()->create();
        $ticketType = TicketType::factory()->create(['event_id' => $event->id]);
        
        $purchase = Purchase::factory()->create([
            'user_id' => $user->id,
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'status' => 'completed',
        ]);

        $response = $this->actingAs($user)
            ->postJson("/api/purchases/{$purchase->id}/cancel");

        $response->assertStatus(400);
    }
}