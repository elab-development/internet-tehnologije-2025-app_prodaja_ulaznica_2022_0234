<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = User::where('email', 'admin@tickets.rs')->first();

if ($user) {
    $user->password = Hash::make('admin');
    $user->save();
    echo "✓ Lozinka ažurirana za: admin@tickets.rs\n";
    echo "✓ Nova lozinka: admin\n";
} else {
    echo "✗ Korisnik nije pronađen\n";
}
