<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // venues - NOVO
        Schema::create('venues', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('city')->nullable();
            $table->string('address')->nullable();
            $table->unsignedInteger('rows')->default(1);
            $table->unsignedInteger('columns')->default(1);
            $table->unsignedInteger('total_seats')->default(0);
            $table->text('description')->nullable();
            $table->timestamps();
            
            $table->index('city');
        });

        // events - IZMENJENO: dodaj venue_id
        Schema::create('events', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->unsignedBigInteger('venue_id')->nullable(); // NOVO
            $table->string('venue')->nullable(); // Ostavi za backward compatibility
            $table->string('city')->nullable();
            $table->dateTime('start_at');
            $table->dateTime('end_at')->nullable();
            $table->timestamps();
            
            $table->unique('slug');
            $table->index('start_at');
            $table->index('venue_id'); // NOVO
        });

        // ticket_types
        Schema::create('ticket_types', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('event_id');
            $table->string('name');
            $table->string('category')->nullable();
            $table->decimal('price', 10, 2);
            $table->unsignedInteger('quantity_total');
            $table->unsignedInteger('quantity_sold')->default(0);
            $table->dateTime('sales_start_at')->nullable();
            $table->dateTime('sales_end_at')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->index('event_id');
            $table->index('is_active');
            $table->index(['event_id', 'is_active']);
            $table->index(['sales_start_at', 'sales_end_at']);
        });

        // purchases - IZMENJENO: status ima AWAITING_PAYMENT
        Schema::create('purchases', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('event_id');
            $table->unsignedBigInteger('ticket_type_id');
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price', 10, 2);
            $table->decimal('total_amount', 10, 2);
            $table->enum('status', ['pending', 'awaiting_payment', 'paid', 'cancelled', 'expired'])->default('pending');
            $table->dateTime('reserved_until')->nullable();
            $table->timestamps();
            
            $table->index(['user_id', 'status', 'created_at']);
            $table->index(['event_id', 'status']);
            $table->index(['ticket_type_id', 'status']);
            $table->index('reserved_until');
        });

        // seats - NOVO
        Schema::create('seats', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('venue_id');
            $table->string('seat_number'); // A1, A2, B1, etc.
            $table->string('row'); // A, B, C...
            $table->unsignedInteger('column'); // 1, 2, 3...
            $table->enum('status', ['available', 'reserved', 'sold'])->default('available');
            $table->decimal('price', 10, 2)->nullable();
            $table->timestamps();
            
            $table->unique(['venue_id', 'seat_number']);
            $table->index('venue_id');
            $table->index('status');
            $table->index(['venue_id', 'status']);
        });

        // tickets - NOVO
        Schema::create('tickets', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_id')->nullable(); // nullable jer ticket može biti kreiran pre nego kupovina
            $table->unsignedBigInteger('seat_id')->nullable();
            $table->unsignedBigInteger('ticket_type_id');
            $table->enum('status', ['available', 'reserved', 'sold'])->default('available');
            $table->decimal('price', 10, 2);
            $table->string('qr_code')->nullable();
            $table->string('ticket_number')->unique()->nullable();
            $table->timestamps();
            
            $table->index('purchase_id');
            $table->index('seat_id');
            $table->index('status');
            $table->index(['purchase_id', 'status']);
        });

        // payments - NOVO
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('purchase_id');
            $table->decimal('amount', 10, 2);
            $table->enum('status', ['pending', 'completed', 'failed', 'cancelled'])->default('pending');
            $table->string('payment_method')->nullable(); // credit_card, debit_card, etc.
            $table->string('transaction_id')->nullable()->unique();
            $table->text('response_data')->nullable(); // JSON sa odgovora
            $table->timestamps();
            
            $table->index('purchase_id');
            $table->index('status');
            $table->index(['purchase_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('seats');
        Schema::dropIfExists('purchases');
        Schema::dropIfExists('ticket_types');
        Schema::dropIfExists('events');
        Schema::dropIfExists('venues');
    }
};