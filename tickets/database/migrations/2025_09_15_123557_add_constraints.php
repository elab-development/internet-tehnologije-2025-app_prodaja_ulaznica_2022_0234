<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void
    {
        $driver = DB::getDriverName();

        // ticket_types: sold <= total ; price >= 0
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE ticket_types
                ADD CONSTRAINT chk_ticket_types_qty
                CHECK (quantity_sold <= quantity_total)');

            DB::statement('ALTER TABLE ticket_types
                ADD CONSTRAINT chk_ticket_types_price_nonneg
                CHECK (price >= 0)');
        }

        // purchases: quantity > 0 ; unit_price >= 0 ; total_amount >= 0
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE purchases
                ADD CONSTRAINT chk_purchases_qty_positive
                CHECK (quantity > 0)');

            DB::statement('ALTER TABLE purchases
                ADD CONSTRAINT chk_purchases_unit_price_nonneg
                CHECK (unit_price >= 0)');

            DB::statement('ALTER TABLE purchases
                ADD CONSTRAINT chk_purchases_total_nonneg
                CHECK (total_amount >= 0)');
        }

        // venues: rows > 0, columns > 0, total_seats > 0
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE venues
                ADD CONSTRAINT chk_venues_rows_positive
                CHECK (rows > 0)');

            DB::statement('ALTER TABLE venues
                ADD CONSTRAINT chk_venues_columns_positive
                CHECK (columns > 0)');

            DB::statement('ALTER TABLE venues
                ADD CONSTRAINT chk_venues_total_positive
                CHECK (total_seats > 0)');
        }

        // seats: price >= 0
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE seats
                ADD CONSTRAINT chk_seats_price_nonneg
                CHECK (price >= 0 OR price IS NULL)');
        }

        // tickets: price >= 0
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE tickets
                ADD CONSTRAINT chk_tickets_price_nonneg
                CHECK (price >= 0)');
        }

        // payments: amount > 0
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE payments
                ADD CONSTRAINT chk_payments_amount_positive
                CHECK (amount > 0)');
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS chk_payments_amount_positive');
            DB::statement('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_tickets_price_nonneg');
            DB::statement('ALTER TABLE seats DROP CONSTRAINT IF EXISTS chk_seats_price_nonneg');
            DB::statement('ALTER TABLE venues DROP CONSTRAINT IF EXISTS chk_venues_total_positive');
            DB::statement('ALTER TABLE venues DROP CONSTRAINT IF EXISTS chk_venues_columns_positive');
            DB::statement('ALTER TABLE venues DROP CONSTRAINT IF EXISTS chk_venues_rows_positive');
            DB::statement('ALTER TABLE purchases DROP CONSTRAINT IF EXISTS chk_purchases_total_nonneg');
            DB::statement('ALTER TABLE purchases DROP CONSTRAINT IF EXISTS chk_purchases_unit_price_nonneg');
            DB::statement('ALTER TABLE purchases DROP CONSTRAINT IF EXISTS chk_purchases_qty_positive');
            DB::statement('ALTER TABLE ticket_types DROP CONSTRAINT IF EXISTS chk_ticket_types_price_nonneg');
            DB::statement('ALTER TABLE ticket_types DROP CONSTRAINT IF EXISTS chk_ticket_types_qty');
        }
    }
};