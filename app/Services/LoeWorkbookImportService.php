<?php

namespace App\Services;

use App\Models\Allocation;
use App\Models\AllocationCycle;
use App\Models\AllocationReview;
use App\Models\Employee;
use App\Models\Project;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\Process\Exception\ProcessFailedException;
use Symfony\Component\Process\Process;

class LoeWorkbookImportService
{
    public function import(string $workbookPath, ?string $cycleName = null): array
    {
        $payload = $this->parseWorkbook($workbookPath);

        return DB::transaction(function () use ($payload, $cycleName) {
            $cycle = AllocationCycle::updateOrCreate(
                ['name' => $cycleName ?: now()->format('F Y')],
                [
                    'starts_on' => now()->startOfMonth()->toDateString(),
                    'ends_on' => now()->endOfMonth()->toDateString(),
                    'is_active' => true,
                ],
            );

            AllocationCycle::whereKeyNot($cycle->id)->update(['is_active' => false]);

            $projects = $this->upsertProjects(collect($payload['projects']));
            $employees = $this->upsertEmployees(collect($payload['employees']));

            Allocation::query()->where('cycle_id', $cycle->id)->delete();
            AllocationReview::query()->where('cycle_id', $cycle->id)->delete();

            $allocationCount = 0;

            foreach ($payload['employees'] as $employeePayload) {
                $employee = $employees[$employeePayload['source_key']];
                $reviewStatus = $this->normalizeReviewStatus($employeePayload['review_status'] ?? null);

                AllocationReview::create([
                    'employee_id' => $employee->id,
                    'cycle_id' => $cycle->id,
                    'reviewer_name' => $employeePayload['reviewer_name'],
                    'status' => $reviewStatus,
                    'summary' => $this->reviewSummary($employeePayload, $reviewStatus),
                    'submitted_at' => $reviewStatus === 'blank' ? null : now(),
                    'reviewed_at' => $reviewStatus === 'complete' ? now() : null,
                ]);

                foreach ($employeePayload['allocations'] as $allocationPayload) {
                    $project = $projects[$allocationPayload['project_key']] ?? null;

                    if (! $project || (float) $allocationPayload['effort'] <= 0) {
                        continue;
                    }

                    Allocation::create([
                        'employee_id' => $employee->id,
                        'project_id' => $project->id,
                        'cycle_id' => $cycle->id,
                        'effort' => $allocationPayload['effort'],
                        'note' => $allocationPayload['note'] ?? null,
                    ]);

                    $allocationCount++;
                }
            }

            return [
                'cycle' => $cycle->name,
                'employees' => $employees->count(),
                'projects' => $projects->count(),
                'allocations' => $allocationCount,
            ];
        });
    }

    private function parseWorkbook(string $workbookPath): array
    {
        $script = base_path('scripts/parse_loe_workbook.py');
        $command = $this->pythonCommand($script, $workbookPath);
        $process = new Process($command, base_path());
        $process->setTimeout(120);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }

        /** @var array{projects: array<int, array<string, mixed>>, employees: array<int, array<string, mixed>>} $payload */
        $payload = json_decode($process->getOutput(), true, 512, JSON_THROW_ON_ERROR);

        return $payload;
    }

    private function pythonCommand(string $script, string $workbookPath): array
    {
        $candidates = array_filter([
            env('LOE_IMPORT_PYTHON'),
            'C:\\Users\\PixelEdge\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe',
            'python',
        ]);

        foreach ($candidates as $candidate) {
            try {
                $process = new Process([$candidate, '--version']);
                $process->setTimeout(10);
                $process->run();

                if ($process->isSuccessful()) {
                    return [$candidate, $script, $workbookPath];
                }
            } catch (\Throwable) {
                continue;
            }
        }

        throw new \RuntimeException('No Python runtime is available for workbook import.');
    }

    private function upsertProjects(Collection $projects): Collection
    {
        return $projects->mapWithKeys(function (array $project) {
            $record = Project::updateOrCreate(
                ['slug' => $project['project_key']],
                [
                    'name' => $project['name'],
                    'priority' => $project['priority'],
                    'type' => $project['type'],
                    'owner_name' => $project['owner_name'],
                    'status' => 'active',
                    'target_capacity' => max((float) $project['target_capacity'], 1),
                    'is_active' => true,
                ],
            );

            return [$project['project_key'] => $record];
        });
    }

    private function upsertEmployees(Collection $employees): Collection
    {
        return $employees->mapWithKeys(function (array $employee) {
            $email = $employee['email'] ?: null;
            $record = null;
            $duplicates = collect();

            if ($email) {
                $duplicates = Employee::query()->where('email', $email)->get();
                $record = $duplicates->first();
            }

            if (! $record) {
                $duplicates = Employee::query()->where('name', $employee['name'])->get();
                $record = $duplicates
                    ->sortByDesc(fn (Employee $existing) => ($existing->user_id ? 100 : 0) + (str_contains($existing->email, '@pixeledge.io') ? 0 : 10))
                    ->first();
            }

            if (! $record && ! $email) {
                $email = $this->syntheticEmail($employee['name']);
            }

            $user = $email ? User::query()->where('email', $email)->first() : null;
            $attributes = [
                'user_id' => $record?->user_id ?? $user?->id,
                'name' => $employee['name'],
                'preferred_name' => $employee['preferred_name'] ?: $employee['name'],
                'email' => $email ?? $record?->email ?? $this->syntheticEmail($employee['name']),
                'stream' => $employee['stream'] ?: 'Unknown',
                'skills' => $employee['skills'],
                'title' => $employee['title'],
                'location' => $employee['location'],
                'start_date' => $employee['start_date'],
                'onboarding_mentor' => $employee['onboarding_mentor'],
                'growth_partner' => $employee['growth_partner'],
                'reviewer_name' => $employee['reviewer_name'],
                'is_active' => true,
            ];

            $record = $record
                ? tap($record)->update($attributes)
                : Employee::create($attributes);

            $duplicates
                ->where('id', '!=', $record->id)
                ->each(function (Employee $duplicate) {
                    $duplicate->update(['is_active' => false]);
                });

            return [$employee['source_key'] => $record];
        });
    }

    private function syntheticEmail(string $name): string
    {
        return Str::slug($name, '.').'@pixeledge.io';
    }

    private function normalizeReviewStatus(?string $status): string
    {
        $value = Str::lower(trim((string) $status));

        return match ($value) {
            'complete' => 'complete',
            'in progress', 'in_progress', 'progress' => 'in_progress',
            default => 'blank',
        };
    }

    private function reviewSummary(array $employeePayload, string $reviewStatus): string
    {
        $total = round(collect($employeePayload['allocations'])->sum('effort'), 2);
        $availability = round(1 - $total, 2);

        if ($reviewStatus === 'complete') {
            return 'Imported as complete from the source workbook.';
        }

        if ($total > 1) {
            return 'Imported as over-allocated and needs reviewer attention.';
        }

        if ($availability > 0) {
            return "Imported with {$availability} available capacity still unassigned.";
        }

        return 'Imported and waiting for reviewer confirmation.';
    }
}
