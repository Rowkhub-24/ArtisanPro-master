import { useEffect, useRef } from 'react';

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
    elite: '#d97706',
    certifie: '#2563eb',
    aucun: '#6b7280',
};

export default function ArtisansMap({ artisans, onSelect }: Props) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        // Dynamically import Leaflet to avoid SSR issues
        import('leaflet').then((L) => {
            // Fix default icon paths
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const map = L.map(mapRef.current!, {
                center: [6.4969, 2.6289], // Porto-Novo
                zoom: 12,
                zoomControl: true,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            artisans.forEach((a) => {
                const color = BADGE_COLORS[a.badge] ?? BADGE_COLORS.aucun;
                const icon = L.divIcon({
                    className: '',
                    html: `<div style="
                        background:${color};
                        color:white;
                        border-radius:50% 50% 50% 0;
                        transform:rotate(-45deg);
                        width:36px;height:36px;
                        display:flex;align-items:center;justify-content:center;
                        box-shadow:0 2px 8px rgba(0,0,0,0.3);
                        border:2px solid white;
                        font-size:14px;font-weight:bold;
                    ">
                        <span style="transform:rotate(45deg)">🔨</span>
                    </div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 36],
                    popupAnchor: [0, -36],
                });

                const tarif = a.tarifs_horaire
                    ? `<div style="background:#fef3c7;border-radius:6px;padding:4px 8px;margin-top:6px;font-size:12px;color:#92400e;font-weight:600">${Number(a.tarifs_horaire).toLocaleString('fr-FR')} FCFA/h</div>`
                    : '';

                const popup = `
                    <div style="min-width:180px;font-family:sans-serif">
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
                    .bindPopup(popup, { maxWidth: 220 })
                    .on('click', () => onSelect?.(a.id));
            });

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
