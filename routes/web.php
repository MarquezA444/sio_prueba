<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SiomaController;
use App\Http\Controllers\SpotController;
use App\Http\Controllers\MapController;
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

// Sioma API proxy routes - Sin autenticación para debugging
Route::prefix('api/sioma')->group(function () {
    Route::get('/fincas', [SiomaController::class, 'getFincas'])->name('sioma.fincas');
    Route::get('/lotes', [SiomaController::class, 'getLotes'])->name('sioma.lotes');
    Route::get('/debug', [SiomaController::class, 'debug'])->name('sioma.debug');
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    
    // Map and spots visualization routes
    Route::prefix('api/v1/map')->group(function () {
        Route::post('/upload-spots', [MapController::class, 'uploadSpots'])->name('map.upload-spots');
        Route::post('/get-spots-data', [MapController::class, 'getSpotsData'])->name('map.get-spots-data');
        Route::post('/send-to-sioma', [MapController::class, 'sendSpotsToSioma'])->name('map.send-to-sioma');
        Route::post('/download-corrected', [MapController::class, 'downloadCorrectedFile'])->name('map.download-corrected');
        Route::get('/config', [MapController::class, 'getMapConfig'])->name('map.config');
        Route::post('/stats', [MapController::class, 'getSpotsStats'])->name('map.stats');
    });
    
    // Spots upload and validation
    Route::prefix('api/v1/spots')->group(function () {
        Route::post('/upload', [SpotController::class, 'upload'])->name('spots.upload');
        Route::post('/download-corrected', [SpotController::class, 'downloadCorrected'])->name('spots.download-corrected');
        Route::post('/send-sioma', [SpotController::class, 'sendToSioma'])->name('spots.send-sioma');
    });
});

require __DIR__.'/auth.php';
