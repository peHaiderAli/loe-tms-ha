<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('allocation_reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->foreignId('cycle_id')->constrained('allocation_cycles')->cascadeOnDelete();
            $table->string('reviewer_name')->nullable();
            $table->string('status')->default('blank');
            $table->text('summary')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'cycle_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('allocation_reviews');
    }
};
