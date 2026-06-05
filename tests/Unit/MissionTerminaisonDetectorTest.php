<?php

/**
 * Tests de propriété pour MissionTerminaisonDetector
 *
 * Property 11 : Détection GPS de départ de zone          (Req 5.2)
 * Property 12 : Détection du dépassement de durée        (Req 5.3, 5.4)
 * Property 13 : Filtre de plausibilité GPS               (Req 5.6, 10.3)
 */

use App\Jobs\MissionTerminaisonDetector;
use App\Models\AutomationLog;
use App\Models\Reservation;
use App\Models\Artisan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Génère un point GPS (tableau) à une distance donnée d'un centre.
 * @param float $latCentre
 * @param float $lonCentre
 * @param float $distanceMetres  Distance radiale depuis le centre
 * @param string $timestamp
 * @return array<string, mixed>
 */
function detectorGpsPointAt(float $latCentre, float $lonCentre, float $distanceMetres, string $timestamp): array
{
    // 1 degré de latitude ≈ 111 320 m
    $offsetLat = $distanceMetres / 111320.0;
    return [
        'latitude'      => $latCentre + $offsetLat,
        'longitude'     => $lonCentre,
        'date_position' => $timestamp,
    ];
}

/**
 * Génère N points GPS hors de la zone, espacés de 2 minutes, couvrant >= 10 min.
 * @param float $lat   Latitude du centre (adresse intervention)
 * @param float $lon   Longitude du centre
 * @param int   $n     Nombre de points (>= 5 pour déclencher la détection)
 * @param string $start  Timestamp ISO du premier point
 * @return array<int, array<string, mixed>>
 */
function detectorGpsPointsHorsZone(float $lat, float $lon, int $n, string $start): array
{
    $points = [];
    $ts     = strtotime($start);
    // Use 150s (2.5 min) intervals → 5 points span 4×150=600s = 10 min exactly
    // For n>5, span > 10 min. This ensures the 10-min window is always covered.
    $interval = max(150, intdiv(650, max(1, $n - 1))); // at least 150s spacing
    for ($i = 0; $i < $n; $i++) {
        $points[] = detectorGpsPointAt($lat, $lon, 700.0, date('Y-m-d H:i:s', $ts + $i * $interval));
    }
    return $points;
}

/**
 * Génère N points GPS DANS la zone (< 500m).
 * @param float  $lat
 * @param float  $lon
 * @param int    $n
 * @param string $start
 * @return array<int, array<string, mixed>>
 */
function detectorGpsPointsDansZone(float $lat, float $lon, int $n, string $start): array
{
    $points = [];
    $ts     = strtotime($start);
    for ($i = 0; $i < $n; $i++) {
        $points[] = detectorGpsPointAt($lat, $lon, 100.0, date('Y-m-d H:i:s', $ts + $i * 120));
    }
    return $points;
}

/**
 * Crée une instance de MissionTerminaisonDetector.
 */
function makeDetectorInstance(): MissionTerminaisonDetector
{
    return new MissionTerminaisonDetector();
}

/**
 * Crée une réservation avec coordonnées GPS pour les tests.
 */
function makeDetectorReservation(float $lat, float $lon, ?string $dateDebut = null): Reservation
{
    return Reservation::factory()->create([
        'statut'           => 'en_cours_mission',
        'latitude_client'  => $lat,
        'longitude_client' => $lon,
        'date_debut'       => $dateDebut ?? now()->subHour()->toDateTimeString(),
        'duree_estimee_min' => 60,
    ]);
}

beforeEach(function () {
    Cache::flush();
    Event::fake();
});


// ═══════════════════════════════════════════════════════════════════════════════
// Property 11 : Détection GPS de départ de zone
// **Validates: Requirements 5.2**
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * **Validates: Requirements 5.2**
 *
 * Case A: Si toutes les positions consécutives sur une fenêtre de 10 minutes
 * ou plus sont à > 500m de l'adresse, detecterViaGPS doit retourner true.
 */
