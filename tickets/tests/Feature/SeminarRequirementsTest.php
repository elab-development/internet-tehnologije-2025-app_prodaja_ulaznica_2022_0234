<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\Purchase;
use App\Models\TicketType;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeminarRequirementsTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_create_event(): void
    {
        $response = $this->postJson('/api/events', [
            'title' => 'New event',
            'slug' => 'new-event',
            'venue' => 'Arena',
            'start_at' => now()->addWeek()->toDateTimeString(),
        ]);

        $response->assertStatus(401);
    }

    public function test_regular_user_cannot_create_event(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/events', [
            'title' => 'New event',
            'slug' => 'new-event',
            'venue' => 'Arena',
            'start_at' => now()->addWeek()->toDateTimeString(),
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_create_event_with_seats(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/events', [
            'title' => 'New event',
            'slug' => 'new-event',
            'venue' => 'Arena',
            'start_at' => now()->addWeek()->toDateTimeString(),
            'rows' => 2,
            'columns' => 3,
        ]);

        $response->assertCreated();
        $this->assertDatabaseCount('seats', 6);
        $this->assertDatabaseHas('seats', ['event_id' => Event::first()->id, 'seat_number' => 'A1']);
    }

    public function test_user_cannot_pay_another_users_purchase(): void
    {
        $owner = User::factory()->create();
        $otherUser = User::factory()->create();
        $event = Event::factory()->create();
        $ticketType = TicketType::factory()->create([
            'event_id' => $event->id,
            'quantity_total' => 10,
            'quantity_sold' => 1,
        ]);
        $purchase = Purchase::factory()->create([
            'user_id' => $owner->id,
            'event_id' => $event->id,
            'ticket_type_id' => $ticketType->id,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($otherUser, 'sanctum')->postJson("/api/purchases/{$purchase->id}/pay");

        $response->assertForbidden();
        $this->assertDatabaseHas('purchases', ['id' => $purchase->id, 'status' => 'pending']);
    }

    public function test_contact_form_returns_validation_response(): void
    {
        $response = $this->postJson('/api/contact', [
            'name' => 'Pera Peric',
            'email' => 'pera@example.com',
            'message' => 'Hello',
        ]);

        $response->assertStatus(202)->assertJsonPath('data.email', 'pera@example.com');
    }
}
