<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Allocation extends Model
{
    protected $fillable = [
        'employee_id',
        'project_id',
        'cycle_id',
        'effort',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'effort' => 'decimal:2',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(AllocationCycle::class);
    }
}