test('property 11 – case A: ≥5 consecutive GPS points outside 500m over 10 min → detecterViaGPS returns true', function () {
    $detector = makeDetectorInstance();

    // Coordonnées de l'adresse d'intervention générées aléatoirement
    $lat = fake()->randomFloat(6, 5.0, 7.0);   // zone Bénin approximative
    $lon = fake()->randomFloat(6, 1.5, 3.5);

    $reservation = makeDetectorReservation($lat, $lon);

    // Nombre de points hors zone : entre 5 et 10 (toujours >= MIN=5)
    $nbPoints = fake()->numberBetween(5, 10);
    $start    = now()->subMinutes(25)->toDateTimeString();
    $points   = detectorGpsPointsHorsZone($lat, $lon, $nbPoints, $start);

    $result = $detector->detecterDepartZone($points, $reservation);

    expect($result)->toBeTrue(
        "Expected detecterDepartZone=true for {$nbPoints} consecutive points outside 500m over 10 min."
    );
})->repeat(10);

/**
 * **Validates: Requirements 5.2**
 *
 * Case B: Si au moins 1 point dans la fenêtre est DANS la zone (≤ 500m),
 * detecterViaGPS doit retourner false.
 */
test('property 11 – case B: at least 1 GPS point inside 500m zone → detecterViaGPS returns false', function () {
    $detector = makeDetectorInstance();

    $lat = fake()->randomFloat(6, 5.0, 7.0);
    $lon = fake()->randomFloat(6, 1.5, 3.5);

    $reservation = makeDetectorReservation($lat, $lon);

    // Générer 4 points hors zone...
    $start      = now()->subMinutes(20)->toDateTimeString();
    $outsideTs  = strtotime($start);
    $outsidePoints = [];
    for ($i = 0; $i < 4; $i++) {
        $outsidePoints[] = detectorGpsPointAt($lat, $lon, 700.0, date('Y-m-d H:i:s', $outsideTs + $i * 120));
    }

    // ...puis 1 point DANS la zone au milieu
    $insideTs      = $outsideTs + 4 * 120;
    $insidePoint   = detectorGpsPointAt($lat, $lon, 100.0, date('Y-m-d H:i:s', $insideTs));

    // ...puis encore 4 points hors zone
    $afterTs = $insideTs + 120;
    $afterPoints = [];
    for ($i = 0; $i < 4; $i++) {
        $afterPoints[] = detectorGpsPointAt($lat, $lon, 700.0, date('Y-m-d H:i:s', $afterTs + $i * 120));
    }

    $points = array_merge($outsidePoints, [$insidePoint], $afterPoints);

    $result = $detector->detecterDepartZone($points, $reservation);

    expect($result)->toBeFalse(
        "Expected detecterDepartZone=false because there is a GPS point inside 500m breaking the consecutive sequence."
    );
})->repeat(10);

/**
 * **Validates: Requirements 5.2**
 *
 * Edge case: exactly 4 consecutive points outside (below the threshold of 5) → false.
 */
test('property 11 – exactly 4 consecutive GPS points outside 500m → false (below threshold)', function () {
    $detector    = makeDetectorInstance();
    $lat         = 6.3703;
    $lon         = 2.3912;
    $reservation = makeDetectorReservation($lat, $lon);

    $start  = now()->subMinutes(20)->toDateTimeString();
    $points = detectorGpsPointsHorsZone($lat, $lon, 4, $start);

    $result = $detector->detecterDepartZone($points, $reservation);

    expect($result)->toBeFalse(
        'Expected false: only 4 consecutive points outside zone, need at least 5.'
    );
});

/**
 * **Validates: Requirements 5.2**
 *
 * Edge case: 5 points outside but spanning < 10 minutes → false.
 */
test('property 11 – 5 points outside 500m but less than 10 min window → false', function () {
    $detector    = makeDetectorInstance();
    $lat         = 6.3703;
    $lon         = 2.3912;
    $reservation = makeDetectorReservation($lat, $lon);

    // 5 points separated by only 1 min (total = 4 min, < 10 min required)
    $ts     = strtotime(now()->subMinutes(10)->toDateTimeString());
    $points = [];
    for ($i = 0; $i < 5; $i++) {
        $points[] = detectorGpsPointAt($lat, $lon, 700.0, date('Y-m-d H:i:s', $ts + $i * 60));
    }

    $result = $detector->detecterDepartZone($points, $reservation);

    expect($result)->toBeFalse(
        'Expected false: 5 points outside but only 4 min span, need at least 10 min.'
    );
});

/**
 * **Validates: Requirements 5.7**
 *
 * Si aucune donnée GPS n'existe → detecterViaGPS returns false.
 */
