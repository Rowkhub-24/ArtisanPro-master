import { useEffect, useRef } from 'react';
import {
    PORTO_NOVO_CENTER,
    PORTO_NOVO_BOUNDS,
    ARRONDISSEMENT_COLORS,
    nearestQuartier,
} from '@/data/porto-novo-quartiers';

interface ArtisanMarker {
    id: number;
    metier: string;
    prenom: string | null;
    nom: string | null;
    note_moyenne: string | number;
    zone_intervention: string | null;
    tarifs_horaire: string | number | null;
    badge: string;
    lat: number;
    lng: number;
}

interface Props {
    artisans: ArtisanMarker[];
    onSelect?: (id: number) => void;
}

const BADGE_COLORS: Record<string, string> = {
    elite:    '#d97706', // amber
    certifie: '#10b981', // emerald
    aucun:    '#6b7280', // gray
};

export default function ArtisansMap({ artisans, onSelect }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        import('leaflet').then((L) => {
            // Fix default icon paths
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            // Bounds stricts des 5 arrondissements de Porto-Novo
            const bounds = L.latLngBounds(
                L.latLng(PORTO_NOVO_BOUNDS.sw[0], PORTO_NOVO_BOUNDS.sw[1]),
                L.latLng(PORTO_NOVO_BOUNDS.ne[0], PORTO_NOVO_BOUNDS.ne[1]),
            );

            const map = L.map(mapRef.current!, {
                center: PORTO_NOVO_CENTER,
                zoom: 13,
                minZoom: 12,              // Reste sur Porto-Novo
                maxZoom: 18,
                zoomControl: true,
                maxBounds: bounds,
                maxBoundsViscosity: 1.0,  // Bloque tout déplacement hors zone
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            // Placer les marqueurs artisans
            artisans.forEach((a) => {
                const badgeColor = BADGE_COLORS[a.badge] ?? BADGE_COLORS.aucun;

                // Couleur de l'arrondissement basée sur la position
                const quartier = nearestQuartier(a.lat, a.lng);
                const arrColor = ARRONDISSEMENT_COLORS[quartier.arrondissement] ?? '#6b7280';

                const icon = L.divIcon({
                    className: '',
                    html: `<div style="
                        background:${badgeColor};
                        color:white;
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        width:36px;height:36px;
                        display:flex;align-items:center;justify-content:center;
                        box-shadow:0 2px 8px rgba(0,0,0,0.3);
                        border:3px solid ${arrColor};
                        font-size:14px;font-weight:bold;
                    ">
                        <span style="transform:rotate(45deg)">🔨</span>
                    </div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 36],
                    popupAnchor: [0, -40],
                });

                const tarif = a.tarifs_horaire
                    ? `<div style="background:#fef3c7;border-radius:6px;padding:4px 8px;margin-top:6px;font-size:12px;color:#92400e;font-weight:600">${Number(a.tarifs_horaire).toLocaleString('fr-FR')} FCFA/h</div>`
                    : '';

                const popup = `
                    <div style="min-width:190px;font-family:sans-serif">
                        <div style="background:${arrColor};color:white;font-size:10px;font-weight:700;padding:3px 8px;border-radius:4px 4px 0 0;margin:-8px -8px 8px -8px;letter-spacing:0.05em">
                            ${quartier.arrondissement}e Arrondissement · ${quartier.nom}
                        </div>
                        <div style="font-weight:700;font-size:14px;color:#1c1917;margin-bottom:2px">${a.metier}</div>
                        <div style="font-size:12px;color:#78716c;margin-bottom:4px">${a.prenom ?? ''} ${a.nom ?? ''}</div>
                        <div style="display:flex;align-items:center;gap:4px;font-size:12px">
                            <span style="color:#f59e0b">★</span>
                            <span style="font-weight:600">${a.note_moyenne}</span>
                        </div>
                        ${a.zone_intervention ? `<div style="font-size:11px;color:#a8a29e;margin-top:4px">📍 ${a.zone_intervention}</div>` : ''}
                        ${tarif}
                        <a href="/artisans/${a.id}" style="display:block;margin-top:8px;background:linear-gradient(to right,#f59e0b,#ea580c);color:white;text-align:center;padding:6px;border-radius:8px;font-size:12px;font-weight:600;text-decoration:none">
                            Voir le profil →
                        </a>
                    </div>
                `;

                L.marker([a.lat, a.lng], { icon })
                    .addTo(map)
                    .bindPopup(popup, { maxWidth: 230 })
                    .on('click', () => onSelect?.(a.id));
            });

            // Ajuster le zoom pour englober tous les marqueurs valides
            if (artisans.length > 0) {
                const valid = artisans.filter((a) => bounds.contains(L.latLng(a.lat, a.lng)));
                if (valid.length > 1) {
                    const group = L.featureGroup(valid.map((a) => L.marker([a.lat, a.lng])));
                    map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 15 });
                }
            }

            mapInstanceRef.current = map;
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={mapRef}
            className="w-full rounded-2xl overflow-hidden border border-[hsl(30,20%,88%)] shadow-sm"
            style={{ height: '420px', zIndex: 0 }}
        />
    );
}
