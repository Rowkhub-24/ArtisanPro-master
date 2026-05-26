import { Link } from '@inertiajs/react';
import {
    X, Upload, Camera, Loader2, AlertTriangle, CheckCircle,
    Zap, Star, MapPin, ChevronRight, Sparkles, Shield, Clock, Navigation,
} from 'lucide-react';
import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';

interface ArtisanResult {
    id: number; metier: string; prenom: string | null; nom: string | null;
    avatar_url: string | null; telephone: string | null;
    note_moyenne: string | number; badge: string;
    tarifs_horaire: string | number | null; zone_intervention: string | null;
    categories: string[]; distance_km: number | null;
    latitude: number | null; longitude: number | null;
}

interface Diagnostic {
    probleme_identifie: string; urgence: 'faible' | 'moyenne' | 'haute' | 'critique';
    categories_recommandees: string[]; explication: string;
    precautions: string[]; conseils_immediats: string; delai_intervention: string;
}

interface Props { onClose: () => void; }

const URGENCE_CONFIG = {
    faible:   { label: 'Faible',   bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' },
    moyenne:  { label: 'Moyenne',  bg: 'bg-amber-50 border-amber-200',     text: 'text-amber-700',   dot: 'bg-amber-500' },
    haute:    { label: 'Haute',    bg: 'bg-orange-50 border-orange-200',   text: 'text-orange-700',  dot: 'bg-orange-500' },
    critique: { label: 'Critique', bg: 'bg-red-50 border-red-200',         text: 'text-red-700',     dot: 'bg-red-500 animate-pulse' },
};

export default function DiagnosticIAModal({ onClose }: Props) {
    const [step, setStep] = useState<'form' | 'loading' | 'result'>('form');
    const [description, setDescription] = useState('');
    const [photos, setPhotos] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [diagnostic, setDiagnostic] = useState<Diagnostic | null>(null);
    const [artisans, setArtisans] = useState<ArtisanResult[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'ok' | 'denied'>('idle');
    const [clientPos, setClientPos] = useState<{ lat: number; lng: number } | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handlePhotos = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []).slice(0, 5);
        setPhotos(files);
        setPreviews(files.map((f) => URL.createObjectURL(f)));
    };

    const removePhoto = (i: number) => {
        URL.revokeObjectURL(previews[i]);
        setPhotos((p) => p.filter((_, idx) => idx !== i));
        setPreviews((p) => p.filter((_, idx) => idx !== i));
    };

    const requestGPS = () => {
        if (!navigator.geolocation) { setGpsStatus('denied'); return; }
        setGpsStatus('loading');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setClientPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGpsStatus('ok');
            },
            () => setGpsStatus('denied'),
            { timeout: 8000, maximumAge: 60000 }
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!description.trim()) return;
        setStep('loading');
        setError(null);

        const formData = new FormData();
        formData.append('description', description);
        photos.forEach((p, i) => formData.append(`photos[${i}]`, p));
        if (clientPos) {
            formData.append('latitude', clientPos.lat.toString());
            formData.append('longitude', clientPos.lng.toString());
        }

        try {
            const res = await fetch(route('diagnostic.ia'), {
                method: 'POST', body: formData,
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
                    'Accept': 'application/json',
                },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message ?? "Erreur lors de l'analyse");
            }
            const data = await res.json();
            setDiagnostic(data.diagnostic);
            setArtisans(data.artisans ?? []);
            setStep('result');
        } catch (err: any) {
            setError(err.message ?? 'Une erreur est survenue. Veuillez réessayer.');
            setStep('form');
        }
    };

    const reset = () => {
        setStep('form'); setDescription(''); setPhotos([]); setPreviews([]);
        setDiagnostic(null); setArtisans([]); setError(null);
    };

    const urgenceConf = diagnostic ? (URGENCE_CONFIG[diagnostic.urgence] ?? URGENCE_CONFIG.moyenne) : null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[hsl(20,14%,6%)]/75 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[hsl(30,20%,88%)] bg-white px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-sm">
                            <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[hsl(20,14%,12%)]">Diagnostic IA</h2>
                            <p className="text-xs text-[hsl(20,10%,50%)]">Décrivez votre problème, l&apos;IA trouve l&apos;artisan idéal près de vous</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="rounded-xl p-2 text-[hsl(20,10%,50%)] hover:bg-[hsl(36,33%,97%)] transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">

                    {/* ── FORM ── */}
                    {step === 'form' && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                    <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[hsl(20,14%,12%)]">Décrivez votre problème *</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={5} required
                                    placeholder="Ex: J'ai une fuite d'eau sous l'évier de ma cuisine depuis ce matin. L'eau coule lentement mais en continu..."
                                    className="w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-3 text-sm text-[hsl(20,14%,12%)] placeholder-[hsl(20,10%,60%)] focus:border-violet-400 focus:outline-none resize-none"
                                />
                                <p className="text-xs text-[hsl(20,10%,55%)]">Plus votre description est précise, meilleur sera le diagnostic.</p>
                            </div>

                            {/* GPS */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[hsl(20,14%,12%)]">
                                    Votre position <span className="font-normal text-[hsl(20,10%,55%)]">(pour trouver l&apos;artisan le plus proche)</span>
                                </label>
                                {gpsStatus === 'idle' && (
                                    <button type="button" onClick={requestGPS}
                                        className="inline-flex items-center gap-2 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2.5 text-sm font-medium text-[hsl(20,14%,12%)] hover:border-violet-400 hover:bg-violet-50 hover:text-violet-700 transition-all">
                                        <Navigation className="h-4 w-4" />
                                        Partager ma position GPS
                                    </button>
                                )}
                                {gpsStatus === 'loading' && (
                                    <div className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm text-violet-700">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Localisation en cours...
                                    </div>
                                )}
                                {gpsStatus === 'ok' && clientPos && (
                                    <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
                                        <CheckCircle className="h-4 w-4" />
                                        Position détectée — artisans proches prioritaires
                                        <button type="button" onClick={() => { setGpsStatus('idle'); setClientPos(null); }}
                                            className="ml-1 text-emerald-500 hover:text-emerald-700">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                )}
                                {gpsStatus === 'denied' && (
                                    <div className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
                                        <AlertTriangle className="h-4 w-4" />
                                        GPS non disponible — tri par note uniquement
                                    </div>
                                )}
                            </div>

                            {/* Photos */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[hsl(20,14%,12%)]">
                                    Photos du problème <span className="font-normal text-[hsl(20,10%,55%)]">(optionnel, max 5)</span>
                                </label>
                                {previews.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {previews.map((src, i) => (
                                            <div key={i} className="relative group">
                                                <img src={src} alt={`Photo ${i + 1}`} className="h-20 w-20 rounded-xl object-cover border border-[hsl(30,20%,82%)]" />
                                                <button type="button" onClick={() => removePhoto(i)}
                                                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm hover:bg-red-600">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                        {previews.length < 5 && (
                                            <button type="button" onClick={() => fileRef.current?.click()}
                                                className="h-20 w-20 rounded-xl border-2 border-dashed border-[hsl(30,20%,82%)] flex items-center justify-center text-[hsl(20,10%,55%)] hover:border-violet-400 hover:text-violet-500 transition-colors">
                                                <Upload className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                )}
                                {previews.length === 0 && (
                                    <button type="button" onClick={() => fileRef.current?.click()}
                                        className="w-full rounded-xl border-2 border-dashed border-[hsl(30,20%,82%)] p-6 flex flex-col items-center gap-2 text-[hsl(20,10%,55%)] hover:border-violet-400 hover:bg-violet-50 hover:text-violet-600 transition-all">
                                        <Camera className="h-8 w-8" />
                                        <span className="text-sm font-medium">Ajouter des photos</span>
                                        <span className="text-xs">JPG, PNG, WebP · Max 5 Mo par photo</span>
                                    </button>
                                )}
                                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple className="hidden" onChange={handlePhotos} />
                            </div>

                            {/* Privacy */}
                            <div className="flex items-start gap-3 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                                <Shield className="h-4 w-4 text-violet-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-violet-700">Vos photos et descriptions sont analysées de manière confidentielle par notre IA et ne sont pas stockées.</p>
                            </div>

                            <button type="submit" disabled={!description.trim()}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-semibold px-6 py-3 shadow-lg shadow-violet-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                <Sparkles className="h-4 w-4" />
                                Analyser avec l&apos;IA
                            </button>
                        </form>
                    )}

                    {/* ── LOADING ── */}
                    {step === 'loading' && (
                        <div className="flex flex-col items-center justify-center py-16 gap-6">
                            <div className="relative">
                                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-900/20">
                                    <Sparkles className="h-8 w-8 text-white" />
                                </div>
                                <div className="absolute inset-0 rounded-full border-4 border-violet-300 border-t-violet-600 animate-spin" />
                            </div>
                            <div className="text-center space-y-2">
                                <p className="text-base font-bold text-[hsl(20,14%,12%)]">Analyse en cours...</p>
                                <p className="text-sm text-[hsl(20,10%,50%)]">Notre IA examine votre problème et recherche les artisans les plus proches</p>
                            </div>
                            <div className="flex gap-1.5">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── RESULT ── */}
                    {step === 'result' && diagnostic && urgenceConf && (
                        <div className="space-y-6">

                            {/* Urgence */}
                            <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${urgenceConf.bg}`}>
                                <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${urgenceConf.dot}`} />
                                <div className="flex-1">
                                    <p className={`text-sm font-bold ${urgenceConf.text}`}>
                                        Urgence {urgenceConf.label} — {diagnostic.delai_intervention}
                                    </p>
                                    <p className={`text-xs mt-0.5 ${urgenceConf.text} opacity-80`}>{diagnostic.probleme_identifie}</p>
                                </div>
                                <Clock className={`h-5 w-5 shrink-0 ${urgenceConf.text}`} />
                            </div>

                            {/* Explication */}
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-5 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 border border-violet-100">
                                        <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                                    </div>
                                    <h3 className="text-sm font-bold text-[hsl(20,14%,12%)]">Diagnostic IA</h3>
                                </div>
                                <p className="text-sm text-[hsl(20,10%,35%)] leading-relaxed">{diagnostic.explication}</p>
                                <div className="flex flex-wrap gap-2">
                                    {diagnostic.categories_recommandees.map((cat) => (
                                        <span key={cat} className="rounded-full bg-violet-100 border border-violet-200 px-3 py-0.5 text-xs font-semibold text-violet-700">{cat}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Précautions */}
                            {diagnostic.precautions.length > 0 && (
                                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                                        <h3 className="text-sm font-bold text-amber-800">Précautions importantes</h3>
                                    </div>
                                    <ul className="space-y-2">
                                        {diagnostic.precautions.map((p, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />{p}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Conseils immédiats */}
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-emerald-800 mb-1">En attendant l&apos;artisan</p>
                                        <p className="text-sm text-emerald-700">{diagnostic.conseils_immediats}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Artisans recommandés */}
                            {artisans.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-bold text-[hsl(20,14%,12%)] flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-amber-500" />
                                        Artisans recommandés ({artisans.length})
                                        {clientPos && <span className="text-xs font-normal text-[hsl(20,10%,50%)]">— triés par proximité</span>}
                                    </h3>
                                    <div className="space-y-3">
                                        {artisans.map((a, idx) => (
                                            <div key={a.id} className={`flex items-center gap-4 rounded-2xl border bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all ${idx === 0 ? 'border-amber-300 ring-1 ring-amber-200' : 'border-[hsl(30,20%,88%)]'}`}>
                                                {idx === 0 && (
                                                    <div className="absolute -top-2 left-4 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                                                        ⭐ Recommandé
                                                    </div>
                                                )}
                                                <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-amber-200">
                                                    {a.avatar_url ? (
                                                        <img src={a.avatar_url} alt={`${a.prenom} ${a.nom}`} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 font-bold text-sm">
                                                            {a.prenom?.[0]}{a.nom?.[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-[hsl(20,14%,12%)] text-sm">{a.metier}</p>
                                                        <span className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-700">{a.badge}</span>
                                                    </div>
                                                    <p className="text-xs text-[hsl(20,10%,50%)]">{a.prenom} {a.nom}</p>
                                                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                                                        <div className="flex items-center gap-1">
                                                            {[...Array(5)].map((_, i) => (
                                                                <Star key={i} className={`h-3 w-3 ${i < Math.floor(Number(a.note_moyenne)) ? 'fill-amber-400 text-amber-400' : 'text-[hsl(30,20%,80%)]'}`} />
                                                            ))}
                                                            <span className="text-xs font-semibold text-[hsl(20,14%,20%)] ml-0.5">{a.note_moyenne}</span>
                                                        </div>
                                                        {a.distance_km !== null && (
                                                            <div className="flex items-center gap-1 text-xs font-semibold text-violet-600">
                                                                <Navigation className="h-3 w-3" />
                                                                {a.distance_km < 1 ? `${Math.round(a.distance_km * 1000)} m` : `${a.distance_km} km`}
                                                            </div>
                                                        )}
                                                        {a.zone_intervention && (
                                                            <div className="flex items-center gap-1 text-xs text-[hsl(20,10%,55%)]">
                                                                <MapPin className="h-3 w-3" />
                                                                <span className="truncate max-w-[100px]">{a.zone_intervention}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {a.tarifs_horaire != null && (
                                                        <p className="text-xs font-semibold text-amber-700 mt-1">{Number(a.tarifs_horaire).toLocaleString('fr-FR')} FCFA/h</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    <Link href={route('artisans.show', a.id)} onClick={onClose}
                                                        className="flex items-center gap-1 rounded-xl bg-[hsl(20,14%,12%)] hover:bg-amber-600 px-3 py-2 text-xs font-semibold text-white transition-all">
                                                        Voir <ChevronRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                    {a.telephone && (
                                                        <a href={`tel:${a.telephone}`}
                                                            className="flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-3 py-2 text-xs font-semibold transition-all">
                                                            Appeler
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {artisans.length === 0 && (
                                <div className="rounded-2xl border border-dashed border-[hsl(30,20%,82%)] p-6 text-center">
                                    <p className="text-sm text-[hsl(20,10%,50%)]">Aucun artisan disponible pour ces catégories pour le moment.</p>
                                    <Link href={route('artisans.index')} onClick={onClose}
                                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2 text-sm font-semibold text-white transition-all">
                                        Voir tous les artisans <ChevronRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button onClick={reset}
                                    className="flex-1 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2.5 text-sm font-semibold text-[hsl(20,14%,35%)] hover:bg-[hsl(36,33%,97%)] transition-colors">
                                    Nouveau diagnostic
                                </button>
                                <Link href={route('artisans.index')} onClick={onClose}
                                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-4 py-2.5 text-sm font-semibold text-white transition-all">
                                    Voir l&apos;annuaire <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
