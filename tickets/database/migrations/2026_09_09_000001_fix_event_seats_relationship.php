<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('seats', function (Blueprint $table) {
            $table->unsignedBigInteger('event_id')->nullable()->after('id');
            $table->unsignedBigInteger('venue_id')->nullable()->change();
            $table->index('event_id');
            $table->unique(['event_id', 'seat_number']);
            $table->foreign('event_id')->references('id')->on('events')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('seats', function (Blueprint $table) {
            $table->dropUnique(['event_id', 'seat_number']);
            $table->dropForeign(['event_id']);
            $table->dropIndex(['event_id']);
            $table->dropColumn('event_id');
        });
    }
};
