<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SiomaController;
use App\Http\Controllers\SpotController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Sioma API proxy routes
    Route::prefix('api/sioma')->group(function () {
        Route::get('/fincas', [SiomaController::class, 'getFincas'])->name('sioma.fincas');
        Route::get('/lotes', [SiomaController::class, 'getLotes'])->name('sioma.lotes');
    });
    
    // Spots upload and validation
    Route::prefix('api/v1/spots')->group(function () {
        Route::post('/upload', [SpotController::class, 'upload'])->name('spots.upload');
        Route::post('/download-corrected', [SpotController::class, 'downloadCorrected'])->name('spots.download-corrected');
        Route::post('/send-sioma', [SpotController::class, 'sendToSioma'])->name('spots.send-sioma');
    });
});

require __DIR__.'/auth.php';
