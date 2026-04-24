<?php

namespace Database\Seeders;

use App\Models\Allocation;
use App\Models\AllocationCycle;
use App\Models\AllocationReview;
use App\Models\Employee;
use App\Models\Project;
use App\Models\User;
use App\Models\Utilization;
use App\Models\UtilizationSubmission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::updateOrCreate(
            ['email' => 'admin@loeatlas.test'],
            [
                'name' => 'LoE Admin',
                'role' => 'admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $workspaceUser = User::updateOrCreate(
            ['email' => 'asad@loeatlas.test'],
            [
                'name' => 'Muhammad Asad',
                'role' => 'employee',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        User::updateOrCreate(
            ['email' => 'edwin@loeatlas.test'],
            [
                'name' => 'Edwin Reviewer',
                'role' => 'reviewer',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ],
        );

        $cycle = AllocationCycle::updateOrCreate(
            ['name' => 'April 2026'],
            [
                'starts_on' => '2026-04-01',
                'ends_on' => '2026-04-30',
                'is_active' => true,
            ],
        );

        AllocationCycle::whereKeyNot($cycle->id)->update(['is_active' => false]);

        $projects = collect([
            ['name' => 'ERM: Assess', 'priority' => 'A', 'type' => 'Client delivery', 'owner_name' => 'Aisha', 'target_capacity' => 4.50],
            ['name' => 'FinTech: LoanEdge', 'priority' => 'A', 'type' => 'Product', 'owner_name' => 'Farhan', 'target_capacity' => 3.50],
            ['name' => 'Fintech: BDC', 'priority' => 'A', 'type' => 'Product', 'owner_name' => 'M. Sufian', 'target_capacity' => 2.50],
            ['name' => 'PixelEdge: Platform (MVP, PMF)', 'priority' => 'B', 'type' => 'Internal platform', 'owner_name' => 'Platform leads', 'target_capacity' => 2.00],
            ['name' => 'PixelEdge: Processes', 'priority' => 'B', 'type' => 'Internal operations', 'owner_name' => 'Operations', 'target_capacity' => 2.00],
            ['name' => 'HSF - Product', 'priority' => 'A', 'type' => 'Client delivery', 'owner_name' => 'Salesforce leads', 'target_capacity' => 2.00],
        ])->mapWithKeys(function (array $project) {
            $record = Project::updateOrCreate(
                ['slug' => Str::slug($project['name'])],
                $project + ['status' => 'active', 'is_active' => true],
            );

            return [$project['name'] => $record];
        });

        $employees = collect([
            [
                'name' => 'Muhammad Asad',
                'preferred_name' => 'Asad',
                'email' => 'asad@loeatlas.test',
                'stream' => 'Engineering',
                'skills' => 'Backend',
                'title' => 'Software Engineer',
                'location' => 'Karachi',
                'start_date' => '2023-06-16',
                'onboarding_mentor' => 'N/A',
                'growth_partner' => 'Edwin',
                'reviewer_name' => 'Edwin',
                'user_id' => $workspaceUser->id,
            ],
            [
                'name' => 'Saleem Muhammad',
                'preferred_name' => 'Saleem',
                'email' => 'saleem@loeatlas.test',
                'stream' => 'Engineering',
                'skills' => 'Backend',
                'title' => 'Senior Software Engineer',
                'location' => 'Karachi',
                'start_date' => '2023-02-15',
                'onboarding_mentor' => 'N/A',
                'growth_partner' => 'Micah',
                'reviewer_name' => 'Micah',
            ],
            [
                'name' => 'Muhammad Osama',
                'preferred_name' => 'Osama',
                'email' => 'osama@loeatlas.test',
                'stream' => 'Engineering',
                'skills' => 'Backend',
                'title' => 'Staff Software Engineer',
                'location' => 'Karachi',
                'start_date' => '2022-09-01',
                'onboarding_mentor' => 'N/A',
                'growth_partner' => 'Micah',
                'reviewer_name' => 'Micah',
            ],
            [
                'name' => 'Ali Jawed',
                'preferred_name' => 'Ali',
                'email' => 'ali.jawed@loeatlas.test',
                'stream' => 'Engineering',
                'skills' => 'Backend',
                'title' => 'Staff Software Engineer',
                'location' => 'Karachi',
                'start_date' => '2023-01-09',
                'onboarding_mentor' => 'N/A',
                'growth_partner' => 'Mauizah',
                'reviewer_name' => 'Micah',
            ],
            [
                'name' => 'Aisha Farouq',
                'preferred_name' => 'Aisha',
                'email' => 'aisha@loeatlas.test',
                'stream' => 'Experience',
                'skills' => 'Research & QA',
                'title' => 'Staff Experience Analyst',
                'location' => 'Northampton',
                'start_date' => null,
                'onboarding_mentor' => 'N/A',
                'growth_partner' => 'Micah',
                'reviewer_name' => 'Annie',
            ],
            [
                'name' => 'Damaris Onyango',
                'preferred_name' => 'Damaris',
                'email' => 'damaris@loeatlas.test',
                'stream' => 'Experience',
                'skills' => 'Research & QA',
                'title' => 'Senior Experience Analyst',
                'location' => 'Nairobi',
                'start_date' => '2022-03-01',
                'onboarding_mentor' => 'N/A',
                'growth_partner' => 'Ali',
                'reviewer_name' => 'Aisha',
            ],
            [
                'name' => 'Benjamin Keya',
                'preferred_name' => 'Benjamin',
                'email' => 'benjamin@loeatlas.test',
                'stream' => 'Experience',
                'skills' => 'QA Analyst',
                'title' => 'Senior Experience Analyst',
                'location' => 'Nairobi',
                'start_date' => '2022-04-01',
                'onboarding_mentor' => 'N/A',
                'growth_partner' => 'Damaris',
                'reviewer_name' => 'Damaris',
            ],
            [
                'name' => 'Mugogo Janet',
                'preferred_name' => 'Janet',
                'email' => 'janet@loeatlas.test',
                'stream' => 'Experience',
                'skills' => 'Research',
                'title' => 'Staff Experience Analyst',
                'location' => 'Nairobi',
                'start_date' => '2021-10-10',
                'onboarding_mentor' => 'N/A',
                'growth_partner' => 'Damaris',
                'reviewer_name' => 'Damaris',
            ],
            [
                'name' => 'Tyler Page',
                'preferred_name' => 'Tyler',
                'email' => 'tyler@loeatlas.test',
                'stream' => 'Experience',
                'skills' => 'Research',
                'title' => 'Experience Analyst',
                'location' => 'Northampton',
                'start_date' => '2025-01-15',
                'onboarding_mentor' => 'Aisha',
                'growth_partner' => 'Annie',
                'reviewer_name' => 'Annie',
            ],
            [
                'name' => 'Mehak Rehman',
                'preferred_name' => 'Mehak',
                'email' => 'mehak@loeatlas.test',
                'stream' => 'HR/Admin',
                'skills' => 'Operations',
                'title' => 'People Operations Specialist',
                'location' => 'Karachi',
                'start_date' => '2024-01-08',
                'onboarding_mentor' => 'N/A',
                'growth_partner' => 'Aisha',
                'reviewer_name' => 'Aisha',
            ],
        ])->mapWithKeys(function (array $employee) {
            $record = Employee::updateOrCreate(
                ['email' => $employee['email']],
                $employee + ['is_active' => true],
            );

            return [$employee['name'] => $record];
        });

        $reviews = [
            'Muhammad Asad' => ['status' => 'blank', 'summary' => 'Needs placement for remaining 0.30 capacity.'],
            'Saleem Muhammad' => ['status' => 'blank', 'summary' => 'Current work is fragmented across three smaller assignments.'],
            'Muhammad Osama' => ['status' => 'blank', 'summary' => 'Delivery load exceeds capacity with no reviewer note.'],
            'Ali Jawed' => ['status' => 'in_progress', 'summary' => 'Main work is stable, but reviewer has asked for clearer internal allocation notes.'],
            'Aisha Farouq' => ['status' => 'blank', 'summary' => 'Needs final confirmation across three internal lanes.'],
            'Damaris Onyango' => ['status' => 'blank', 'summary' => 'Available capacity is hidden unless reviewer follows up.'],
            'Benjamin Keya' => ['status' => 'in_progress', 'summary' => 'Suggested for extra platform support if current cycle stays below 1.0.'],
            'Mugogo Janet' => ['status' => 'in_progress', 'summary' => 'Over-allocation needs rebalancing before approval.'],
            'Tyler Page' => ['status' => 'complete', 'summary' => 'Split looks healthy after reviewer confirmation.'],
            'Mehak Rehman' => ['status' => 'complete', 'summary' => 'Operations load is stable and fully captured.'],
        ];

        foreach ($employees as $name => $employee) {
            $review = $reviews[$name];

            AllocationReview::updateOrCreate(
                ['employee_id' => $employee->id, 'cycle_id' => $cycle->id],
                [
                    'reviewer_name' => $employee->reviewer_name,
                    'status' => $review['status'],
                    'summary' => $review['summary'],
                    'submitted_at' => $review['status'] === 'blank' ? null : now()->subDays(2),
                    'reviewed_at' => $review['status'] === 'complete' ? now()->subDay() : null,
                ],
            );
        }

        $allocations = [
            'Muhammad Asad' => [
                ['ERM: Assess', 0.70],
            ],
            'Saleem Muhammad' => [
                ['FinTech: LoanEdge', 0.20],
                ['PixelEdge: Processes', 0.20],
                ['HSF - Product', 0.10],
            ],
            'Muhammad Osama' => [
                ['FinTech: LoanEdge', 1.00],
                ['PixelEdge: Processes', 0.04],
            ],
            'Ali Jawed' => [
                ['ERM: Assess', 0.90],
                ['PixelEdge: Processes', 0.10],
            ],
            'Aisha Farouq' => [
                ['ERM: Assess', 0.10],
                ['PixelEdge: Processes', 0.20],
                ['PixelEdge: Platform (MVP, PMF)', 0.70],
            ],
            'Damaris Onyango' => [
                ['ERM: Assess', 0.70],
            ],
            'Benjamin Keya' => [
                ['ERM: Assess', 0.40],
                ['PixelEdge: Platform (MVP, PMF)', 0.30],
            ],
            'Mugogo Janet' => [
                ['ERM: Assess', 0.30],
                ['Fintech: BDC', 0.40],
                ['PixelEdge: Processes', 0.05],
                ['HSF - Product', 0.30],
            ],
            'Tyler Page' => [
                ['ERM: Assess', 0.50],
                ['PixelEdge: Processes', 0.30],
            ],
            'Mehak Rehman' => [
                ['PixelEdge: Processes', 1.00],
            ],
        ];

        foreach ($employees as $name => $employee) {
            Allocation::where('employee_id', $employee->id)->where('cycle_id', $cycle->id)->delete();

            foreach ($allocations[$name] as [$projectName, $effort]) {
                Allocation::create([
                    'employee_id' => $employee->id,
                    'project_id' => $projects[$projectName]->id,
                    'cycle_id' => $cycle->id,
                    'effort' => $effort,
                ]);
            }
        }

        $utilizations = [
            'Muhammad Asad' => [
                ['ERM: Assess', 0.65, 'Spent slightly less time than planned after one deliverable moved.'],
                ['PixelEdge: Processes', 0.15, 'Helped with internal process cleanup late in the month.'],
            ],
            'Ali Jawed' => [
                ['ERM: Assess', 0.95, 'Stayed close to plan on primary delivery.'],
                ['PixelEdge: Processes', 0.05, 'Less internal support than originally expected.'],
            ],
            'Tyler Page' => [
                ['ERM: Assess', 0.40, 'Research handoff finished earlier than forecast.'],
                ['PixelEdge: Processes', 0.35, 'Spent more effort documenting process updates.'],
            ],
            'Mehak Rehman' => [
                ['PixelEdge: Processes', 1.00, 'Operations effort fully landed in the expected lane.'],
            ],
        ];

        foreach ($employees as $name => $employee) {
            Utilization::where('employee_id', $employee->id)->where('cycle_id', $cycle->id)->delete();

            if (! isset($utilizations[$name])) {
                UtilizationSubmission::updateOrCreate(
                    ['employee_id' => $employee->id, 'cycle_id' => $cycle->id],
                    ['status' => 'blank', 'submitted_at' => null, 'last_reminded_at' => null],
                );

                continue;
            }

            foreach ($utilizations[$name] as [$projectName, $effort, $note]) {
                Utilization::create([
                    'employee_id' => $employee->id,
                    'project_id' => $projects[$projectName]->id,
                    'cycle_id' => $cycle->id,
                    'effort' => $effort,
                    'note' => $note,
                ]);
            }

            UtilizationSubmission::updateOrCreate(
                ['employee_id' => $employee->id, 'cycle_id' => $cycle->id],
                ['status' => 'submitted', 'submitted_at' => now()->subDay(), 'last_reminded_at' => null],
            );
        }
    }
}
