<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\WaitlistService;

class ProcessWaitlist extends Command
{
    protected $signature = 'process:waitlist';
    protected $description = 'Process expired waitlist reservations and admit next users';

    public function handle(): int
    {
        $this->info('Processing expired reservations...');
        $service = new WaitlistService();
        $service->processExpiredReservations();
        $this->info('Done.');
        return 0;
    }
}
