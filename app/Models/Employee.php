<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Employee extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'preferred_name',
        'email',
        'stream',
        'skills',
        'title',
        'location',
        'start_date',
        'onboarding_mentor',
        'growth_partner',
        'reviewer_name',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(Allocation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(AllocationReview::class);
    }

    public function utilizations(): HasMany
    {
        return $this->hasMany(Utilization::class);
    }

    public function utilizationSubmissions(): HasMany
    {
        return $this->hasMany(UtilizationSubmission::class);
    }

    public function allocationChangeLogs(): HasMany
    {
        return $this->hasMany(AllocationChangeLog::class);
    }
}
