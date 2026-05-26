<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Assigne des coordonnées GPS précises dans Porto-Novo aux artisans
 * sans latitude/longitude, basées sur les quartiers officiels des 5 arrondissements.
 */
return new class extends Migration
{
    /**
     * Quartiers officiels de Porto-Novo avec coordonnées GPS approximatives.
     * Source : répartition officielle des 5 arrondissements de Porto-Novo.
     */
    private array $quartiers = [
        // ── 1er Arrondissement ──────────────────────────────────────────────
        ['nom' => 'Accron-Gogankomey',        'lat' => 6.4850, 'lng' => 2.6150],
        ['nom' => 'Adjègounlè',               'lat' => 6.4870, 'lng' => 2.6180],
        ['nom' => 'Adomey',                   'lat' => 6.4830, 'lng' => 2.6120],
        ['nom' => 'Ahouantikomey',            'lat' => 6.4860, 'lng' => 2.6200],
        ['nom' => 'Akpassa Odo Oba',          'lat' => 6.4840, 'lng' => 2.6160],
        ['nom' => 'Avassa Bagoro Agbokomey',  'lat' => 6.4820, 'lng' => 2.6140],
        ['nom' => 'Ayétoro',                  'lat' => 6.4880, 'lng' => 2.6220],
        ['nom' => 'Ayimlonfidé',              'lat' => 6.4810, 'lng' => 2.6130],
        ['nom' => 'Lokossa 1er',              'lat' => 6.4890, 'lng' => 2.6170],
        ['nom' => 'Oganla-Gare-Est',          'lat' => 6.4900, 'lng' => 2.6250],
        ['nom' => 'Sadognon-Adjégounlè',      'lat' => 6.4855, 'lng' => 2.6190],
        ['nom' => 'Sadognon-Woussa',          'lat' => 6.4845, 'lng' => 2.6175],
        ['nom' => 'Sagbo Kossoukodé',         'lat' => 6.4825, 'lng' => 2.6155],
        ['nom' => 'Sokomey-Toffinkomey',      'lat' => 6.4835, 'lng' => 2.6165],
        ['nom' => 'Togoh-Adankomey',          'lat' => 6.4815, 'lng' => 2.6145],

        // ── 2e Arrondissement ──────────────────────────────────────────────
        ['nom' => 'Agbokou Aga',              'lat' => 6.4960, 'lng' => 2.6280],
        ['nom' => 'Agbokou Bassodji Mairie',  'lat' => 6.4970, 'lng' => 2.6300],
        ['nom' => 'Agbokou Centre social',    'lat' => 6.4965, 'lng' => 2.6290],
        ['nom' => 'Agbokou Odo',              'lat' => 6.4955, 'lng' => 2.6270],
        ['nom' => 'Attakè Olory-Togbé',       'lat' => 6.4980, 'lng' => 2.6320],
        ['nom' => 'Attakè Yidi',              'lat' => 6.4975, 'lng' => 2.6310],
        ['nom' => 'Djègan Daho',              'lat' => 6.4990, 'lng' => 2.6340],
        ['nom' => 'Donoukin Lissèssa',        'lat' => 6.4985, 'lng' => 2.6330],
        ['nom' => 'Hinkoudé',                 'lat' => 6.5000, 'lng' => 2.6350],
        ['nom' => 'Kandévié Radio Hokon',     'lat' => 6.4950, 'lng' => 2.6260],
        ['nom' => 'Koutongbé',                'lat' => 6.4945, 'lng' => 2.6250],
        ['nom' => 'Sèdjèko',                  'lat' => 6.4940, 'lng' => 2.6240],

        // ── 3e Arrondissement ──────────────────────────────────────────────
        ['nom' => 'Adjina Nord',              'lat' => 6.5020, 'lng' => 2.6380],
        ['nom' => 'Adjina Sud',               'lat' => 6.5010, 'lng' => 2.6370],
        ['nom' => 'Avakpa Kpodji',            'lat' => 6.5030, 'lng' => 2.6400],
        ['nom' => 'Avakpa-Tokpa',             'lat' => 6.5025, 'lng' => 2.6390],
        ['nom' => 'Djassin Daho',             'lat' => 6.4920, 'lng' => 2.6200],
        ['nom' => 'Djassin Zounmè',           'lat' => 6.4910, 'lng' => 2.6190],
        ['nom' => 'Foun-Foun Djaguidi',       'lat' => 6.5040, 'lng' => 2.6420],
        ['nom' => 'Foun-Foun Gbègo',          'lat' => 6.5035, 'lng' => 2.6410],
        ['nom' => 'Foun-Foun Sodji',          'lat' => 6.5045, 'lng' => 2.6430],
        ['nom' => 'Foun-Foun Tokpa',          'lat' => 6.5050, 'lng' => 2.6440],

        // ── 4e Arrondissement ──────────────────────────────────────────────
        ['nom' => 'Anavié',                   'lat' => 6.5060, 'lng' => 2.6460],
        ['nom' => 'Anavié Voirie',            'lat' => 6.5065, 'lng' => 2.6470],
        ['nom' => 'Djègan Kpèvi',             'lat' => 6.5070, 'lng' => 2.6480],
        ['nom' => 'Dodji',                    'lat' => 6.5080, 'lng' => 2.6500],
        ['nom' => 'Gbèdjromèdé Fusion',       'lat' => 6.5090, 'lng' => 2.6520],
        ['nom' => 'Gbodjè',                   'lat' => 6.5100, 'lng' => 2.6540],
        ['nom' => 'Guévié',                   'lat' => 6.5110, 'lng' => 2.6560],
        ['nom' => 'Hlogou',                   'lat' => 6.5120, 'lng' => 2.6580],
        ['nom' => 'Houinmè Château d\'eau',   'lat' => 6.4930, 'lng' => 2.6210],
        ['nom' => 'Housouko',                 'lat' => 6.5130, 'lng' => 2.6600],

        // ── 5e Arrondissement ──────────────────────────────────────────────
        ['nom' => 'Akonaboè',                 'lat' => 6.5140, 'lng' => 2.6620],
        ['nom' => 'Djlado',                   'lat' => 6.5150, 'lng' => 2.6640],
        ['nom' => 'Dowa',                     'lat' => 6.4760, 'lng' => 2.6380],
        ['nom' => 'Dowa Aliogbogo',           'lat' => 6.4750, 'lng' => 2.6370],
        ['nom' => 'Dowa Dédomè',              'lat' => 6.4770, 'lng' => 2.6390],
        ['nom' => 'Houinvié',                 'lat' => 6.5160, 'lng' => 2.6660],
        ['nom' => 'Louho',                    'lat' => 6.5170, 'lng' => 2.6680],
        ['nom' => 'Ouando',                   'lat' => 6.5180, 'lng' => 2.6700],
        ['nom' => 'Ouando Clékanmè',          'lat' => 6.5185, 'lng' => 2.6710],
        ['nom' => 'Ouando Kotin',             'lat' => 6.5190, 'lng' => 2.6720],
    ];

    public function up(): void
    {
        $artisans = DB::table('artisans')
            ->whereNull('latitude')
            ->orWhereNull('longitude')
            ->get(['id']);

        foreach ($artisans as $artisan) {
            // Choisir un quartier aléatoire parmi les 5 arrondissements
            $quartier = $this->quartiers[array_rand($this->quartiers)];

            // Légère variation aléatoire (±0.003° ≈ ±300m) pour éviter les doublons exacts
            $lat = $quartier['lat'] + (mt_rand(-30, 30) / 10000);
            $lng = $quartier['lng'] + (mt_rand(-30, 30) / 10000);

            // S'assurer que les coordonnées restent dans les 5 arrondissements
            $lat = max(6.47, min(6.52, $lat));
            $lng = max(2.60, min(2.68, $lng));

            DB::table('artisans')
                ->where('id', $artisan->id)
                ->update([
                    'latitude'  => round($lat, 8),
                    'longitude' => round($lng, 8),
                ]);
        }
    }

    public function down(): void
    {
        // Non réversible
    }
};
