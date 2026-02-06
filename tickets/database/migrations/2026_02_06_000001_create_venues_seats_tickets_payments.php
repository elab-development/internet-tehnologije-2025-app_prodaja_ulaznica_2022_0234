<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        // venues
        if (!Schema::hasTable('venues')) {
            Schema::create('venues', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('city')->nullable();
                $table->string('address')->nullable();
                $table->unsignedInteger('rows')->default(0);
                $table->unsignedInteger('columns')->default(0);
                $table->unsignedInteger('total_seats')->default(0);
                $table->text('description')->nullable();
                $table->timestamps();

                $table->index('city');
            });
        }

        // add venue_id to events if missing
        if (!Schema::hasColumn('events', 'venue_id')) {
            Schema::table('events', function (Blueprint $table) {
                $table->unsignedBigInteger('venue_id')->nullable()->after('description');
                $table->index('venue_id');
            });
        }

        // seats
        if (!Schema::hasTable('seats')) {
            Schema::create('seats', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('venue_id');
                $table->string('seat_number');
                $table->string('row');
                $table->unsignedInteger('column');
                $table->enum('status', ['available', 'reserved', 'sold'])->default('available');
                $table->decimal('price', 10, 2)->nullable();
                $table->timestamps();

                $table->unique(['venue_id', 'seat_number']);
                $table->index('venue_id');
                $table->index('status');

                $table->foreign('venue_id')->references('id')->on('venues')->onDelete('cascade');
            });
        } else {
            // ensure foreign key exists (best-effort)
            try {
                DB::statement('ALTER TABLE seats ADD CONSTRAINT fk_seats_venue FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE');
            } catch (\Throwable $e) {
                // ignore if fk exists or cannot add
            }
        }

        // tickets
        if (!Schema::hasTable('tickets')) {
            Schema::create('tickets', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('purchase_id')->nullable();
                $table->unsignedBigInteger('seat_id')->nullable();
                $table->unsignedBigInteger('ticket_type_id');
                $table->enum('status', ['available', 'reserved', 'sold'])->default('available');
                $table->decimal('price', 10, 2);
                $table->string('qr_code')->nullable();
                $table->string('ticket_number')->nullable()->unique();
                $table->timestamps();

                $table->index('purchase_id');
                $table->index('seat_id');
                $table->index('ticket_type_id');
                $table->foreign('seat_id')->references('id')->on('seats')->onDelete('set null');
                $table->foreign('ticket_type_id')->references('id')->on('ticket_types')->onDelete('cascade');
                $table->foreign('purchase_id')->references('id')->on('purchases')->onDelete('set null');
            });
        }

        // payments
        if (!Schema::hasTable('payments')) {
            Schema::create('payments', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('purchase_id');
                $table->decimal('amount', 10, 2);
                $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
                $table->string('payment_method')->nullable();
                $table->string('transaction_id')->nullable()->unique();
                $table->text('response_data')->nullable();
                $table->timestamps();

                $table->foreign('purchase_id')->references('id')->on('purchases')->onDelete('cascade');
                $table->index('purchase_id');
                $table->index('status');
            });
        }
    }

    public function down(): void
    {
        // drop in reverse order if present
        if (Schema::hasTable('payments')) {
            Schema::dropIfExists('payments');
        }

        if (Schema::hasTable('tickets')) {
            Schema::dropIfExists('tickets');
        }

        if (Schema::hasTable('seats')) {
            Schema::dropIfExists('seats');
        }

        // remove venue_id from events if exists
        if (Schema::hasColumn('events', 'venue_id')) {
            Schema::table('events', function (Blueprint $table) {
                // best-effort: drop index first
                try {
                    $table->dropIndex(['venue_id']);
                } catch (\Throwable $e) {}
                $table->dropColumn('venue_id');
            });
        }

        if (Schema::hasTable('venues')) {
            Schema::dropIfExists('venues');
        }
    }
};