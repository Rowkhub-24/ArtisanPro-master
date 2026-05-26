/**
 * Quartiers officiels de Porto-Novo — 5 arrondissements
 * Coordonnées GPS approximatives basées sur la répartition officielle.
 */

export interface Quartier {
    nom: string;
    arrondissement: number;
    lat: number;
    lng: number;
}

export const PORTO_NOVO_CENTER: [number, number] = [6.4969, 2.6289];

/** Bounds stricts des 5 arrondissements de Porto-Novo */
export const PORTO_NOVO_BOUNDS = {
    sw: [6.47, 2.60] as [number, number],
    ne: [6.52, 2.68] as [number, number],
};

export const QUARTIERS: Quartier[] = [
    // ── 1er Arrondissement ──────────────────────────────────────────────────
    { nom: 'Accron-Gogankomey',       arrondissement: 1, lat: 6.4850, lng: 2.6150 },
    { nom: 'Adjègounlè',              arrondissement: 1, lat: 6.4870, lng: 2.6180 },
    { nom: 'Adomey',                  arrondissement: 1, lat: 6.4830, lng: 2.6120 },
    { nom: 'Ahouantikomey',           arrondissement: 1, lat: 6.4860, lng: 2.6200 },
    { nom: 'Akpassa Odo Oba',         arrondissement: 1, lat: 6.4840, lng: 2.6160 },
    { nom: 'Avassa Bagoro Agbokomey', arrondissement: 1, lat: 6.4820, lng: 2.6140 },
    { nom: 'Ayétoro',                 arrondissement: 1, lat: 6.4880, lng: 2.6220 },
    { nom: 'Ayimlonfidé',             arrondissement: 1, lat: 6.4810, lng: 2.6130 },
    { nom: 'Lokossa 1er',             arrondissement: 1, lat: 6.4890, lng: 2.6170 },
    { nom: 'Oganla-Gare-Est',         arrondissement: 1, lat: 6.4900, lng: 2.6250 },
    { nom: 'Sadognon-Adjégounlè',     arrondissement: 1, lat: 6.4855, lng: 2.6190 },
    { nom: 'Sadognon-Woussa',         arrondissement: 1, lat: 6.4845, lng: 2.6175 },
    { nom: 'Sagbo Kossoukodé',        arrondissement: 1, lat: 6.4825, lng: 2.6155 },
    { nom: 'Sokomey-Toffinkomey',     arrondissement: 1, lat: 6.4835, lng: 2.6165 },
    { nom: 'Togoh-Adankomey',         arrondissement: 1, lat: 6.4815, lng: 2.6145 },

    // ── 2e Arrondissement ──────────────────────────────────────────────────
    { nom: 'Agbokou Aga',             arrondissement: 2, lat: 6.4960, lng: 2.6280 },
    { nom: 'Agbokou Bassodji Mairie', arrondissement: 2, lat: 6.4970, lng: 2.6300 },
    { nom: 'Agbokou Centre social',   arrondissement: 2, lat: 6.4965, lng: 2.6290 },
    { nom: 'Agbokou Odo',             arrondissement: 2, lat: 6.4955, lng: 2.6270 },
    { nom: 'Attakè Olory-Togbé',      arrondissement: 2, lat: 6.4980, lng: 2.6320 },
    { nom: 'Attakè Yidi',             arrondissement: 2, lat: 6.4975, lng: 2.6310 },
    { nom: 'Djègan Daho',             arrondissement: 2, lat: 6.4990, lng: 2.6340 },
    { nom: 'Donoukin Lissèssa',       arrondissement: 2, lat: 6.4985, lng: 2.6330 },
    { nom: 'Hinkoudé',                arrondissement: 2, lat: 6.5000, lng: 2.6350 },
    { nom: 'Kandévié Radio Hokon',    arrondissement: 2, lat: 6.4950, lng: 2.6260 },
    { nom: 'Koutongbé',               arrondissement: 2, lat: 6.4945, lng: 2.6250 },
    { nom: 'Sèdjèko',                 arrondissement: 2, lat: 6.4940, lng: 2.6240 },

    // ── 3e Arrondissement ──────────────────────────────────────────────────
    { nom: 'Adjina Nord',             arrondissement: 3, lat: 6.5020, lng: 2.6380 },
    { nom: 'Adjina Sud',              arrondissement: 3, lat: 6.5010, lng: 2.6370 },
    { nom: 'Avakpa Kpodji',           arrondissement: 3, lat: 6.5030, lng: 2.6400 },
    { nom: 'Avakpa-Tokpa',            arrondissement: 3, lat: 6.5025, lng: 2.6390 },
    { nom: 'Djassin Daho',            arrondissement: 3, lat: 6.4920, lng: 2.6200 },
    { nom: 'Djassin Zounmè',          arrondissement: 3, lat: 6.4910, lng: 2.6190 },
    { nom: 'Foun-Foun Djaguidi',      arrondissement: 3, lat: 6.5040, lng: 2.6420 },
    { nom: 'Foun-Foun Gbègo',         arrondissement: 3, lat: 6.5035, lng: 2.6410 },
    { nom: 'Foun-Foun Sodji',         arrondissement: 3, lat: 6.5045, lng: 2.6430 },
    { nom: 'Foun-Foun Tokpa',         arrondissement: 3, lat: 6.5050, lng: 2.6440 },

    // ── 4e Arrondissement ──────────────────────────────────────────────────
    { nom: 'Anavié',                  arrondissement: 4, lat: 6.5060, lng: 2.6460 },
    { nom: 'Anavié Voirie',           arrondissement: 4, lat: 6.5065, lng: 2.6470 },
    { nom: 'Djègan Kpèvi',            arrondissement: 4, lat: 6.5070, lng: 2.6480 },
    { nom: 'Dodji',                   arrondissement: 4, lat: 6.5080, lng: 2.6500 },
    { nom: 'Gbèdjromèdé Fusion',      arrondissement: 4, lat: 6.5090, lng: 2.6520 },
    { nom: 'Gbodjè',                  arrondissement: 4, lat: 6.5100, lng: 2.6540 },
    { nom: 'Guévié',                  arrondissement: 4, lat: 6.5110, lng: 2.6560 },
    { nom: 'Hlogou',                  arrondissement: 4, lat: 6.5120, lng: 2.6580 },
    { nom: 'Houinmè Château d\'eau',  arrondissement: 4, lat: 6.4930, lng: 2.6210 },
    { nom: 'Housouko',                arrondissement: 4, lat: 6.5130, lng: 2.6600 },

    // ── 5e Arrondissement ──────────────────────────────────────────────────
    { nom: 'Akonaboè',                arrondissement: 5, lat: 6.5140, lng: 2.6620 },
    { nom: 'Djlado',                  arrondissement: 5, lat: 6.5150, lng: 2.6640 },
    { nom: 'Dowa',                    arrondissement: 5, lat: 6.4760, lng: 2.6380 },
    { nom: 'Dowa Aliogbogo',          arrondissement: 5, lat: 6.4750, lng: 2.6370 },
    { nom: 'Dowa Dédomè',             arrondissement: 5, lat: 6.4770, lng: 2.6390 },
    { nom: 'Houinvié',                arrondissement: 5, lat: 6.5160, lng: 2.6660 },
    { nom: 'Louho',                   arrondissement: 5, lat: 6.5170, lng: 2.6680 },
    { nom: 'Ouando',                  arrondissement: 5, lat: 6.5180, lng: 2.6700 },
    { nom: 'Ouando Clékanmè',         arrondissement: 5, lat: 6.5185, lng: 2.6710 },
    { nom: 'Ouando Kotin',            arrondissement: 5, lat: 6.5190, lng: 2.6720 },
];

/** Couleurs par arrondissement */
export const ARRONDISSEMENT_COLORS: Record<number, string> = {
    1: '#f59e0b', // amber  — 1er
    2: '#ea580c', // orange — 2e
    3: '#10b981', // emerald — 3e
    4: '#3b82f6', // blue   — 4e
    5: '#8b5cf6', // violet — 5e
};

/** Retourne le quartier le plus proche d'une position donnée */
export function nearestQuartier(lat: number, lng: number): Quartier {
    return QUARTIERS.reduce((best, q) => {
        const d = Math.hypot(q.lat - lat, q.lng - lng);
        const dBest = Math.hypot(best.lat - lat, best.lng - lng);
        return d < dBest ? q : best;
    });
}
