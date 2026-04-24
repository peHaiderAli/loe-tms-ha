<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AllocationChangeLog extends Model
{
    protected $fillable = [
        'employee_id',
        'cycle_id',
        'changed_by_user_id',
        'before_total',
        'after_total',
        'before_snapshot',
        'after_snapshot',
        'summary',
    ];

    protected function casts(): array
    {
        return [
            'before_total' => 'decimal:2',
            'after_total' => 'decimal:2',
            'before_snapshot' => 'array',
            'after_snapshot' => 'array',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function cycle(): BelongsTo
    {
        return $this->belongsTo(AllocationCycle::class, 'cycle_id');
    }

    public function changedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'changed_by_user_id');
    }
}
