<?php

use App\Http\Controllers\LoeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function (Request $request) {
    return $request->user()
        ? redirect()->route('dashboard')
        : redirect()->route('login');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [LoeController::class, 'dashboard'])->name('dashboard');
    Route::get('workspace', [LoeController::class, 'workspace'])->name('loe.workspace');
    Route::put('workspace/{employee}', [LoeController::class, 'updateWorkspace'])->name('loe.workspace.update');
    Route::get('utilization', [LoeController::class, 'utilization'])->name('loe.utilization');
    Route::put('utilization/{employee}', [LoeController::class, 'updateUtilization'])->name('loe.utilization.update');
    Route::get('reviews', [LoeController::class, 'reviews'])->name('loe.reviews');
    Route::patch('reviews/{review}', [LoeController::class, 'updateReview'])->name('loe.reviews.update');
    Route::post('reviews/{review}/remind', [LoeController::class, 'sendReviewReminder'])->name('loe.reviews.remind');
    Route::get('projects', [LoeController::class, 'projects'])->name('loe.projects');
    Route::get('imports', [LoeController::class, 'imports'])->name('loe.imports');
    Route::post('imports', [LoeController::class, 'storeImport'])->name('loe.imports.store');
    Route::get('access', [LoeController::class, 'access'])->name('loe.access');
    Route::post('access', [LoeController::class, 'storeAccess'])->name('loe.access.store');
    Route::patch('access/employees/{employee}/reviewer', [LoeController::class, 'updateReviewerAssignment'])->name('loe.access.reviewer.update');
    Route::post('access/users/{user}/link', [LoeController::class, 'generateAccessLink'])->name('loe.access.link');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
