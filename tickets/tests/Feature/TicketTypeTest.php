<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TicketTypeTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Get ticket types for event
     */
    public function test_can_get_ticket_types_for_event(): void
    {
        $event = Event::factory()->create();
        TicketType::factory()->count(3)->create(['event_id' => $event->id]);

        $response = $this->getJson("/api/events/{$event->id}/ticket-types");

        $response->assertStatus(200);
    }

    /**
     * Test: Get single ticket type
     */
    public function test_can_get_single_ticket_type(): void
    {
        $ticketType = TicketType::factory()->create();

        $response = $this->getJson("/api/ticket-types/{$ticketType->id}");

        $response->assertStatus(200);
    }

    /**
     * Test: Admin can create ticket type
     */
    public function test_admin_can_create_ticket_type(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $event = Event::factory()->create();

        $ticketData = [
            'name' => 'VIP',
            'category' => 'vip',
            'price' => 5000,
            'quantity_total' => 100,
        ];

        $response = $this->actingAs($admin)
            ->postJson("/api/events/{$event->id}/ticket-types", $ticketData);

        $response->assertStatus(201);
    }

    /**
     * Test: User cannot create ticket type
     */
    public function test_user_cannot_create_ticket_type(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $event = Event::factory()->create();

        $ticketData = [
            'name' => 'VIP',
            'category' => 'vip',
            'price' => 5000,
            'quantity_total' => 100,
        ];

        $response = $this->actingAs($user)
            ->postJson("/api/events/{$event->id}/ticket-types", $ticketData);

        $response->assertStatus(403);
    }

    /**
     * Test: Admin can update ticket type
     */
    public function test_admin_can_update_ticket_type(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ticketType = TicketType::factory()->create();

        $response = $this->actingAs($admin)
            ->putJson("/api/ticket-types/{$ticketType->id}", [
                'name' => 'Updated VIP',
                'price' => 6000,
            ]);

        $response->assertStatus(200);
    }

    /**
     * Test: Admin can delete ticket type
     */
    public function test_admin_can_delete_ticket_type(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $ticketType = TicketType::factory()->create();

        $response = $this->actingAs($admin)
            ->deleteJson("/api/ticket-types/{$ticketType->id}");

        $response->assertStatus(200);
    }
}