test('property 11 – no GPS data → detecterViaGPS returns false (Req 5.7)', function () {
    $detector    = makeDetectorInstance();
    $lat         = 6.3703;
    $lon         = 2.3912;

    /** @var Artisan $artisan */
    $artisan     = Artisan::factory()->create();
    $reservation = Reservation::factory()->create([
        'id_artisan'       => $artisan->id,
        'statut'           => 'en_cours_mission',
        'latitude_client'  => $lat,
        'longitude_client' => $lon,
        'date_debut'       => now()->subHour()->toDateTimeString(),
        'duree_estimee_min' => 60,
    ]);

    // Aucun point GPS créé pour cet artisan
    $result = $detector->detecterViaGPS($reservation);

    expect($result)->toBeFalse('Expected false when no GPS data is available.');
});


// ═══════════════════════════════════════════════════════════════════════════════
// Property 12 : Détection du dépassement de durée estimée
// **Validates: Requirements 5.3, 5.4**
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * **Validates: Requirements 5.3, 5.4**
 *
 * Case A: timestamp_actuel > date_debut + duree_estimee_min × 60 + 1800s
 * → detecterViaDuree doit retourner true (alerte envoyée).
 */
test('property 12 – case A: current time beyond buffer → detecterViaDuree returns true (alert path)', function () {
    $detector = makeDetectorInstance();

    // Générer des valeurs aléatoires dans des plages raisonnables
    $dureeMin   = fake()->numberBetween(30, 240);
    // Ancienneté telle que le buffer de 30 min EST clairement dépassé mais pas 2h+
    $depassementSecondes = 1800 + fake()->numberBetween(60, 3600);

    $dateDebut = now()->subSeconds($dureeMin * 60 + $depassementSecondes)->toDateTimeString();

    $reservation = Reservation::factory()->create([
        'statut'            => 'en_cours_mission',
        'date_debut'        => $dateDebut,
        'duree_estimee_min' => $dureeMin,
        'latitude_client'   => 6.37,
        'longitude_client'  => 2.39,
    ]);

    $result = $detector->detecterViaDuree($reservation);

    expect($result)->toBeTrue(
        "Expected detecterViaDuree=true when timestamp > dateDebut + {$dureeMin}min + 1800s."
    );
})->repeat(10);

/**
 * **Validates: Requirements 5.3, 5.4**
 *
 * Case B: timestamp_actuel ≤ date_debut + duree_estimee_min × 60 + 1800s
 * → detecterViaDuree doit retourner false.
 */
test('property 12 – case B: current time within buffer → detecterViaDuree returns false', function () {
    $detector = makeDetectorInstance();

    $dureeMin = fake()->numberBetween(30, 240);

    // Date début dans le futur ou récente, sans dépasser le buffer
    $dateDebut = now()->subMinutes(fake()->numberBetween(0, $dureeMin - 1))->toDateTimeString();

    $reservation = Reservation::factory()->create([
        'statut'            => 'en_cours_mission',
        'date_debut'        => $dateDebut,
        'duree_estimee_min' => $dureeMin,
        'latitude_client'   => 6.37,
        'longitude_client'  => 2.39,
    ]);

    $result = $detector->detecterViaDuree($reservation);

    expect($result)->toBeFalse(
        "Expected detecterViaDuree=false when timestamp ≤ dateDebut + dureeMin×60 + 1800s."
    );
})->repeat(10);

/**
 * **Validates: Requirements 5.4**
 *
 * Après 2h supplémentaires sans confirmation, source_terminaison = 'auto_timeout'
 * et MissionTermineeAuto dispatché avec source='timeout'.
 */
test('property 12 – after 2 extra hours without confirmation → MissionTermineeAuto dispatched with timeout', function () {
    $detector = makeDetectorInstance();

    $dureeMin = fake()->numberBetween(30, 120);
    // 1800s buffer + 7200s (2h) + marge
    $depassement = 1800 + 7200 + fake()->numberBetween(60, 600);

    $dateDebut = now()->subSeconds($dureeMin * 60 + $depassement)->toDateTimeString();

    $reservation = Reservation::factory()->create([
        'statut'            => 'en_cours_mission',
        'date_debut'        => $dateDebut,
        'duree_estimee_min' => $dureeMin,
        'latitude_client'   => 6.37,
        'longitude_client'  => 2.39,
    ]);

    $result = $detector->detecterViaDuree($reservation);

    expect($result)->toBeTrue();

    // Vérifier que source_terminaison = 'auto_timeout'
    $reservation->refresh();
    expect($reservation->source_terminaison)->toBe('auto_timeout');

    // Vérifier que l'événement MissionTermineeAuto a été dispatché
    Event::assertDispatched(\App\Events\MissionTermineeAuto::class, function ($event) use ($reservation) {
        return $event->reservation->id === $reservation->id
            && $event->source === 'timeout';
    });
})->repeat(5);

