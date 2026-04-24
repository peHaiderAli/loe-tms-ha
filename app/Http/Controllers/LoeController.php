<?php

namespace App\Http\Controllers;

use App\Models\Allocation;
use App\Models\AllocationChangeLog;
use App\Models\AllocationCycle;
use App\Models\AllocationReview;
use App\Models\Employee;
use App\Models\Project;
use App\Models\User;
use App\Models\Utilization;
use App\Models\UtilizationSubmission;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;
use Inertia\Inertia;
use Inertia\Response;

class LoeController extends Controller
{
    public function dashboard(): Response
    {
        $cycle = $this->activeCycle();
        $employees = $this->employeesForCycle($cycle);

        return Inertia::render('dashboard', [
            'companyMetrics' => $this->companyMetrics($employees),
            'teamMix' => $this->teamMix($employees),
            'reviewFlow' => $this->reviewFlow($employees),
            'allocationHealth' => $this->allocationHealth($employees),
            'capacityInsights' => $this->capacityInsights($employees),
            'frictionPoints' => $this->frictionPoints(),
            'systemViews' => $this->systemViews(),
            'projectHighlights' => $this->projectHighlights($cycle),
            'activeCycle' => $cycle->only(['id', 'name', 'starts_on', 'ends_on']),
        ]);
    }

