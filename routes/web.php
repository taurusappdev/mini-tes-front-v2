<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Admin\PanelController;
use App\Http\Controllers\AsistenteController;

Route::redirect('/', '/admin/panel');

Route::prefix('admin')->name('admin.')->group(function () {
    Route::get('/panel',      [PanelController::class, 'panel'])->name('panel');
    Route::get('/planeacion', [PanelController::class, 'planeacion'])->name('planeacion');
    Route::get('/checklists', [PanelController::class, 'checklists'])->name('checklists');
    Route::get('/tareas',     [PanelController::class, 'tareas'])->name('tareas');
    Route::get('/acciones',   [PanelController::class, 'acciones'])->name('acciones');
    Route::get('/dashboard',  [PanelController::class, 'dashboard'])->name('dashboard');

    // NUEVO: token efímero para Realtime (Laravel solo proxy)
    // GET simple (recomendado) + POST (compatibilidad con tu JS actual)
    Route::get('/asistente/realtime-token', [AsistenteController::class, 'realtimeToken'])
        ->name('asistente.realtimeToken');

    Route::post('/asistente/realtime-token', [AsistenteController::class, 'realtimeToken']);

    Route::post('/asistente', [AsistenteController::class, 'ask'])->name('asistente.ask');
});