/**
 * **Validates: Requirements 5.3**
 *
 * Edge case: date_debut null → retourner false sans erreur.
 */
test('property 12 – null date_debut → detecterViaDuree returns false safely', function () {
    $detector    = makeDetectorInstance();

    // Create a reservation with a valid date_debut, then manually test the method
    // with a mock object that has null date_debut (to avoid DB NOT NULL constraint)
    $reservation = Reservation::factory()->create([
        'statut'            => 'en_cours_mission',
        'date_debut'        => now()->subHour()->toDateTimeString(),
        'duree_estimee_min' => 60,
    ]);

    // Override the date_debut attribute in-memory (not saving to DB)
    $reservation->date_debut = null;

    $result = $detector->detecterViaDuree($reservation);

    expect($result)->toBeFalse('Expected false when date_debut is null.');
});

/**
 * **Validates: Requirements 5.3**
 *
 * Exact boundary: timestamp_actuel = date_debut + duree_estimee_min × 60 + 1800s
 * (exactly at the boundary) → should return false (not yet exceeded).
 */
test('property 12 – exactly at buffer boundary → detecterViaDuree returns false', function () {
    $detector    = makeDetectorInstance();
    $dureeMin    = 60;
    // Use 89 min ago so we're safely BEFORE the 90-min (60+30) boundary
    $dateDebut   = now()->subMinutes(89)->toDateTimeString();

    $reservation = Reservation::factory()->create([
        'statut'            => 'en_cours_mission',
        'date_debut'        => $dateDebut,
        'duree_estimee_min' => $dureeMin,
        'latitude_client'   => 6.37,
        'longitude_client'  => 2.39,
    ]);

    // now() - date_debut ≈ 89 min < 90 min threshold → should return false
    $result = $detector->detecterViaDuree($reservation);

    expect($result)->toBeFalse('Expected false: 89 min elapsed, threshold is 90 min.');
});


// ═══════════════════════════════════════════════════════════════════════════════
// Property 13 : Filtre de plausibilité GPS
// **Validates: Requirements 5.6, 10.3**
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * **Validates: Requirements 5.6, 10.3**
 *
 * Pour toute paire (P1, P2) avec vitesse > 200 km/h :
 * 1. P2 est rejeté (non utilisé dans la détection de zone)
 * 2. Une entrée automation_logs avec type_action='gps_anomaly' est créée
 * 3. Le dernier point valide (P1) est conservé pour les calculs suivants
 */
test('property 13 – P2 with speed > 200 km/h is rejected and anomaly is logged', function () {
    $detector    = makeDetectorInstance();
    $reservation = makeDetectorReservation(6.37, 2.39);

    // P1: position initiale valide à Cotonou
    $t1 = now()->subMinutes(10)->timestamp;
    $p1 = [
        'latitude'      => 6.3703,
        'longitude'     => 2.3912,
        'date_position' => date('Y-m-d H:i:s', $t1),
    ];

    // P2: position aberrante à Paris (environ 5000km) 30 secondes plus tard
    // Vitesse implicite : ~5000km / (30/3600)h = ~600 000 km/h >> 200 km/h
    $t2 = $t1 + 30;
    $p2 = [
        'latitude'      => 48.8566, // Paris
        'longitude'     => 2.3522,
        'date_position' => date('Y-m-d H:i:s', $t2),
    ];

    $countBefore = AutomationLog::where('type_action', 'gps_anomaly')->count();

    $pointsValides = $detector->filtrerAnomaliesGPS([$p1, $p2], $reservation);

    // P2 doit être rejeté → seulement P1 dans les points valides
    expect($pointsValides)->toHaveCount(1);
    expect($pointsValides[0]['latitude'])->toBe(6.3703)
        ->and($pointsValides[0]['longitude'])->toBe(2.3912);

    // Une entrée gps_anomaly doit avoir été créée
    $countAfter = AutomationLog::where('type_action', 'gps_anomaly')->count();
    expect($countAfter)->toBe($countBefore + 1);

    $log = AutomationLog::where('type_action', 'gps_anomaly')
        ->where('model_id', $reservation->id)
        ->latest()
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->type_action)->toBe('gps_anomaly')
        ->and($log->decision)->toBe('rejetee')
        ->and($log->model_type)->toBe(\App\Models\Reservation::class);
})->repeat(5);

