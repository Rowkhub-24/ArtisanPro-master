import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, Camera, MapPin, Wrench, DollarSign, FileText, Star, Navigation } from 'lucide-react';
import { type ChangeEvent, type FormEventHandler, useEffect, useRef, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import {
    PORTO_NOVO_CENTER,
    PORTO_NOVO_BOUNDS,
    ARRONDISSEMENT_COLORS,
    nearestQuartier,
} from '@/data/porto-novo-quartiers';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/artisan/dashboard' },
    { title: 'Mon Profil', href: '/artisan/profil' },
];

interface ArtisanProfile {
    metier: string;
    description: string | null;
    bio: string | null;
    zone_intervention: string | null;
    tarifs_horaire: number | null;
    note_moyenne: number;
    badge: string;
    payment_provider?: string | null;
    payment_account_id?: string | null;
    payment_account_key?: string | null;
    payment_method?: string | null;
    latitude?: number | null;
    longitude?: number | null;
}

interface Props {
    artisan?: ArtisanProfile;
}

type ArtisanProfilForm = {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    metier: string;
    description: string;
    bio: string;
    zone_intervention: string;
    tarifs_horaire: string;
    latitude: string;
    longitude: string;
    avatar: File | null;
};

/** Mini-carte Leaflet pour sélectionner la position dans Porto-Novo */
function LocationPicker({ lat, lng, onChange }: {
    lat: number | null;
    lng: number | null;
    onChange: (lat: number, lng: number) => void;
}) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        import('leaflet').then((L) => {
            delete (L.Icon.Default.prototype as any)._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });

            const bounds = L.latLngBounds(
                L.latLng(PORTO_NOVO_BOUNDS.sw[0], PORTO_NOVO_BOUNDS.sw[1]),
                L.latLng(PORTO_NOVO_BOUNDS.ne[0], PORTO_NOVO_BOUNDS.ne[1]),
            );

            const initialCenter: [number, number] = (lat && lng) ? [lat, lng] : PORTO_NOVO_CENTER;

            const map = L.map(mapRef.current!, {
                center: initialCenter,
                zoom: 14,
                minZoom: 12,
                maxZoom: 18,
                maxBounds: bounds,
                maxBoundsViscosity: 1.0,
            });

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap',
                maxZoom: 19,
            }).addTo(map);

            // Marqueur draggable
            const icon = L.divIcon({
                className: '',
                html: `<div style="background:#f59e0b;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 28],
            });

            if (lat && lng) {
                markerRef.current = L.marker([lat, lng], { icon, draggable: true }).addTo(map);
                markerRef.current.on('dragend', (e: any) => {
                    const pos = e.target.getLatLng();
                    onChange(parseFloat(pos.lat.toFixed(8)), parseFloat(pos.lng.toFixed(8)));
                });
            }

            // Clic sur la carte pour placer/déplacer le marqueur
            map.on('click', (e: any) => {
                const { lat: clickLat, lng: clickLng } = e.latlng;
                // Afficher le quartier le plus proche dans un tooltip
                const q = nearestQuartier(clickLat, clickLng);
                const arrColor = ARRONDISSEMENT_COLORS[q.arrondissement] ?? '#6b7280';

                if (markerRef.current) {
                    markerRef.current.setLatLng([clickLat, clickLng]);
                    markerRef.current.setPopupContent(
                        `<div style="font-family:sans-serif;font-size:12px">
                            <div style="background:${arrColor};color:white;padding:3px 8px;border-radius:4px;font-weight:700;margin-bottom:4px">
                                ${q.arrondissement}e Arrondissement
                            </div>
                            <div style="color:#1c1917;font-weight:600">${q.nom}</div>
                            <div style="color:#78716c;font-size:11px;margin-top:2px">${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}</div>
                        </div>`
                    ).openPopup();
                } else {
                    markerRef.current = L.marker([clickLat, clickLng], { icon, draggable: true }).addTo(map);
                    markerRef.current.bindPopup(
                        `<div style="font-family:sans-serif;font-size:12px">
                            <div style="background:${arrColor};color:white;padding:3px 8px;border-radius:4px;font-weight:700;margin-bottom:4px">
                                ${q.arrondissement}e Arrondissement
                            </div>
                            <div style="color:#1c1917;font-weight:600">${q.nom}</div>
                            <div style="color:#78716c;font-size:11px;margin-top:2px">${clickLat.toFixed(5)}, ${clickLng.toFixed(5)}</div>
                        </div>`
                    ).openPopup();
                    markerRef.current.on('dragend', (ev: any) => {
                        const pos = ev.target.getLatLng();
                        onChange(parseFloat(pos.lat.toFixed(8)), parseFloat(pos.lng.toFixed(8)));
                    });
                }
                onChange(parseFloat(clickLat.toFixed(8)), parseFloat(clickLng.toFixed(8)));
            });

            mapInstanceRef.current = map;
        });

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
                markerRef.current = null;
            }
        };
    }, []);

    return (
        <div
            ref={mapRef}
            className="w-full rounded-xl overflow-hidden border border-[hsl(30,20%,82%)]"
            style={{ height: '280px', zIndex: 0 }}
        />
    );
}

export default function ArtisanProfil({ artisan }: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const user = auth.user;

    const { data, setData, post, processing, errors, clearErrors } = useForm<ArtisanProfilForm>({
        prenom:             user?.prenom ?? '',
        nom:                user?.nom ?? '',
        email:              user?.email ?? '',
        telephone:          (user?.telephone ?? '') as string,
        metier:             artisan?.metier ?? '',
        description:        artisan?.description ?? '',
        bio:                artisan?.bio ?? '',
        zone_intervention:  artisan?.zone_intervention ?? '',
        tarifs_horaire:     artisan?.tarifs_horaire?.toString() ?? '',
        latitude:           artisan?.latitude?.toString() ?? '',
        longitude:          artisan?.longitude?.toString() ?? '',
        avatar:             null,
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    // Verrouillage des champs déjà remplis (empêche modification)
    const lockedFields: Record<string, boolean> = {
        prenom: Boolean(user?.prenom),
        nom: Boolean(user?.nom),
        email: Boolean(user?.email),
        telephone: Boolean(user?.telephone),
        metier: Boolean(artisan?.metier),
        description: Boolean(artisan?.description),
        bio: Boolean(artisan?.bio),
        zone_intervention: Boolean(artisan?.zone_intervention),
        tarifs_horaire: Boolean(artisan?.tarifs_horaire),
        latitude: Boolean(artisan?.latitude),
        longitude: Boolean(artisan?.longitude),
    };

    const handleFieldChange = (field: Exclude<keyof ArtisanProfilForm, 'avatar'>) => (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        setData(field, e.target.value as ArtisanProfilForm[typeof field]);
        if (errors[field]) {
            clearErrors(field);
        }
    };

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('avatar', file);

        if (errors.avatar) {
            clearErrors('avatar');
        }

        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }

        if (file) {
            setAvatarPreview(URL.createObjectURL(file));
        } else {
            setAvatarPreview(null);
        }
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('artisan.profil.update'), {
            forceFormData: true,
        });
    };

    const badgeColors: Record<string, string> = {
        elite:    'bg-amber-100 text-amber-800 border border-amber-200',
        certifie: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
        aucun:    'bg-gray-100 text-gray-700 border border-gray-200',
    };

    const inputClass = 'rounded-xl border-[hsl(30,20%,82%)] focus:border-amber-400 focus:outline-none focus:ring-0';
    const selectClass = 'w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none';
    const textareaClass = 'w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-3 text-[hsl(20,14%,12%)] placeholder-[hsl(20,10%,60%)] focus:border-amber-400 focus:outline-none';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mon Profil Artisan - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-[hsl(36,33%,97%)] min-h-screen">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link
                        href={route('artisan.dashboard')}
                        className="inline-flex items-center gap-1.5 text-sm text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Retour
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-[hsl(20,14%,12%)]">Mon Profil Artisan</h1>
                        <p className="mt-1 text-[hsl(20,10%,50%)]">Complétez votre profil pour attirer plus de clients</p>
                    </div>
                </div>

                {flash?.success && (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-4 text-emerald-900 shadow-sm">
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Avatar & Stats */}
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-8 text-center">
                            <div className="relative inline-block mb-6">
                                <div className="overflow-hidden rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white text-4xl font-bold mx-auto h-28 w-28 flex items-center justify-center">
                                    {(avatarPreview || user?.avatar_url) ? (
                                        <img src={avatarPreview ?? user?.avatar_url ?? ''} alt="Avatar" className="h-full w-full object-cover" />
                                    ) : (
                                        <>{user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}</>
                                    )}
                                </div>
                                <input
                                    id="avatar"
                                    name="avatar"
                                    form="artisan-profil-form"
                                    type="file"
                                    accept="image/*"
                                    aria-label="Sélectionner une photo de profil"
                                    className="sr-only"
                                    onChange={handleAvatarChange}
                                />
                                <label
                                    htmlFor="avatar"
                                    title="Modifier la photo de profil"
                                    className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-colors"
                                >
                                    <Camera className="h-4 w-4" />
                                </label>
                            </div>
                            <h2 className="text-xl font-bold text-[hsl(20,14%,12%)]">{user?.prenom} {user?.nom}</h2>
                            <p className="text-[hsl(20,10%,50%)] mt-1">{artisan?.metier || 'Artisan'}</p>
                            <div className="mt-3">
                                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${badgeColors[artisan?.badge ?? 'aucun']}`}>
                                    {artisan?.badge === 'elite' ? '⭐ Élite' : artisan?.badge === 'certifie' ? '✓ Certifié' : 'Standard'}
                                </span>
                            </div>
                        </div>

                        {/* Stats Card */}
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm p-5">
                            <h3 className="text-sm font-semibold text-[hsl(20,14%,12%)] mb-3">Statistiques</h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-amber-600" />
                                        <span className="text-sm text-[hsl(20,14%,12%)]">Note moyenne</span>
                                    </div>
                                    <span className="font-bold text-amber-700">{Number(artisan?.note_moyenne ?? 0).toFixed(1)}/5</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-emerald-600" />
                                        <span className="text-sm text-[hsl(20,14%,12%)]">Tarif horaire</span>
                                    </div>
                                    <span className="font-bold text-emerald-700">
                                        {artisan?.tarifs_horaire ? `${Number(artisan.tarifs_horaire).toLocaleString('fr-FR')} F` : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Edit Form */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white shadow-sm">
                            <div className="border-b border-[hsl(30,20%,88%)] px-6 py-4">
                                <h2 className="font-semibold text-[hsl(20,14%,12%)]">Modifier mes informations</h2>
                                <p className="text-sm text-[hsl(20,10%,50%)] mt-1">Ces informations sont visibles par les clients</p>
                            </div>
                            <div className="p-6">
                                <form id="artisan-profil-form" onSubmit={submit} className="space-y-8">

                                    {/* Identité */}
                                    <div>
                                        <div className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 mb-4">
                                            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Identité</span>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="prenom" className="text-sm font-medium text-[hsl(20,14%,12%)]">Prénom</Label>
                                                <Input id="prenom" name="prenom" value={data.prenom} onChange={handleFieldChange('prenom')} className={inputClass} readOnly={lockedFields.prenom} />
                                                <InputError message={errors.prenom} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="nom" className="text-sm font-medium text-[hsl(20,14%,12%)]">Nom</Label>
                                                <Input
                                                    form="artisan-profil-form"
                                                    id="nom"
                                                    name="nom"
                                                    value={data.nom}
                                                    onChange={e => {
                                                        setData('nom', e.target.value);
                                                        if (errors.nom) clearErrors('nom');
                                                    }}
                                                    className={inputClass}
                                                    readOnly={lockedFields.nom}
                                                />
                                                <InputError message={errors.nom} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email" className="text-sm font-medium text-[hsl(20,14%,12%)]">Email</Label>
                                                <Input id="email" name="email" type="email" value={data.email} onChange={handleFieldChange('email')} className={inputClass} readOnly={lockedFields.email} />
                                                <InputError message={errors.email} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="telephone" className="text-sm font-medium text-[hsl(20,14%,12%)]">Téléphone</Label>
                                                <Input id="telephone" name="telephone" value={data.telephone} onChange={handleFieldChange('telephone')} placeholder="+229 XX XX XX XX" className={inputClass} readOnly={lockedFields.telephone} />
                                                <InputError message={errors.telephone} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activité */}
                                    <div>
                                        <div className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 mb-4">
                                            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Activité professionnelle</span>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="metier" className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                                    <Wrench className="inline h-4 w-4 mr-1" />
                                                    Métier / Spécialité
                                                </Label>
                                                <Input id="metier" name="metier" value={data.metier} onChange={handleFieldChange('metier')} placeholder="Ex: Plombier, Électricien..." className={inputClass} readOnly={lockedFields.metier} />
                                                <InputError message={errors.metier} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="zone_intervention" className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                                    <MapPin className="inline h-4 w-4 mr-1" />
                                                    Zone d'intervention
                                                </Label>
                                                <Input id="zone_intervention" name="zone_intervention" value={data.zone_intervention} onChange={handleFieldChange('zone_intervention')} placeholder="Ex: Porto-Novo, Cotonou..." className={inputClass} readOnly={lockedFields.zone_intervention} />
                                                <InputError message={errors.zone_intervention} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tarifs_horaire" className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                                    <DollarSign className="inline h-4 w-4 mr-1" />
                                                    Tarif horaire (FCFA)
                                                </Label>
                                                <Input id="tarifs_horaire" name="tarifs_horaire" type="number" value={data.tarifs_horaire} onChange={handleFieldChange('tarifs_horaire')} placeholder="Ex: 15000" className={inputClass} readOnly={lockedFields.tarifs_horaire} />
                                                <InputError message={errors.tarifs_horaire} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description" className="text-sm font-medium text-[hsl(20,14%,12%)]">
                                                    <FileText className="inline h-4 w-4 mr-1" />
                                                    Description courte
                                                </Label>
                                                <textarea
                                                    id="description"
                                                    name="description"
                                                    value={data.description}
                                                    onChange={handleFieldChange('description')}
                                                    rows={3}
                                                    placeholder="Décrivez vos services en quelques mots..."
                                                    className={textareaClass}
                                                    readOnly={lockedFields.description}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bio" className="text-sm font-medium text-[hsl(20,14%,12%)]">Biographie</Label>
                                                <textarea
                                                    id="bio"
                                                    name="bio"
                                                    value={data.bio}
                                                    onChange={handleFieldChange('bio')}
                                                    rows={4}
                                                    placeholder="Parlez de votre parcours, expérience, formations..."
                                                    className={textareaClass}
                                                    readOnly={lockedFields.bio}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Géolocalisation Porto-Novo */}
                                    <div>
                                        <div className="inline-flex items-center rounded-full bg-amber-100 border border-amber-200 px-4 py-1.5 mb-4">
                                            <span className="text-xs font-bold uppercase tracking-widest text-amber-700">Ma position sur la carte</span>
                                        </div>
                                        <div className="space-y-3">
                                            <p className="text-sm text-[hsl(20,10%,50%)]">
                                                <MapPin className="inline h-4 w-4 mr-1 text-amber-500" />
                                                Cliquez sur la carte pour indiquer votre position à Porto-Novo. Les clients pourront vous trouver plus facilement.
                                            </p>

                                            <LocationPicker
                                                lat={data.latitude ? parseFloat(data.latitude) : null}
                                                lng={data.longitude ? parseFloat(data.longitude) : null}
                                                onChange={(lat, lng) => {
                                                    if (lockedFields.latitude || lockedFields.longitude) return;
                                                    setData('latitude', lat.toString());
                                                    setData('longitude', lng.toString());
                                                }}
                                            />

                                            <div className="grid gap-3 md:grid-cols-2">
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="latitude" className="text-xs font-medium text-[hsl(20,10%,50%)]">Latitude</Label>
                                                    <Input
                                                        id="latitude"
                                                        name="latitude"
                                                        type="number"
                                                        step="0.00000001"
                                                        value={data.latitude}
                                                        onChange={handleFieldChange('latitude')}
                                                        placeholder="6.4969"
                                                        className={inputClass}
                                                        readOnly={lockedFields.latitude}
                                                    />
                                                    <InputError message={errors.latitude} />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="longitude" className="text-xs font-medium text-[hsl(20,10%,50%)]">Longitude</Label>
                                                    <Input
                                                        id="longitude"
                                                        name="longitude"
                                                        type="number"
                                                        step="0.00000001"
                                                        value={data.longitude}
                                                        onChange={handleFieldChange('longitude')}
                                                        placeholder="2.6289"
                                                        className={inputClass}
                                                        readOnly={lockedFields.longitude}
                                                    />
                                                    <InputError message={errors.longitude} />
                                                </div>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (!navigator.geolocation) return;
                                                    navigator.geolocation.getCurrentPosition(
                                                        (pos) => {
                                                            const lat = parseFloat(pos.coords.latitude.toFixed(8));
                                                            const lng = parseFloat(pos.coords.longitude.toFixed(8));
                                                            if (lat >= 6.47 && lat <= 6.52 && lng >= 2.60 && lng <= 2.68) {
                                                                setData('latitude', lat.toString());
                                                                setData('longitude', lng.toString());
                                                            } else {
                                                                alert('Votre position est en dehors de Porto-Novo. Cliquez manuellement sur la carte.');
                                                            }
                                                        },
                                                        () => alert('Impossible de récupérer votre position GPS.')
                                                    );
                                                }}
                                                className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 px-4 py-2 text-sm font-medium transition-colors"
                                                disabled={false}
                                            >
                                                <Navigation className="h-4 w-4" />
                                                Utiliser ma position GPS actuelle
                                            </button>

                                            {data.latitude && data.longitude && (
                                                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2.5">
                                                    <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                                                    <div>
                                                        <p className="text-sm text-emerald-700 font-medium">
                                                            {(() => {
                                                                const q = nearestQuartier(parseFloat(data.latitude), parseFloat(data.longitude));
                                                                return `${q.nom} — ${q.arrondissement}e Arrondissement`;
                                                            })()}
                                                        </p>
                                                        <p className="text-xs text-emerald-600">
                                                            {parseFloat(data.latitude).toFixed(5)}, {parseFloat(data.longitude).toFixed(5)}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-8 py-2 text-sm transition-all disabled:opacity-60"
                                        >
                                            <Save className="h-4 w-4" />
                                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
