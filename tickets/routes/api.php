<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\PublicEventsController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\TicketTypeController;
use App\Http\Controllers\SeatSelectionController;
use App\Http\Controllers\WaitlistEntryController;
use App\Models\Event;
use App\Models\User;
use App\Models\Purchase;
use App\Models\TicketType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{event}', [EventController::class, 'show']);
Route::get('/events/{event}/ticket-types', [TicketTypeController::class, 'indexForEvent']);
Route::get('/ticket-types/{ticketType}', [TicketTypeController::class, 'show']);

Route::get('/public/events', [PublicEventsController::class, 'index']);

// Seat selection endpoints
Route::get('/events/{event}/seat-selection/{ticketType}', [SeatSelectionController::class, 'show']);
Route::post('/events/{event}/seat-selection/{ticketType}/reserve', [SeatSelectionController::class, 'reserve'])->middleware('auth:sanctum');

Route::group(['middleware' => ['auth:sanctum']], function () {
    Route::post('/logout', [AuthController::class, 'logout']);

    // Waitlist routes
    Route::post('/events/{event}/waitlist/join', [WaitlistEntryController::class, 'join']);
    Route::get('/events/{event}/waitlist/status', [WaitlistEntryController::class, 'status']);
    Route::delete('/events/{event}/waitlist/leave', [WaitlistEntryController::class, 'leave']);

    // Legacy queue routes (kept for backwards compatibility if needed)
    Route::put('/events/{event}/queue/join',   [PurchaseController::class, 'joinQueue']);
    Route::get('/events/{event}/queue/status', [PurchaseController::class, 'queueStatus']);

    Route::get('/purchases', [PurchaseController::class, 'index']);
    Route::post('/purchases', [PurchaseController::class, 'store']);
    Route::get('/purchases/{purchase}', [PurchaseController::class, 'show']);
    Route::post('/events/{event}/purchases/reserve', [PurchaseController::class, 'reserve']);
    Route::post('/purchases/{purchase}/pay', [PurchaseController::class, 'pay']);
    Route::post('/purchases/{purchase}/cancel', [PurchaseController::class, 'cancel']);
});

/*
|--------------------------------------------------------------------------
| Admin protected routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {

    // Dashboard stats
    Route::get('/stats', function () {
        return response()->json([
            'total_events' => Event::count(),
            'total_users' => User::count(),
            'total_purchases' => Purchase::count(),
            'total_revenue' => Purchase::where('status', 'paid')->sum('total_amount'),
            'pending_purchases' => Purchase::where('status', 'pending')->count(),
            'tickets_sold' => TicketType::sum('quantity_sold'),
        ]);
    });

    // Users list
    Route::get('/users', function () {
        return User::withCount('purchases')->get();
    });

    // Update user role
    Route::put('/users/{user}', function (Request $request, User $user) {
        $user->update($request->only(['role']));
        return response()->json(['message' => 'User updated']);
    });

    Route::resource('events', EventController::class)
        ->only(['store', 'update', 'destroy']);

    Route::post('/events/{event}/ticket-types', [TicketTypeController::class, 'store']);
    Route::put('/ticket-types/{ticketType}', [TicketTypeController::class, 'update']);
    Route::delete('/ticket-types/{ticketType}', [TicketTypeController::class, 'destroy']);

    // Waitlist admin routes
    Route::post('/events/{event}/waitlist/admit-next', [WaitlistEntryController::class, 'admitNext']);
    Route::get('/events/{event}/waitlist/list', [WaitlistEntryController::class, 'listByEvent']);

    // Legacy queue admit (kept for backwards compatibility if needed)
    Route::post('/events/{event}/queue/admit', [PurchaseController::class, 'admitNext']);
});