<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cycle_id')->constrained('allocation_cycles')->cascadeOnDelete();
            $table->decimal('effort', 4, 2);
            $table->text('note')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'project_id', 'cycle_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allocations');
    }
};
