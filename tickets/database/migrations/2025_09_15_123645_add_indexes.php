<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

return new class extends Migration {
    public function up(): void
    {
        // events
        try {
            Schema::table('events', function (Blueprint $table) {
                $table->unique('slug', 'events_slug_unique');
                $table->index('start_at', 'events_start_at_idx');
            });
        } catch (\Throwable $e) {
            Log::warning('Skipping events indexes: '.$e->getMessage());
        }

        // ticket_types
        try {
            Schema::table('ticket_types', function (Blueprint $table) {
                $table->index('event_id', 'ticket_types_event_id_idx');
                $table->index('is_active', 'ticket_types_is_active_idx');
                $table->index(['event_id', 'is_active'], 'ticket_types_event_active_idx');
                $table->index(['sales_start_at', 'sales_end_at'], 'ticket_types_sales_window_idx');
            });
        } catch (\Throwable $e) {
            Log::warning('Skipping ticket_types indexes: '.$e->getMessage());
        }

        // purchases
        try {
            Schema::table('purchases', function (Blueprint $table) {
                $table->index(['user_id', 'status', 'created_at'], 'purchases_user_status_created_idx');
                $table->index(['event_id', 'status'], 'purchases_event_status_idx');
                $table->index(['ticket_type_id', 'status'], 'purchases_tickettype_status_idx');
                $table->index('reserved_until', 'purchases_reserved_until_idx');
            });
        } catch (\Throwable $e) {
            Log::warning('Skipping purchases indexes: '.$e->getMessage());
        }

        // users
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->index('role', 'users_role_idx');
            });
        } catch (\Throwable $e) {
            Log::warning('Skipping users indexes: '.$e->getMessage());
        }
    }

    public function down(): void
    {
        // drop only if exists — wrap in try/catch to avoid errors
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex('users_role_idx');
            });
        } catch (\Throwable $e) {
            Log::warning('users_role_idx drop skipped: '.$e->getMessage());
        }

        try {
            Schema::table('purchases', function (Blueprint $table) {
                $table->dropIndex('purchases_reserved_until_idx');
                $table->dropIndex('purchases_tickettype_status_idx');
                $table->dropIndex('purchases_event_status_idx');
                $table->dropIndex('purchases_user_status_created_idx');
            });
        } catch (\Throwable $e) {
            Log::warning('purchases indexes drop skipped: '.$e->getMessage());
        }

        try {
            Schema::table('ticket_types', function (Blueprint $table) {
                $table->dropIndex('ticket_types_sales_window_idx');
                $table->dropIndex('ticket_types_event_active_idx');
                $table->dropIndex('ticket_types_is_active_idx');
                $table->dropIndex('ticket_types_event_id_idx');
            });
        } catch (\Throwable $e) {
            Log::warning('ticket_types indexes drop skipped: '.$e->getMessage());
        }

        try {
            Schema::table('events', function (Blueprint $table) {
                $table->dropIndex('events_start_at_idx');
                $table->dropUnique('events_slug_unique');
            });
        } catch (\Throwable $e) {
            Log::warning('events indexes drop skipped: '.$e->getMessage());
        }
    }
};