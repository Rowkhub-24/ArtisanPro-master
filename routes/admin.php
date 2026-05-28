<?php

use App\Http\Controllers\Admin\ArtisanController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\LitigeController;
use App\Http\Controllers\Admin\PaiementController;
use App\Http\Controllers\Admin\PartenaireController;
use App\Http\Controllers\Admin\ReservationController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\AvisController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {

    // Dashboard
    Route::get('/', DashboardController::class)->name('dashboard');

    // Utilisateurs
    Route::get('users',                    [UserController::class, 'index'])->name('users.index');
    Route::get('users/{user}',             [UserController::class, 'show'])->name('users.show');
    Route::patch('users/{user}/statut',    [UserController::class, 'updateStatut'])->name('users.statut');
    Route::delete('users/{user}',          [UserController::class, 'destroy'])->name('users.destroy');

    // Artisans
    Route::get('artisans',                       [ArtisanController::class, 'index'])->name('artisans.index');
    Route::get('artisans/{artisan}',             [ArtisanController::class, 'show'])->name('artisans.show');
    Route::patch('artisans/{artisan}/badge',     [ArtisanController::class, 'updateBadge'])->name('artisans.badge');

    // Catégories
    Route::get('categories',              [CategoryController::class, 'index'])->name('categories.index');
    Route::post('categories',             [CategoryController::class, 'store'])->name('categories.store');
    Route::patch('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}',[CategoryController::class, 'destroy'])->name('categories.destroy');

    // Réservations
    Route::get('reservations', [ReservationController::class, 'index'])->name('reservations.index');

    // Paiements
    Route::get('paiements', [PaiementController::class, 'index'])->name('paiements.index');
    Route::get('paiements/export', [PaiementController::class, 'export'])->name('paiements.export');

    // Avis — modération
    Route::get('avis',                        [AvisController::class, 'index'])->name('avis.index');
    Route::patch('avis/{avis}/masquer',       [AvisController::class, 'masquer'])->name('avis.masquer');
    Route::patch('avis/{avis}/restaurer',     [AvisController::class, 'restaurer'])->name('avis.restaurer');
    Route::delete('avis/{avis}',              [AvisController::class, 'supprimer'])->name('avis.supprimer');

    // Litiges
    Route::get('litiges',                          [LitigeController::class, 'index'])->name('litiges.index');
    Route::get('litiges/{litige}',                 [LitigeController::class, 'show'])->name('litiges.show');
    Route::patch('litiges/{litige}/statut',        [LitigeController::class, 'updateStatut'])->name('litiges.statut');

    // Partenaires
    Route::get('partenaires',                      [PartenaireController::class, 'index'])->name('partenaires.index');
    Route::post('partenaires',                     [PartenaireController::class, 'store'])->name('partenaires.store');
    Route::patch('partenaires/{partenaire}',       [PartenaireController::class, 'update'])->name('partenaires.update');
    Route::delete('partenaires/{partenaire}',      [PartenaireController::class, 'destroy'])->name('partenaires.destroy');
    Route::patch('partenaires/{partenaire}/actif', [PartenaireController::class, 'toggleActif'])->name('partenaires.actif');

    // Rapports / analytics
    Route::get('reports', \App\Http\Controllers\Portal\AdminReportsController::class)->name('reports');
});
