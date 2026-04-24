<?php

use App\Models\AllocationCycle;
use App\Models\Employee;
use App\Models\UtilizationSubmission;
use App\Services\LoeWorkbookImportService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Carbon;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('loe:import {path : Absolute path to the workbook} {--cycle= : Cycle name to import into}', function (LoeWorkbookImportService $importer) {
    $path = $this->argument('path');
    $cycle = $this->option('cycle') ?: null;

    $summary = $importer->import($path, $cycle);

    $this->info('LOE workbook imported successfully.');
    $this->table(
        ['Cycle', 'Employees', 'Projects', 'Allocations'],
        [[$summary['cycle'], $summary['employees'], $summary['projects'], $summary['allocations']]],
    );
})->purpose('Import the LOE workbook into the application database');

Artisan::command('loe:send-utilization-reminders {--date= : Optional YYYY-MM-DD date for testing}', function () {
    $runDate = $this->option('date')
        ? Carbon::parse($this->option('date'))
        : now();

    $cycle = AllocationCycle::query()
        ->whereDate('starts_on', '<=', $runDate->toDateString())
        ->whereDate('ends_on', '>=', $runDate->toDateString())
        ->first()
        ?? AllocationCycle::query()->where('is_active', true)->latest('starts_on')->first();

    if (! $cycle) {
        $this->warn('No active cycle found.');

        return;
    }

    if ($runDate->day < 27 || $runDate->greaterThan($cycle->ends_on)) {
        $this->info("No reminders sent on {$runDate->toDateString()}. Reminder window starts on day 27 and ends on {$cycle->ends_on->toDateString()}.");

        return;
    }

    $employees = Employee::query()
        ->where('is_active', true)
        ->with([
            'user',
            'utilizationSubmissions' => fn ($query) => $query->where('cycle_id', $cycle->id),
        ])
        ->get();

    $sent = 0;

    foreach ($employees as $employee) {
        $recipientEmail = $employee->user?->email ?: $employee->email;

        if (! $recipientEmail) {
            continue;
        }

        $submission = $employee->utilizationSubmissions->first();

        if ($submission?->submitted_at) {
            continue;
        }

        if ($submission?->last_reminded_at?->isSameDay($runDate)) {
            continue;
        }

        $screenLink = route('loe.utilization');
        $employeeName = $employee->preferred_name ?: $employee->name;
        $cycleName = $cycle->name;

        Mail::raw(
            "Hi {$employeeName},\n\nThis is a reminder to fill your utilization for {$cycleName}. Please open your utilization screen and log how the month actually landed across your projects.\n\nUtilization screen: {$screenLink}\n\nThis reminder will continue daily from the 27th until the last day of the month until your utilization is submitted.\n\nThanks,\nPixeledge LOE TMS",
            function ($message) use ($recipientEmail, $employeeName, $cycleName) {
                $message
                    ->to($recipientEmail)
                    ->subject("Reminder: submit your utilization for {$cycleName}");
            },
        );

        UtilizationSubmission::query()->updateOrCreate(
            ['employee_id' => $employee->id, 'cycle_id' => $cycle->id],
            [
                'status' => $submission?->status ?? 'blank',
                'submitted_at' => $submission?->submitted_at,
                'last_reminded_at' => $runDate->copy(),
            ],
        );

        $sent++;
    }

    $this->info("Sent {$sent} utilization reminders for {$cycle->name}.");
})->purpose('Send utilization reminder emails from the 27th through the last day of the month');

Schedule::command('loe:send-utilization-reminders')->dailyAt('09:00');