    public function workspace(Request $request): Response
    {
        $cycle = $this->activeCycle();
        $employees = $this->employeesForCycle($cycle);
        $selectedEmployee = $this->resolveWorkspaceEmployee($request, $employees);
        $projects = $this->workspaceProjectSet($selectedEmployee, $cycle);

        $currentAllocations = $selectedEmployee->allocations->keyBy('project_id');
        $currentUtilizations = $selectedEmployee->utilizations->keyBy('project_id');
        $review = $selectedEmployee->reviews->first();
        $workspaceProjects = $projects->map(function (Project $project) use ($currentAllocations, $currentUtilizations, $selectedEmployee) {
            $allocation = $currentAllocations->get($project->id);
            $utilization = $currentUtilizations->get($project->id);
            $allocationValue = (float) ($allocation?->effort ?? 0);
            $utilizationValue = (float) ($utilization?->effort ?? 0);

            return [
                'project_id' => $project->id,
                'name' => $project->name,
                'type' => $project->type,
                'allocation' => $allocationValue,
                'utilization' => $utilizationValue,
                'utilizationDelta' => round($utilizationValue - $allocationValue, 2),
                'utilizationNote' => $utilization?->note,
                'priority' => $project->priority,
                'note' => $this->projectNote($project, $selectedEmployee, $allocation?->effort),
            ];
        })->values();

        $total = $this->totalAllocation($selectedEmployee);
        $availability = round(1 - $total, 2);

        return Inertia::render('loe/workspace', [
            'employeeWorkspace' => [
                'employee' => [
                    'id' => $selectedEmployee->id,
                    'name' => $selectedEmployee->name,
                    'preferredName' => $selectedEmployee->preferred_name,
                    'stream' => $selectedEmployee->stream,
                    'title' => $selectedEmployee->title,
                    'reviewer' => $selectedEmployee->reviewer_name,
                    'reviewStatus' => $review?->status ?? 'blank',
                    'location' => $selectedEmployee->location,
                    'focusPrompt' => $this->workspacePrompt($selectedEmployee, $total),
                ],
                'projects' => $workspaceProjects,
                'presets' => $this->presetsForCount($workspaceProjects->count()),
                'steps' => [
                    'Confirm your primary project instead of scanning every project in the company.',
                    'Adjust only the few projects the system recommends for your role and stream.',
                    'See total allocation and remaining capacity update instantly before you submit.',
                    'Send the draft to your reviewer with context, not just a spreadsheet status.',
                ],
                'totals' => [
                    'total' => $total,
                    'availability' => $availability,
                    'projectCount' => $workspaceProjects->where('allocation', '>', 0)->count(),
                    'utilization' => round((float) $selectedEmployee->utilizations->sum('effort'), 2),
                ],
            ],
            'employees' => $employees->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'preferredName' => $employee->preferred_name,
                'stream' => $employee->stream,
                'totalAllocation' => $this->totalAllocation($employee),
                'reviewStatus' => $employee->reviews->first()?->status ?? 'blank',
            ])->values(),
            'allocationPrinciples' => $this->allocationPrinciples(),
            'quickActions' => $this->quickActions(),
            'allocationChanges' => $selectedEmployee->allocationChangeLogs
                ->take(5)
                ->map(fn (AllocationChangeLog $change) => [
                    'id' => $change->id,
                    'changedBy' => $change->changedBy?->name ?? 'System',
                    'changedAt' => $change->created_at?->toDateTimeString(),
                    'beforeTotal' => (float) $change->before_total,
                    'afterTotal' => (float) $change->after_total,
                    'summary' => $change->summary,
                ])
                ->values(),
            'activeCycle' => $cycle->only(['id', 'name']),
            'canSwitchWorkspace' => $this->canSwitchWorkspace($request),
            'canEditAllocation' => $this->canEditAllocation($request, $selectedEmployee),
            'isOwnWorkspace' => $this->isOwnEmployee($request, $selectedEmployee),
        ]);
    }

    public function updateWorkspace(Request $request, Employee $employee): RedirectResponse
    {
        abort_unless($this->canEditAllocation($request, $employee), 403);

        $cycle = $this->activeCycle();

        $validated = $request->validate([
            'allocations' => ['required', 'array', 'min:1'],
            'allocations.*.project_id' => ['required', 'exists:projects,id'],
            'allocations.*.effort' => ['required', 'numeric', 'min:0', 'max:1'],
        ]);

        $beforeSnapshot = $employee->allocations
            ->map(fn (Allocation $allocation) => [
                'project_id' => $allocation->project_id,
                'effort' => round((float) $allocation->effort, 2),
            ])
            ->sortBy('project_id')
            ->values()
            ->all();

        $total = collect($validated['allocations'])->sum(fn (array $allocation) => (float) $allocation['effort']);

        if ($total > 1.25) {
            return back()->withErrors([
                'allocations' => 'Total allocation cannot exceed 1.25. Rebalance the plan before saving.',
            ]);
        }

        Allocation::query()
            ->where('employee_id', $employee->id)
            ->where('cycle_id', $cycle->id)
            ->delete();

        foreach ($validated['allocations'] as $allocation) {
            if ((float) $allocation['effort'] === 0.0) {
                continue;
            }

            Allocation::create([
                'employee_id' => $employee->id,
                'project_id' => $allocation['project_id'],
                'cycle_id' => $cycle->id,
                'effort' => $allocation['effort'],
            ]);
        }

        AllocationReview::query()->updateOrCreate(
            ['employee_id' => $employee->id, 'cycle_id' => $cycle->id],
            [
                'reviewer_name' => $employee->reviewer_name,
                'status' => 'in_progress',
                'submitted_at' => now(),
                'summary' => 'Allocation updated from the employee workspace.',
            ],
        );

        $employee->load([
            'allocations' => fn ($query) => $query->where('cycle_id', $cycle->id),
        ]);

        $afterSnapshot = $employee->allocations
            ->map(fn (Allocation $allocation) => [
                'project_id' => $allocation->project_id,
                'effort' => round((float) $allocation->effort, 2),
            ])
            ->sortBy('project_id')
            ->values()
            ->all();

        if (json_encode($beforeSnapshot) !== json_encode($afterSnapshot)) {
            AllocationChangeLog::create([
                'employee_id' => $employee->id,
                'cycle_id' => $cycle->id,
                'changed_by_user_id' => $request->user()?->id,
                'before_total' => round(collect($beforeSnapshot)->sum('effort'), 2),
                'after_total' => round(collect($afterSnapshot)->sum('effort'), 2),
                'before_snapshot' => $beforeSnapshot,
                'after_snapshot' => $afterSnapshot,
                'summary' => $this->allocationChangeSummary($beforeSnapshot, $afterSnapshot),
            ]);

            $this->notifyEmployeeAboutAllocationChange($employee, $cycle, $request->user(), $beforeSnapshot, $afterSnapshot);
        }

        return redirect()
            ->route('loe.workspace', ['employee' => $employee->id])
            ->with('success', 'Allocation draft saved and sent into the review flow.');
    }

    public function utilization(Request $request): Response
    {
        $cycle = $this->activeCycle();
        $employees = $this->employeesForCycle($cycle);
        $selectedEmployee = $this->resolveWorkspaceEmployee($request, $employees);
        $submission = $selectedEmployee->utilizationSubmissions->first();

        $projects = $this->utilizationProjectSet($selectedEmployee, $cycle);
        $allocationMap = $selectedEmployee->allocations->keyBy('project_id');
        $utilizationMap = $selectedEmployee->utilizations->keyBy('project_id');

        $comparison = $projects->map(function (Project $project) use ($allocationMap, $utilizationMap) {
            $allocated = (float) ($allocationMap->get($project->id)?->effort ?? 0);
            $utilized = (float) ($utilizationMap->get($project->id)?->effort ?? 0);

            return [
                'project_id' => $project->id,
                'name' => $project->name,
                'type' => $project->type,
                'allocation' => $allocated,
                'utilization' => $utilized,
                'delta' => round($utilized - $allocated, 2),
                'note' => $utilizationMap->get($project->id)?->note,
            ];
        })->values();

        $availableProjects = Project::query()
            ->where('is_active', true)
            ->whereNotIn('id', $projects->pluck('id'))
            ->orderBy('name')
            ->get(['id', 'name', 'type'])
            ->map(fn (Project $project) => [
                'project_id' => $project->id,
                'name' => $project->name,
                'type' => $project->type,
            ])
            ->values();

        return Inertia::render('loe/utilization', [
            'utilizationWorkspace' => [
                'employee' => [
                    'id' => $selectedEmployee->id,
                    'name' => $selectedEmployee->name,
                    'preferredName' => $selectedEmployee->preferred_name,
                    'stream' => $selectedEmployee->stream,
                    'title' => $selectedEmployee->title,
                    'reviewer' => $selectedEmployee->reviewer_name,
                    'reviewStatus' => $selectedEmployee->reviews->first()?->status ?? 'blank',
                    'location' => $selectedEmployee->location,
                    'focusPrompt' => $submission?->submitted_at
                        ? 'Your utilization is captured for this cycle. Update it only if the actual month changed.'
                        : 'Log how the month actually landed across projects so the comparison stays credible.',
                ],
                'projects' => $comparison,
                'availableProjects' => $availableProjects,
                'totals' => [
                    'allocation' => round((float) $selectedEmployee->allocations->sum('effort'), 2),
                    'utilization' => round((float) $selectedEmployee->utilizations->sum('effort'), 2),
                    'variance' => round((float) $selectedEmployee->utilizations->sum('effort') - (float) $selectedEmployee->allocations->sum('effort'), 2),
                ],
                'submission' => [
                    'status' => $submission?->status ?? 'blank',
                    'submittedAt' => $submission?->submitted_at?->toDateTimeString(),
                ],
                'guidance' => [
                    'Employees enter actual month-end utilization separately from planned LOE allocation.',
                    'Reviewers can compare planned allocation and actual utilization without reopening the spreadsheet.',
                    'Any project you actually touched can be added, even if it was not in the original allocation plan.',
                ],
            ],
            'employees' => $employees->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'preferredName' => $employee->preferred_name,
                'stream' => $employee->stream,
                'totalAllocation' => $this->totalAllocation($employee),
                'reviewStatus' => $employee->utilizationSubmissions->first()?->status ?? 'blank',
            ])->values(),
            'activeCycle' => $cycle->only(['id', 'name']),
            'canSwitchWorkspace' => $this->canSwitchWorkspace($request),
            'isOwnWorkspace' => $this->isOwnEmployee($request, $selectedEmployee),
        ]);
    }

    public function updateUtilization(Request $request, Employee $employee): RedirectResponse
    {
        abort_unless($this->canAccessEmployeeWorkspace($request, $employee), 403);

        $cycle = $this->activeCycle();

        $validated = $request->validate([
            'utilizations' => ['required', 'array', 'min:1'],
            'utilizations.*.project_id' => ['required', 'distinct', 'exists:projects,id'],
            'utilizations.*.effort' => ['required', 'numeric', 'min:0', 'max:1'],
            'utilizations.*.note' => ['nullable', 'string', 'max:300'],
        ]);

        $nonZeroUtilizations = collect($validated['utilizations'])
            ->filter(fn (array $item) => (float) $item['effort'] > 0);

        if ($nonZeroUtilizations->isEmpty()) {
            return back()->withErrors([
                'utilizations' => 'Add utilization for at least one project before submitting the month.',
            ]);
        }

        Utilization::query()
            ->where('employee_id', $employee->id)
            ->where('cycle_id', $cycle->id)
            ->delete();

        foreach ($nonZeroUtilizations as $utilization) {
            Utilization::create([
                'employee_id' => $employee->id,
                'project_id' => $utilization['project_id'],
                'cycle_id' => $cycle->id,
                'effort' => $utilization['effort'],
                'note' => $utilization['note'] ?? null,
            ]);
        }

        UtilizationSubmission::query()->updateOrCreate(
            ['employee_id' => $employee->id, 'cycle_id' => $cycle->id],
            [
                'status' => 'submitted',
                'submitted_at' => now(),
            ],
        );

        return redirect()
            ->route('loe.utilization', ['employee' => $employee->id])
            ->with('success', 'Monthly utilization saved. Allocation and actuals can now be compared side by side.');
    }

    public function reviews(): Response
    {
        abort_unless($this->canReview($request = request()), 403);

        $cycle = $this->activeCycle();
        $employees = $this->employeesForCycle($cycle);
        $queue = $this->reviewQueue($employees);

        return Inertia::render('loe/reviews', [
            'reviewFlow' => $this->reviewFlow($employees),
            'reviewQueue' => $queue,
            'reviewerLoad' => $this->reviewerLoad($queue),
            'reviewPlaybook' => $this->reviewPlaybook(),
            'activeCycle' => $cycle->only(['id', 'name']),
        ]);
    }

    public function updateReview(Request $request, AllocationReview $review): RedirectResponse
    {
        abort_unless($this->canReview($request), 403);

        $validated = $request->validate([
            'status' => ['required', 'in:blank,in_progress,complete'],
            'summary' => ['nullable', 'string', 'max:500'],
        ]);

        $review->update([
            'status' => $validated['status'],
            'summary' => $validated['summary'] ?? $review->summary,
            'submitted_at' => $review->submitted_at ?? now(),
            'reviewed_at' => $validated['status'] === 'complete' ? now() : null,
        ]);

        return redirect()->route('loe.reviews')->with('success', 'Review status updated.');
    }

    public function sendReviewReminder(Request $request, AllocationReview $review): RedirectResponse
    {
        abort_unless($this->canReview($request), 403);

        $review->loadMissing('employee.user', 'cycle');

        $employee = $review->employee;
        $recipientEmail = $employee?->user?->email ?: $employee?->email;

        if (! $employee || ! $recipientEmail) {
            return redirect()
                ->route('loe.reviews')
                ->withErrors(['reviews' => 'This teammate does not have a reachable email address yet.']);
        }

        $reviewerEmail = User::query()
            ->where('name', $review->reviewer_name ?: $employee->reviewer_name)
            ->whereIn('role', ['admin', 'reviewer'])
            ->value('email');

        $cycleName = $review->cycle?->name ?? 'the active cycle';
        $employeeName = $employee->preferred_name ?: $employee->name;
        $reviewerName = $review->reviewer_name ?: $employee->reviewer_name ?: 'your reviewer';

        Mail::raw(
            "Hi {$employeeName},\n\nYour LOE allocation for {$cycleName} still needs attention. Please review your current allocation, confirm where your remaining capacity belongs, and resubmit it in Pixeledge LOE TMS.\n\nReviewer: {$reviewerName}\nStatus: {$review->status}\n\nThanks,\nPixeledge LOE TMS",
            function ($message) use ($recipientEmail, $reviewerEmail, $employeeName, $cycleName) {
                $message
                    ->to($recipientEmail)
                    ->subject("LOE reminder: {$employeeName} needs an update for {$cycleName}");

                if ($reviewerEmail && $reviewerEmail !== $recipientEmail) {
                    $message->cc($reviewerEmail);
                }
            },
        );

        return redirect()
            ->route('loe.reviews')
            ->with('success', "Reminder sent for {$employeeName}.");
    }

    public function projects(): Response
    {
        $cycle = $this->activeCycle();
        $projectHighlights = $this->projectHighlights($cycle);

        return Inertia::render('loe/projects', [
            'projectHighlights' => $projectHighlights,
            'priorityLanes' => $this->priorityLanes(),
            'leadershipSignals' => $this->leadershipSignals($projectHighlights),
            'activeCycle' => $cycle->only(['id', 'name']),
        ]);
    }

    public function imports(): Response
    {
        abort_unless($this->canManageImports(request()), 403);

        $cycle = $this->activeCycle();

        return Inertia::render('loe/imports', [
            'activeCycle' => $cycle->only(['id', 'name', 'starts_on', 'ends_on']),
            'importStats' => [
                'employees' => Employee::query()->where('is_active', true)->count(),
                'projects' => Project::query()->where('is_active', true)->count(),
                'allocations' => Allocation::query()->where('cycle_id', $cycle->id)->count(),
                'reviews' => AllocationReview::query()->where('cycle_id', $cycle->id)->count(),
            ],
            'importChecklist' => [
                'Upload the latest LOE workbook export from Google Sheets or Excel.',
                'Choose the cycle name you want this import to become the active reporting cycle.',
                'The import will refresh employees, projects, allocations, and review statuses for that cycle.',
            ],
        ]);
    }

    public function storeImport(Request $request, \App\Services\LoeWorkbookImportService $importer): RedirectResponse
    {
        abort_unless($this->canManageImports($request), 403);

        $validated = $request->validate([
            'cycle_name' => ['required', 'string', 'max:100'],
            'workbook' => ['required', 'file', 'mimes:xlsx,xls'],
        ]);

        $storedPath = $request->file('workbook')->store('loe-imports');
        $absolutePath = Storage::path($storedPath);

        try {
            $summary = $importer->import($absolutePath, $validated['cycle_name']);
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'workbook' => 'The workbook could not be imported. Please verify the file structure and try again.',
            ]);
        } finally {
            if (Storage::exists($storedPath)) {
                Storage::delete($storedPath);
            }
        }

        return redirect()
            ->route('loe.imports')
            ->with('success', "Imported {$summary['employees']} employees, {$summary['projects']} projects, and {$summary['allocations']} allocations into {$summary['cycle']}.");
    }

    public function access(): Response
    {
        abort_unless($this->canManageImports(request()), 403);

        $users = User::query()
            ->with('employee')
            ->orderBy('role')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'employee' => $user->employee ? [
                    'id' => $user->employee->id,
                    'name' => $user->employee->name,
                    'stream' => $user->employee->stream,
                ] : null,
            ])
            ->values();

        $employees = Employee::query()
            ->where('is_active', true)
            ->orderBy('stream')
            ->orderBy('name')
            ->get()
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'stream' => $employee->stream,
                'linkedUserId' => $employee->user_id,
                'reviewerName' => $employee->reviewer_name,
            ])
            ->values();

        $reviewers = User::query()
            ->whereIn('role', ['admin', 'reviewer'])
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ])
            ->values();

        return Inertia::render('loe/access', [
            'users' => $users,
            'employees' => $employees,
            'reviewers' => $reviewers,
        ]);
    }

    public function storeAccess(Request $request): RedirectResponse
    {
        abort_unless($this->canManageImports($request), 403);

        $validated = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', 'in:admin,reviewer,employee'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        $employee = Employee::query()->findOrFail($validated['employee_id']);

        $user = User::query()
            ->where('email', $validated['email'])
            ->orWhere('id', $employee->user_id)
            ->first();

        if (! $user) {
            $user = new User();
            $user->password = Hash::make($validated['password'] ?: Str::password(20));
        } elseif (! empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->fill([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ]);
        $user->email_verified_at ??= now();
        $user->save();

        Employee::query()
            ->where('user_id', $user->id)
            ->whereKeyNot($employee->id)
            ->update(['user_id' => null]);

        $employee->update([
            'user_id' => $user->id,
            'email' => $validated['email'],
        ]);

        return redirect()
            ->route('loe.access')
            ->with('success', "{$employee->name} is now linked to {$user->email} as {$user->role}.");
    }

    public function updateReviewerAssignment(Request $request, Employee $employee): RedirectResponse
    {
        abort_unless($this->canManageImports($request), 403);

        $validated = $request->validate([
            'reviewer_name' => ['nullable', 'string', 'max:255'],
        ]);

        $cycle = $this->activeCycle();
        $reviewerName = $validated['reviewer_name'] ?: null;

        $employee->update([
            'reviewer_name' => $reviewerName,
        ]);

        $existingReview = AllocationReview::query()
            ->where('employee_id', $employee->id)
            ->where('cycle_id', $cycle->id)
            ->first();

        AllocationReview::query()->updateOrCreate(
            ['employee_id' => $employee->id, 'cycle_id' => $cycle->id],
            [
                'reviewer_name' => $reviewerName,
                'status' => $existingReview?->status ?? 'blank',
                'summary' => $existingReview?->summary,
                'submitted_at' => $existingReview?->submitted_at,
                'reviewed_at' => $existingReview?->reviewed_at,
            ],
        );

        return redirect()
            ->route('loe.access')
            ->with('success', "Reviewer assignment updated for {$employee->name}.");
    }

    public function generateAccessLink(Request $request, User $user): RedirectResponse
    {
        abort_unless($this->canManageImports($request), 403);

        $token = Password::broker()->createToken($user);
        $resetLink = route('password.reset', [
            'token' => $token,
            'email' => $user->email,
        ]);

        return redirect()
            ->route('loe.access')
            ->with('success', "A secure access link is ready for {$user->email}.")
            ->with('inviteLink', $resetLink)
            ->with('inviteEmail', $user->email);
    }

    private function activeCycle(): AllocationCycle
    {
        return AllocationCycle::query()
            ->where('is_active', true)
            ->latest('starts_on')
            ->firstOrFail();
    }

    private function employeesForCycle(AllocationCycle $cycle): Collection
    {
        return Employee::query()
            ->where('is_active', true)
            ->with([
                'allocations' => fn ($query) => $query
                    ->where('cycle_id', $cycle->id)
                    ->with('project'),
                'reviews' => fn ($query) => $query->where('cycle_id', $cycle->id),
                'utilizations' => fn ($query) => $query
                    ->where('cycle_id', $cycle->id)
                    ->with('project'),
                'utilizationSubmissions' => fn ($query) => $query->where('cycle_id', $cycle->id),
                'allocationChangeLogs' => fn ($query) => $query
                    ->where('cycle_id', $cycle->id)
                    ->with('changedBy')
                    ->latest(),
            ])
            ->orderBy('stream')
            ->orderBy('preferred_name')
            ->get();
    }

    private function resolveWorkspaceEmployee(Request $request, Collection $employees): Employee
    {
        $linkedEmployeeId = $request->user()?->employee?->id;
        $requestedEmployeeId = $request->integer('employee');

        if ($requestedEmployeeId && $this->canSwitchWorkspace($request)) {
            $requested = $employees->firstWhere('id', $requestedEmployeeId);

            if ($requested instanceof Employee) {
                return $requested;
            }
        }

        if ($linkedEmployeeId) {
            $linked = $employees->firstWhere('id', $linkedEmployeeId);

            if ($linked instanceof Employee) {
                return $linked;
            }
        }

        return $employees->first() ?? abort(404);
    }

    private function canManageImports(Request $request): bool
    {
        return $request->user()?->role === 'admin';
    }

    private function canReview(Request $request): bool
    {
        return in_array($request->user()?->role, ['admin', 'reviewer'], true);
    }

    private function canSwitchWorkspace(Request $request): bool
    {
        return in_array($request->user()?->role, ['admin', 'reviewer'], true);
    }

    private function canAccessEmployeeWorkspace(Request $request, Employee $employee): bool
    {
        if ($this->canSwitchWorkspace($request)) {
            return true;
        }

        return $request->user()?->employee?->is($employee) ?? false;
    }

    private function canEditAllocation(Request $request, Employee $employee): bool
    {
        if (! $this->canSwitchWorkspace($request)) {
            return false;
        }

        return ! $this->isOwnEmployee($request, $employee);
    }

    private function isOwnEmployee(Request $request, Employee $employee): bool
    {
        $linkedEmployee = $request->user()?->employee;

        if (! $linkedEmployee) {
            return false;
        }

        return $linkedEmployee->is($employee);
    }

    private function totalAllocation(Employee $employee): float
    {
        return round((float) $employee->allocations->sum(fn (Allocation $allocation) => (float) $allocation->effort), 2);
    }

    private function companyMetrics(Collection $employees): array
    {
        $totalPeople = $employees->count();
        $reviewed = $employees->filter(function (Employee $employee) {
            $status = $employee->reviews->first()?->status;

            return in_array($status, ['in_progress', 'complete'], true);
        })->count();
        $available = $employees->filter(fn (Employee $employee) => $this->totalAllocation($employee) < 1)->count();
        $overAllocated = $employees->filter(fn (Employee $employee) => $this->totalAllocation($employee) > 1)->count();

        return [
            [
                'label' => 'People in scope',
                'value' => (string) $totalPeople,
                'detail' => $employees->groupBy('stream')->map->count()->map(fn ($count, $stream) => "{$count} {$stream}")->implode(', '),
                'tone' => 'sky',
            ],
            [
                'label' => 'Reviewed this cycle',
                'value' => number_format(($reviewed / max($totalPeople, 1)) * 100, 1).'%',
                'detail' => "{$reviewed} of {$totalPeople} profiles are complete or in progress",
                'tone' => 'emerald',
            ],
            [
                'label' => 'Available capacity',
                'value' => "{$available} people",
                'detail' => 'These contributors still have room before they reach 1.0 LOE',
                'tone' => 'amber',
            ],
            [
                'label' => 'Over-allocated',
                'value' => "{$overAllocated} people",
                'detail' => 'These rows need reviewer intervention immediately',
                'tone' => 'rose',
            ],
        ];
    }

    private function teamMix(Collection $employees): array
    {
        $colors = [
            'Experience' => 'bg-sky-500',
            'Engineering' => 'bg-emerald-500',
            'HR/Admin' => 'bg-amber-500',
        ];

        return $employees->groupBy('stream')->map(function (Collection $group, string $stream) use ($employees, $colors) {
            return [
                'name' => $stream,
                'count' => $group->count(),
                'share' => (int) round(($group->count() / max($employees->count(), 1)) * 100),
                'color' => $colors[$stream] ?? 'bg-slate-500',
            ];
        })->values()->all();
    }

    private function reviewFlow(Collection $employees): array
    {
        $counts = $employees->countBy(fn (Employee $employee) => $employee->reviews->first()?->status ?? 'blank');

        return [
            ['label' => 'Complete', 'value' => $counts->get('complete', 0), 'detail' => 'Reliable for utilization reporting', 'tone' => 'emerald'],
            ['label' => 'In progress', 'value' => $counts->get('in_progress', 0), 'detail' => 'People have started but still need nudges', 'tone' => 'amber'],
            ['label' => 'Blank', 'value' => $counts->get('blank', 0), 'detail' => 'The highest-risk group for reporting integrity', 'tone' => 'rose'],
        ];
    }

    private function allocationHealth(Collection $employees): array
    {
        $balanced = $employees->filter(fn (Employee $employee) => $this->totalAllocation($employee) === 1.0)->count();
        $under = $employees->filter(fn (Employee $employee) => $this->totalAllocation($employee) < 1.0)->count();
        $over = $employees->filter(fn (Employee $employee) => $this->totalAllocation($employee) > 1.0)->count();

        return [
            ['label' => 'Balanced at 1.0', 'value' => $balanced, 'description' => 'People who are fully planned and ready for reporting', 'tone' => 'emerald'],
            ['label' => 'Under-allocated', 'value' => $under, 'description' => 'Capacity exists, so the system should recommend where it goes next', 'tone' => 'amber'],
            ['label' => 'Over-allocated', 'value' => $over, 'description' => 'These rows are early delivery-risk signals for reviewers', 'tone' => 'rose'],
        ];
    }

    private function capacityInsights(Collection $employees): array
    {
        return [
            'available' => $this->groupCapacityEmployees(
                $employees->filter(fn (Employee $employee) => $this->totalAllocation($employee) < 1.0),
                fn (Employee $employee) => [
                    'allocation' => $this->totalAllocation($employee),
                    'availability' => round(1 - $this->totalAllocation($employee), 2),
                    'variance' => round(1 - $this->totalAllocation($employee), 2),
                ],
            ),
            'overAllocated' => $this->groupCapacityEmployees(
                $employees->filter(fn (Employee $employee) => $this->totalAllocation($employee) > 1.0),
                fn (Employee $employee) => [
                    'allocation' => $this->totalAllocation($employee),
                    'availability' => 0,
                    'variance' => round($this->totalAllocation($employee) - 1, 2),
                ],
            ),
        ];
    }

    private function groupCapacityEmployees(Collection $employees, callable $metrics): array
    {
        return $employees
            ->groupBy('stream')
            ->map(function (Collection $group, string $stream) use ($metrics) {
                return [
                    'team' => $stream,
                    'count' => $group->count(),
                    'people' => $group
                        ->sortBy('preferred_name')
                        ->map(function (Employee $employee) use ($metrics) {
                            return array_merge([
                                'id' => $employee->id,
                                'name' => $employee->preferred_name ?: $employee->name,
                                'fullName' => $employee->name,
                                'title' => $employee->title,
                            ], $metrics($employee));
                        })
                        ->values()
                        ->all(),
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->all();
    }

    private function frictionPoints(): array
    {
        return [
            [
                'title' => 'Too many columns, too little guidance',
                'body' => 'People are asked to think in every project column at once. The system should narrow the task to recommended projects, remaining capacity, and one obvious next action.',
            ],
            [
                'title' => 'Review status is detached from action',
                'body' => 'Rows are marked Complete, In Progress, or left blank, but the workbook does not turn that status into a review queue, reminders, or escalation path.',
            ],
            [
                'title' => 'Leadership reporting depends on perfect entry',
                'body' => 'Because the workbook is the source of truth, incomplete rows immediately weaken utilization, staffing, and project health reporting.',
            ],
        ];
    }

    private function systemViews(): array
    {
        return [
            [
                'title' => 'Executive overview',
                'href' => '/dashboard',
                'description' => 'Turn row-by-row LOE data into confidence metrics, review progress, and staffing signals.',
            ],
            [
                'title' => 'Employee workspace',
                'href' => '/workspace',
                'description' => 'Guide one person through a lightweight, capacity-aware allocation flow instead of a spreadsheet maze.',
            ],
            [
                'title' => 'Review center',
                'href' => '/reviews',
                'description' => 'Give reviewers a queue, blockers, and service-level focus rather than a passive status column.',
            ],
            [
                'title' => 'Project health',
                'href' => '/projects',
                'description' => 'Connect allocation coverage to portfolio priorities so management sees risk before delivery slips.',
            ],
        ];
    }

    private function projectNote(Project $project, Employee $employee, ?float $effort): string
    {
        if ($effort && $effort > 0) {
            return 'Current committed work for this cycle.';
        }

        if ($project->priority === 'A' && $employee->stream === 'Engineering' && str_contains($project->name, 'LoanEdge')) {
            return 'Suggested because the priority-A fintech lane needs engineering support.';
        }

        if ($project->priority === 'B') {
            return 'Optional internal support that can absorb spare capacity without hiding it from reporting.';
        }

        return 'Relevant to your stream and available for allocation if capacity remains.';
    }

    private function workspaceProjectSet(Employee $employee, AllocationCycle $cycle): Collection
    {
        $currentProjectIds = $employee->allocations->pluck('project_id')->all();

        $recommendedProjectIds = Allocation::query()
            ->select('project_id', DB::raw('SUM(effort) as total_effort'))
            ->where('cycle_id', $cycle->id)
            ->whereHas('employee', fn ($query) => $query->where('stream', $employee->stream))
            ->whereNotIn('project_id', $currentProjectIds)
            ->groupBy('project_id')
            ->orderByDesc('total_effort')
            ->limit(3)
            ->pluck('project_id')
            ->all();

        $internalProjectIds = Project::query()
            ->where('is_active', true)
            ->whereIn('type', ['Internal platform', 'Internal operations', 'Internal support'])
            ->whereNotIn('id', array_merge($currentProjectIds, $recommendedProjectIds))
            ->limit(2)
            ->pluck('id')
            ->all();

        $projectIds = collect(array_merge($currentProjectIds, $recommendedProjectIds, $internalProjectIds))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return Project::query()
            ->whereIn('id', $projectIds)
            ->get()
            ->sortBy(function (Project $project) use ($currentProjectIds) {
                return sprintf(
                    '%s-%s-%s',
                    in_array($project->id, $currentProjectIds, true) ? '0' : '1',
                    $this->priorityWeight($project->priority),
                    Str::lower($project->name),
                );
            })
            ->values();
    }

    private function utilizationProjectSet(Employee $employee, AllocationCycle $cycle): Collection
    {
        $allocatedProjectIds = $employee->allocations->pluck('project_id')->all();
        $utilizedProjectIds = $employee->utilizations->pluck('project_id')->all();

        $recommendedProjectIds = Allocation::query()
            ->select('project_id', DB::raw('SUM(effort) as total_effort'))
            ->where('cycle_id', $cycle->id)
            ->whereHas('employee', fn ($query) => $query->where('stream', $employee->stream))
            ->whereNotIn('project_id', array_merge($allocatedProjectIds, $utilizedProjectIds))
            ->groupBy('project_id')
            ->orderByDesc('total_effort')
            ->limit(2)
            ->pluck('project_id')
            ->all();

        $projectIds = collect(array_merge($allocatedProjectIds, $utilizedProjectIds, $recommendedProjectIds))
            ->filter()
            ->unique()
            ->values()
            ->all();

        return Project::query()
            ->whereIn('id', $projectIds)
            ->get()
            ->sortBy(function (Project $project) use ($allocatedProjectIds, $utilizedProjectIds) {
                return sprintf(
                    '%s-%s-%s',
                    in_array($project->id, array_merge($allocatedProjectIds, $utilizedProjectIds), true) ? '0' : '1',
                    $this->priorityWeight($project->priority),
                    Str::lower($project->name),
                );
            })
            ->values();
    }

    private function priorityWeight(?string $priority): string
    {
        return match ($priority) {
            'A' => '0',
            'B' => '1',
            default => '2',
        };
    }

    private function workspacePrompt(Employee $employee, float $total): string
    {
        $remaining = round(1 - $total, 2);

        if ($remaining > 0) {
            return "You still have {$remaining} capacity left this cycle. Confirm where it should go and submit for review.";
        }

        if ($remaining < 0) {
            return 'You are above full capacity. Rebalance before this plan is approved.';
        }

        return 'Your allocation is balanced. Review the split, add context if needed, and submit.';
    }

    private function presetsForCount(int $projectCount): array
    {
        $presets = [
            ['label' => 'Keep primary focus', 'values' => [0.8, 0.2, 0.0], 'description' => 'Protect deep work and keep context switching low.'],
            ['label' => 'Balanced support', 'values' => [0.7, 0.2, 0.1], 'description' => 'Blend client delivery with one internal contribution.'],
            ['label' => 'Stretch capacity', 'values' => [0.6, 0.3, 0.1], 'description' => 'Free more time for a top-priority lane without losing your anchor project.'],
        ];

        return collect($presets)->map(function (array $preset) use ($projectCount) {
            $values = array_pad($preset['values'], $projectCount, 0.0);

            return [
                'label' => $preset['label'],
                'allocations' => array_slice($values, 0, $projectCount),
                'description' => $preset['description'],
            ];
        })->all();
    }

    private function allocationPrinciples(): array
    {
        return [
            'Each person should land close to 1.0 total LOE.',
            'Availability is not entered manually; it is whatever remains after allocations.',
            'Project count should reflect non-zero allocations only.',
            'Internal work still counts because leadership needs a full utilization picture.',
        ];
    }

    private function quickActions(): array
    {
        return [
            ['title' => 'Nudge incomplete teammates', 'detail' => 'The workflow can target people who still have blank reviews or unassigned capacity.'],
            ['title' => 'Escalate overload', 'detail' => 'Any allocation above 1.0 is surfaced to the reviewer immediately.'],
            ['title' => 'Recommend work automatically', 'detail' => 'Project suggestions can be filtered by stream, skills, and remaining capacity.'],
        ];
    }

    private function allocationChangeSummary(array $beforeSnapshot, array $afterSnapshot): string
    {
        $before = collect($beforeSnapshot)->keyBy('project_id');
        $after = collect($afterSnapshot)->keyBy('project_id');

        return $after->keys()
            ->merge($before->keys())
            ->unique()
            ->map(function ($projectId) use ($before, $after) {
                $beforeEffort = (float) ($before->get($projectId)['effort'] ?? 0);
                $afterEffort = (float) ($after->get($projectId)['effort'] ?? 0);

                if ($beforeEffort === $afterEffort) {
                    return null;
                }

                $projectName = Project::query()->whereKey($projectId)->value('name') ?? "Project {$projectId}";
                $delta = $afterEffort - $beforeEffort;

                return "{$projectName} ".($delta >= 0 ? '+' : '').number_format($delta, 2);
            })
            ->filter()
            ->implode(', ');
    }

    private function notifyEmployeeAboutAllocationChange(Employee $employee, AllocationCycle $cycle, ?User $actor, array $beforeSnapshot, array $afterSnapshot): void
    {
        $recipientEmail = $employee->user?->email ?: $employee->email;

        if (! $recipientEmail) {
            return;
        }

        $employeeName = $employee->preferred_name ?: $employee->name;
        $changedBy = $actor?->name ?? 'A reviewer';
        $summary = $this->allocationChangeSummary($beforeSnapshot, $afterSnapshot) ?: 'Your allocation was updated.';
        $workspaceLink = route('loe.workspace', ['employee' => $employee->id]);

        Mail::raw(
            "Hi {$employeeName},\n\nYour allocation for {$cycle->name} was updated by {$changedBy}.\n\nChange summary: {$summary}\n\nReview your latest allocation here: {$workspaceLink}\n\nThanks,\nPixeledge LOE TMS",
            function ($message) use ($recipientEmail, $employeeName, $cycle) {
                $message
                    ->to($recipientEmail)
                    ->subject("Allocation updated for {$employeeName} in {$cycle->name}");
            },
        );
    }

    private function reviewQueue(Collection $employees): array
    {
        return $employees->map(function (Employee $employee) {
            $review = $employee->reviews->first();
            $total = $this->totalAllocation($employee);
            $availability = round(1 - $total, 2);
            $risk = $total > 1 ? 'Critical' : ($availability >= 0.25 ? 'High' : ($review?->status === 'blank' ? 'Medium' : 'Healthy'));

            return [
                'id' => $review?->id,
                'employeeId' => $employee->id,
                'member' => $employee->name,
                'stream' => $employee->stream,
                'reviewer' => $review?->reviewer_name ?? $employee->reviewer_name ?? 'Unassigned',
                'status' => $review?->status ?? 'blank',
                'allocation' => $total,
                'risk' => $risk,
                'blocker' => $review?->summary ?? $this->reviewBlocker($total, $availability),
            ];
        })
            ->filter(fn (array $item) => $item['status'] !== 'complete' || $item['allocation'] > 1)
            ->sortByDesc(fn (array $item) => match ($item['risk']) {
                'Critical' => 4,
                'High' => 3,
                'Medium' => 2,
                default => 1,
            })
            ->values()
            ->all();
    }

    private function reviewBlocker(float $total, float $availability): string
    {
        if ($total > 1) {
            return 'Over-allocation needs rebalancing before approval.';
        }

        if ($availability > 0) {
            return "There is {$availability} capacity left to assign before the plan is complete.";
        }

        return 'Waiting for reviewer confirmation.';
    }

    private function reviewerLoad(array $queue): array
    {
        return collect($queue)
            ->groupBy('reviewer')
            ->map(function (Collection $items, string $reviewer) {
                $critical = $items->where('risk', 'Critical')->count();
                $open = $items->count();

                return [
                    'reviewer' => $reviewer,
                    'openItems' => $open,
                    'critical' => $critical,
                    'serviceLevel' => $critical > 0 ? 'At risk' : ($open > 2 ? 'Needs attention' : 'Healthy'),
                ];
            })
            ->values()
            ->all();
    }

    private function reviewPlaybook(): array
    {
        return [
            [
                'title' => 'Auto-triage by risk',
                'body' => 'Blank profiles with available capacity and any profile above 1.0 should jump to the top of the queue automatically.',
            ],
            [
                'title' => 'Reviewer context at a glance',
                'body' => 'Each queue item should show total allocation, free capacity, and the blocker without reopening a workbook.',
            ],
            [
                'title' => 'Short review loops',
                'body' => 'Approvals should happen in minutes, not after a reviewer re-reads an entire spreadsheet tab.',
            ],
        ];
    }

    private function projectHighlights(AllocationCycle $cycle): array
    {
        return Project::query()
            ->where('is_active', true)
            ->with([
                'allocations' => fn ($query) => $query
                    ->where('cycle_id', $cycle->id)
                    ->with(['employee.reviews' => fn ($reviewQuery) => $reviewQuery->where('cycle_id', $cycle->id)]),
            ])
            ->orderBy('priority')
            ->orderBy('name')
            ->get()
            ->map(function (Project $project) {
                $allocated = round((float) $project->allocations->sum(fn (Allocation $allocation) => (float) $allocation->effort), 2);
                $coverage = (int) min(100, round(($allocated / max((float) $project->target_capacity, 0.1)) * 100));
                $incompleteReviews = $project->allocations->filter(function (Allocation $allocation) {
                    return ($allocation->employee->reviews->first()?->status ?? 'blank') !== 'complete';
                })->count();
                $overAllocatedContributors = $project->allocations->filter(function (Allocation $allocation) {
                    $total = round((float) $allocation->employee->allocations->sum(fn (Allocation $item) => (float) $item->effort), 2);

                    return $total > 1;
                })->count();

                $health = $this->projectHealth($project, $coverage, $incompleteReviews, $overAllocatedContributors);
                $contributors = $project->allocations
                    ->map(function (Allocation $allocation) {
                        $employee = $allocation->employee;

                        return [
                            'employeeId' => $employee->id,
                            'name' => $employee->preferred_name ?: $employee->name,
                            'fullName' => $employee->name,
                            'stream' => $employee->stream,
                            'title' => $employee->title,
                            'effort' => round((float) $allocation->effort, 2),
                            'reviewStatus' => $employee->reviews->first()?->status ?? 'blank',
                        ];
                    })
                    ->sortByDesc('effort')
                    ->values();

                return [
                    'name' => $project->name,
                    'priority' => $project->priority,
                    'owner' => $project->owner_name,
                    'health' => $health,
                    'coverage' => $coverage,
                    'assignedPeople' => $project->allocations->pluck('employee_id')->unique()->count(),
                    'fte' => $allocated,
                    'contributors' => $contributors->all(),
                    'signal' => $this->projectSignal($project, $coverage, $allocated, $incompleteReviews, $overAllocatedContributors),
                ];
            })
            ->values()
            ->all();
    }

    private function projectHealth(Project $project, int $coverage, int $incompleteReviews, int $overAllocatedContributors): string
    {
        if ($project->type === 'Internal operations' && $coverage >= 50) {
            return 'Hidden load';
        }

        if ($overAllocatedContributors > 0) {
            return 'Concentrated';
        }

        if ($coverage < 60) {
            return 'Opportunity';
        }

        if ($incompleteReviews > 1) {
            return 'Watch';
        }

        return 'Stable';
    }

    private function projectSignal(Project $project, int $coverage, float $allocated, int $incompleteReviews, int $overAllocatedContributors): string
    {
        if ($overAllocatedContributors > 0) {
            return 'Coverage exists, but it depends on people who are already beyond full capacity.';
        }

        if ($coverage < 60) {
            return "Only {$allocated} of {$project->target_capacity} target LOE is currently covered, so available contributors should be routed here faster.";
        }

        if ($incompleteReviews > 1) {
            return 'The staffed picture looks workable, but review reliability is still too uneven for leadership confidence.';
        }

        if ($project->type === 'Internal operations') {
            return 'Internal work is consuming meaningful effort and should stay visible in utilization reporting.';
        }

        return 'Staffing and review quality are strong enough for this project to be monitored, not chased.';
    }

    private function priorityLanes(): array
    {
        return [
            ['lane' => 'Priority A', 'description' => 'Client-critical and flagship product work that should influence recommendations first.'],
            ['lane' => 'Priority B', 'description' => 'Internal platform and process work that should remain visible without crowding urgent delivery.'],
            ['lane' => 'Priority C', 'description' => 'Experimental or opportunistic work that can absorb intentional spare capacity.'],
        ];
    }

    private function leadershipSignals(array $projectHighlights): array
    {
        $watchCount = collect($projectHighlights)->whereIn('health', ['Watch', 'Concentrated'])->count();
        $internalProjects = collect($projectHighlights)->where('health', 'Hidden load')->count();

        return [
            "Leadership can already see {$watchCount} projects that need closer staffing attention.",
            'Completion compliance is now a managed workflow instead of a spreadsheet hope.',
            "{$internalProjects} internal capacity lanes are visible, so non-client effort does not disappear from reporting.",
        ];
    }
}
