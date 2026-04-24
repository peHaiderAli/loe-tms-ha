<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class AllocationCycle extends Model
{
    protected $fillable = [
        'name',
        'starts_on',
        'ends_on',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'starts_on' => 'date',
            'ends_on' => 'date',
            'is_active' => 'boolean',
        ];
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(Allocation::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(AllocationReview::class, 'cycle_id');
    }

    public function utilizations(): HasMany
    {
        return $this->hasMany(Utilization::class, 'cycle_id');
    }

    public function utilizationSubmissions(): HasMany
    {
        return $this->hasMany(UtilizationSubmission::class, 'cycle_id');
    }

    public function allocationChangeLogs(): HasMany
    {
        return $this->hasMany(AllocationChangeLog::class, 'cycle_id');
    }
}