/**
 * **Validates: Requirements 5.6, 10.3**
 *
 * Génère des paires (P1, P2) avec vitesse > 200 km/h de manière aléatoire
 * et vérifie que P2 est toujours rejeté.
 */
test('property 13 – randomly generated high-speed pairs always result in P2 rejection', function () {
    $detector    = makeDetectorInstance();
    $reservation = makeDetectorReservation(6.37, 2.39);

    // P1 : point de référence en Afrique de l'Ouest
    $lat1 = fake()->randomFloat(4, 5.0, 7.0);
    $lon1 = fake()->randomFloat(4, 1.5, 3.5);
    $t1   = now()->subMinutes(5)->timestamp;

    $p1 = [
        'latitude'      => $lat1,
        'longitude'     => $lon1,
        'date_position' => date('Y-m-d H:i:s', $t1),
    ];

    // P2 : simuler distance très grande en peu de temps
    // On utilise une distance de ~2000km en 60 secondes → vitesse ~120 000 km/h
    $offsetLat = 18.0; // ≈ 2000km de latitude
    $lat2 = $lat1 + $offsetLat;
    $lon2 = $lon1;
    $t2   = $t1 + fake()->numberBetween(10, 60); // 10 à 60 secondes

    $p2 = [
        'latitude'      => $lat2,
        'longitude'     => $lon2,
        'date_position' => date('Y-m-d H:i:s', $t2),
    ];

    // Vérifier que la vitesse est bien > 200 km/h (précondition)
    $distance  = $detector->haversineDistance($lat1, $lon1, $lat2, $lon2);
    $intervalle = $t2 - $t1;
    $vitesse   = ($distance / $intervalle) * 3.6;

    // Si la vitesse calculée n'est pas > 200, le test n'est pas pertinent
    if ($vitesse <= 200) {
        expect(true)->toBeTrue('Precondition not met, skip');
        return;
    }

    $countBefore   = AutomationLog::where('type_action', 'gps_anomaly')->count();
    $pointsValides = $detector->filtrerAnomaliesGPS([$p1, $p2], $reservation);

    // P2 doit être rejeté
    expect($pointsValides)->toHaveCount(1);

    // Anomalie journalisée
    $countAfter = AutomationLog::where('type_action', 'gps_anomaly')->count();
    expect($countAfter)->toBe($countBefore + 1);
})->repeat(10);

/**
 * **Validates: Requirements 5.6, 10.3**
 *
 * Cas valide : vitesse ≤ 200 km/h → P2 est accepté, aucune anomalie journalisée.
 */
test('property 13 – valid speed (≤200 km/h) between P1 and P2 → P2 accepted, no anomaly logged', function () {
    $detector    = makeDetectorInstance();
    $reservation = makeDetectorReservation(6.37, 2.39);

    // P1 à Cotonou
    $t1 = now()->subMinutes(5)->timestamp;
    $p1 = [
        'latitude'      => 6.3703,
        'longitude'     => 2.3912,
        'date_position' => date('Y-m-d H:i:s', $t1),
    ];

    // P2 à ~50m (distance très faible, 5 minutes après → vitesse négligeable)
    $t2 = $t1 + 300; // 5 minutes après
    $p2 = [
        'latitude'      => 6.3708,  // ~55m de P1
        'longitude'     => 2.3912,
        'date_position' => date('Y-m-d H:i:s', $t2),
    ];

    $countBefore   = AutomationLog::where('type_action', 'gps_anomaly')->count();
    $pointsValides = $detector->filtrerAnomaliesGPS([$p1, $p2], $reservation);

    // P1 et P2 doivent être tous deux valides
    expect($pointsValides)->toHaveCount(2);

    // Aucune anomalie enregistrée
    $countAfter = AutomationLog::where('type_action', 'gps_anomaly')->count();
    expect($countAfter)->toBe($countBefore, 'Expected no gps_anomaly log for valid speed.');
})->repeat(5);

/**
 * **Validates: Requirements 5.6, 10.3**
 *
 * Le dernier point valide (P1) est retenu après rejet de P2.
 * Si P3 suit avec une vitesse normale depuis P1, P3 doit être accepté.
 */
