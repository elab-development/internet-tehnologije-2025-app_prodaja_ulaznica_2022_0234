<?php

namespace Tests\Feature;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EventTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test: Get all events
     */
    public function test_can_get_all_events(): void
    {
        Event::factory()->count(3)->create();

         $response = $this->getJson('/api/events');

        $response->assertStatus(200);
    }

    /**
     * Test: Get single event
     */
    public function test_can_get_single_event(): void
    {
        $event = Event::factory()->create();

        $response = $this->getJson("/api/events/{$event->id}");

        $response->assertStatus(200);
    }

    /**
     * Test: Create event as admin
     */
    public function test_admin_can_create_event(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        $eventData = [
            'title' => 'Test Concert',
            'slug' => 'test-concert',
            'venue' => 'Test Arena',
            'city' => 'Belgrade',
            'start_at' => '2026-07-15 20:00:00',
        ];

        $response = $this->actingAs($admin)
            ->postJson('/api/events', $eventData);

        $response->assertStatus(201);
    }

    /**
     * Test: Regular user cannot create event
     */
    public function test_user_cannot_create_event(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $eventData = [
            'title' => 'Test Concert',
            'slug' => 'test-concert',
            'venue' => 'Test Arena',
            'city' => 'Belgrade',
            'start_at' => '2026-07-15 20:00:00',
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/events', $eventData);

        $response->assertStatus(403);
    }

    /**
     * Test: Admin can update event
     */
    public function test_admin_can_update_event(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $event = Event::factory()->create();

        $response = $this->actingAs($admin)
            ->putJson("/api/events/{$event->id}", [
                'title' => 'Updated Title'
            ]);

        $response->assertStatus(200);
    }

    /**
     * Test: Admin can delete event
     */
    public function test_admin_can_delete_event(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $event = Event::factory()->create();

        $response = $this->actingAs($admin)
            ->deleteJson("/api/events/{$event->id}");

        $response->assertStatus(200);
    }
}