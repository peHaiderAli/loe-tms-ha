<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'priority',
        'type',
        'owner_name',
        'status',
        'target_capacity',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'target_capacity' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function allocations(): HasMany
    {
        return $this->hasMany(Allocation::class);
    }

    public function utilizations(): HasMany
    {
        return $this->hasMany(Utilization::class);
    }
}