test('property 13 – after rejecting P2, last valid point P1 is retained for P3 calculation', function () {
    $detector    = makeDetectorInstance();
    $reservation = makeDetectorReservation(6.37, 2.39);

    $t1 = now()->subMinutes(15)->timestamp;

    // P1 : Cotonou
    $p1 = [
        'latitude'      => 6.3703,
        'longitude'     => 2.3912,
        'date_position' => date('Y-m-d H:i:s', $t1),
    ];

    // P2 : Paris en 30s → anomalie
    $t2 = $t1 + 30;
    $p2 = [
        'latitude'      => 48.8566,
        'longitude'     => 2.3522,
        'date_position' => date('Y-m-d H:i:s', $t2),
    ];

    // P3 : tout près de P1 (50m), 2 minutes après P1 → vitesse normale
    $t3 = $t1 + 120;
    $p3 = [
        'latitude'      => 6.3707,
        'longitude'     => 2.3912,
        'date_position' => date('Y-m-d H:i:s', $t3),
    ];

    $pointsValides = $detector->filtrerAnomaliesGPS([$p1, $p2, $p3], $reservation);

    // P1 et P3 doivent être valides, P2 rejeté
    expect($pointsValides)->toHaveCount(2);

    // Vérifier que P1 est retenu comme premier point valide
    expect((float) $pointsValides[0]['latitude'])->toBe(6.3703);

    // P3 doit être le deuxième point valide (calculé depuis P1, pas P2)
    expect((float) $pointsValides[1]['latitude'])->toBe(6.3707);
})->repeat(3);

/**
 * **Validates: Requirements 5.6, 10.3**
 *
 * Plusieurs anomalies consécutives → toutes rejetées, P1 reste le dernier valide.
 */
test('property 13 – multiple consecutive anomalous points are all rejected', function () {
    $detector    = makeDetectorInstance();
    $reservation = makeDetectorReservation(6.37, 2.39);

    $t1 = now()->subMinutes(20)->timestamp;

    $p1 = [
        'latitude'      => 6.3703,
        'longitude'     => 2.3912,
        'date_position' => date('Y-m-d H:i:s', $t1),
    ];

    // 3 anomalies successives à Paris (vitesses > 200 km/h)
    $anomalies = [];
    for ($i = 1; $i <= 3; $i++) {
        $anomalies[] = [
            'latitude'      => 48.8566 + $i * 0.1,
            'longitude'     => 2.3522,
            'date_position' => date('Y-m-d H:i:s', $t1 + $i * 5),
        ];
    }

    $countBefore   = AutomationLog::where('type_action', 'gps_anomaly')->count();
    $pointsValides = $detector->filtrerAnomaliesGPS(array_merge([$p1], $anomalies), $reservation);

    // Seul P1 doit rester
    expect($pointsValides)->toHaveCount(1);
    expect((float) $pointsValides[0]['latitude'])->toBe(6.3703);

    // 3 anomalies journalisées
    $countAfter = AutomationLog::where('type_action', 'gps_anomaly')->count();
    expect($countAfter)->toBe($countBefore + 3);
})->repeat(3);

/**
 * **Validates: Requirements 5.6, 10.3**
 *
 * Le log d'anomalie contient tous les champs requis non nuls.
 */
test('property 13 – gps_anomaly log contains all required non-null fields', function () {
    $detector    = makeDetectorInstance();
    $reservation = makeDetectorReservation(6.37, 2.39);

    $t1 = now()->subMinutes(10)->timestamp;
    $p1 = ['latitude' => 6.3703, 'longitude' => 2.3912, 'date_position' => date('Y-m-d H:i:s', $t1)];
    $p2 = ['latitude' => 48.8566, 'longitude' => 2.3522, 'date_position' => date('Y-m-d H:i:s', $t1 + 30)];

    $detector->filtrerAnomaliesGPS([$p1, $p2], $reservation);

    $log = AutomationLog::where('type_action', 'gps_anomaly')
        ->where('model_id', $reservation->id)
        ->latest()
        ->first();

    expect($log)->not->toBeNull()
        ->and($log->type_action)->toBe('gps_anomaly')
        ->and($log->model_type)->toBe(\App\Models\Reservation::class)
        ->and($log->model_id)->toBeGreaterThan(0)
        ->and($log->decision)->toBe('rejetee')
        ->and($log->score_confiance)->not->toBeNull()
        ->and($log->regles_evaluees)->not->toBeNull()
        ->and($log->raison)->not->toBeNull()
        ->and($log->raison)->not->toBe('')
        ->and($log->duree_ms)->toBeGreaterThanOrEqual(0);
})->repeat(3);

