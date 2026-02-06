<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // events -> venues
        Schema::table('events', function (Blueprint $table) {
            $table->foreign('venue_id')
                ->references('id')->on('venues')
                ->onUpdate('cascade')
                ->onDelete('set null');
        });

        Schema::table('ticket_types', function (Blueprint $table) {
            $table->foreign('event_id')
                ->references('id')->on('events')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')->on('users')
                ->onUpdate('cascade')
                ->onDelete('cascade');

            $table->foreign('event_id')
                ->references('id')->on('events')
                ->onUpdate('cascade')
                ->onDelete('cascade');

            $table->foreign('ticket_type_id')
                ->references('id')->on('ticket_types')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });

        // seats -> venues
        Schema::table('seats', function (Blueprint $table) {
            $table->foreign('venue_id')
                ->references('id')->on('venues')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });

        // tickets -> purchases, seats, ticket_types
        Schema::table('tickets', function (Blueprint $table) {
            $table->foreign('purchase_id')
                ->references('id')->on('purchases')
                ->onUpdate('cascade')
                ->onDelete('set null');

            $table->foreign('seat_id')
                ->references('id')->on('seats')
                ->onUpdate('cascade')
                ->onDelete('set null');

            $table->foreign('ticket_type_id')
                ->references('id')->on('ticket_types')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });

        // payments -> purchases
        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('purchase_id')
                ->references('id')->on('purchases')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['purchase_id']);
        });

        Schema::table('tickets', function (Blueprint $table) {
            $table->dropForeign(['ticket_type_id']);
            $table->dropForeign(['seat_id']);
            $table->dropForeign(['purchase_id']);
        });

        Schema::table('seats', function (Blueprint $table) {
            $table->dropForeign(['venue_id']);
        });

        Schema::table('purchases', function (Blueprint $table) {
            $table->dropForeign(['ticket_type_id']);
            $table->dropForeign(['event_id']);
            $table->dropForeign(['user_id']);
        });

        Schema::table('ticket_types', function (Blueprint $table) {
            $table->dropForeign(['event_id']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropForeign(['venue_id']);
        });
    }
};