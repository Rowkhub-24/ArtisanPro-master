import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { MapPin, Star, User, Mail, Phone, Calendar, Award, MessageSquare, Send, Heart, ArrowRight, ChevronRight, Sparkles } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { type SharedData } from '@/types';
import LanguageSwitcher from '@/components/language-switcher';
import DiagnosticIAModal from '@/components/diagnostic-ia-modal';
import { useLocale } from '@/i18n/use-locale';

interface UserLite {
    id: number;
    prenom: string;
    nom: string;
    email: string;
    telephone: string | null;
    adresse: string | null;
    avatar?: string | null;
    avatar_url?: string | null;
}

interface PrestationRow {
    id: number;
    titre: string;
    description: string | null;
    tarif_min: string | number | null;
    tarif_max: string | number | null;
    category: { id: number; nom: string } | null;
}

interface PortfolioRow {
    id: number;
    titre: string;
    url_media: string;
    type_media: string;
}

interface CertificationRow {
    id: number;
    nom_certification: string;
    organisme_delivrance: string;
    date_obtention: string | null;
}

interface AvisRow {
    id: number;
    note: number;
    commentaire: string | null;
    date_avis: string;
    client: {
        user: { prenom: string; nom: string } | null;
    } | null;
}

interface ArtisanDetail {
    id: number;
    metier: string;
    description: string | null;
    bio: string | null;
    zone_intervention: string | null;
    tarifs_horaire: string | number | null;
    note_moyenne: string | number;
    badge: string;
    score_confiance: number;
    user: UserLite | null;
    categories: { id: number; nom: string }[];
    prestations: PrestationRow[];
    portfolio_images: PortfolioRow[];
    certifications: CertificationRow[];
    avis: AvisRow[];
    favorited?: boolean;
}

interface Props {
    artisan: ArtisanDetail;
}

export default function ArtisanShow({ artisan }: Props) {
    const { auth, flash } = usePage<SharedData>().props;
    const isClient = auth.user?.type_utilisateur === 'client';
    const isFavorited = artisan.favorited === true;
    const [showReservationModal, setShowReservationModal] = useState(false);
    const [showDiagnostic, setShowDiagnostic] = useState(false);
    const { locale, setLocale } = useLocale();

    const devisForm = useForm({
        id_artisan: artisan.id,
        description_travaux: '',
    });

    const reservationForm = useForm({
        id_artisan: artisan.id,
        date: '',
        creneau: '',
        description_besoin: '',
    });

    const submitDevis: FormEventHandler = (e) => {
        e.preventDefault();
        devisForm.post(route('portal.devis.store'), { preserveScroll: true });
    };

    const submitReservation: FormEventHandler = (e) => {
        e.preventDefault();
        reservationForm.post(route('client.reservations.store'), {
            onSuccess: () => {
                setShowReservationModal(false);
                reservationForm.reset();
            },
        });
    };

    return (
        <div className="min-h-screen bg-[hsl(36,33%,97%)]">
            <Head title={`${artisan.metier} — ${artisan.user?.prenom ?? ''} ${artisan.user?.nom ?? ''} | ArtisanPro`} />

            {/* NAVBAR — identique à l'accueil */}
            <header className="fixed top-0 inset-x-0 z-50 border-b border-white/8 bg-[hsl(20,14%,10%)]/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
                    <div className="flex items-center gap-6">
                        <Link href={route('home')} className="flex items-center gap-2.5">
                            <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-10 w-10 object-contain" />
                        </Link>
                        <nav className="hidden md:flex items-center gap-1">
                            <Link href={route('artisans.index')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">Annuaire</Link>
                            <Link href={route('about')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">À propos</Link>
                            <Link href={route('faq')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">FAQ</Link>
                            <Link href={route('contact')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">Contact</Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <LanguageSwitcher locale={locale} onLocaleChange={setLocale} variant="dark" />
                        <button
                            onClick={() => setShowDiagnostic(true)}
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 text-sm font-medium text-violet-300 hover:bg-violet-500/20 transition-all"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Diagnostic IA
                        </button>
                        {auth.user ? (
                            <Link href={route('dashboard')} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/25 transition-all">
                                Mon espace <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all">Connexion</Link>
                                <Link href={route('register')} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/25 transition-all">
                                    S&apos;inscrire
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {showDiagnostic && <DiagnosticIAModal onClose={() => setShowDiagnostic(false)} />}

            {/* HERO BANNER */}
            <div className="relative pt-16 overflow-hidden">
                <div className="absolute inset-0 bg-[hsl(20,14%,10%)]" />
                <div className="absolute top-0 right-1/4 h-64 w-64 rounded-full bg-amber-500/10 blur-[80px]" />
                <div className="relative mx-auto max-w-7xl px-6 py-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Link href={route('artisans.index')} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-amber-400 transition-colors">
                            ← Retour à l&apos;annuaire
                        </Link>
                    </div>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div className="flex items-start gap-5">
                            <div className="h-16 w-16 shrink-0 rounded-2xl overflow-hidden shadow-lg shadow-amber-900/30 border-2 border-amber-400/30">
                                {artisan.user?.avatar_url || artisan.user?.avatar ? (
                                    <img
                                        src={(artisan.user.avatar_url ?? artisan.user.avatar) as string}
                                        alt={`${artisan.user.prenom} ${artisan.user.nom}`}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold text-xl">
                                        {(artisan.user?.prenom?.[0] ?? '?')}{(artisan.user?.nom?.[0] ?? '')}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    {/* Badge with color coding: aucun=gray, certifié=orange, élite=violet */}
                                    {artisan.badge === 'élite' ? (
                                        <span className="rounded-full bg-violet-500/20 border border-violet-400/35 px-3 py-0.5 text-xs font-semibold text-violet-300">
                                            ✦ {artisan.badge}
                                        </span>
                                    ) : artisan.badge === 'certifié' ? (
                                        <span className="rounded-full bg-amber-500/20 border border-amber-500/35 px-3 py-0.5 text-xs font-semibold text-amber-300">
                                            ✓ {artisan.badge}
                                        </span>
                                    ) : (
                                        <span className="rounded-full bg-white/8 border border-white/15 px-3 py-0.5 text-xs font-semibold text-white/50">
                                            {artisan.badge}
                                        </span>
                                    )}
                                    {artisan.categories.map((c) => (
                                        <span key={c.id} className="rounded-full bg-white/8 border border-white/10 px-3 py-0.5 text-xs font-medium text-white/60">
                                            {c.nom}
                                        </span>
                                    ))}
                                </div>
                                <h1 className="text-3xl font-extrabold text-white lg:text-4xl">{artisan.metier}</h1>
                                <p className="text-lg text-white/60">{artisan.user?.prenom} {artisan.user?.nom}</p>
                                <div className="flex items-center gap-2">
                                    <div className="flex">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`h-4 w-4 ${i < Math.floor(Number(artisan.note_moyenne)) ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`} />
                                        ))}
                                    </div>
                                    <span className="text-sm font-semibold text-white/80">{artisan.note_moyenne}</span>
                                    <span className="text-sm text-white/40">({artisan.avis.length} avis)</span>
                                </div>
                                {/* Score de confiance */}
                                <div className="flex items-center gap-3 pt-1">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs text-white/40">Score de confiance</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-28 rounded-full bg-white/10 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        artisan.score_confiance >= 80
                                                            ? 'bg-gradient-to-r from-violet-500 to-purple-400'
                                                            : artisan.score_confiance >= 50
                                                            ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                                            : 'bg-gradient-to-r from-white/30 to-white/20'
                                                    }`}
                                                    style={{ width: `${artisan.score_confiance}%` }}
                                                />
                                            </div>
                                            <span className={`text-sm font-bold ${
                                                artisan.score_confiance >= 80
                                                    ? 'text-violet-300'
                                                    : artisan.score_confiance >= 50
                                                    ? 'text-amber-300'
                                                    : 'text-white/50'
                                            }`}>
                                                {artisan.score_confiance}<span className="text-xs font-normal text-white/30">/100</span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <main className="mx-auto max-w-7xl px-6 py-10 space-y-10">

                {/* Flash success */}
                {flash?.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-800">
                        {flash.success}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-3">

                    {/* LEFT — description + sections */}
                    <div className="lg:col-span-2 space-y-8">

                        {artisan.description && (
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                        <User className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-lg font-bold text-[hsl(20,14%,12%)]">Présentation</h2>
                                </div>
                                <p className="text-[hsl(20,10%,35%)] leading-relaxed">{artisan.description}</p>
                            </div>
                        )}

                        {artisan.bio && (
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                        <MessageSquare className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-lg font-bold text-[hsl(20,14%,12%)]">Biographie</h2>
                                </div>
                                <p className="text-[hsl(20,10%,45%)] leading-relaxed">{artisan.bio}</p>
                            </div>
                        )}

                        {/* Services */}
                        {artisan.prestations.length > 0 && (
                            <section className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                        <Award className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[hsl(20,14%,12%)]">Services & Prestations</h2>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {artisan.prestations.map((p) => (
                                        <div key={p.id} className="group rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                                            <div className="h-1 w-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 mb-4" />
                                            <h3 className="font-bold text-[hsl(20,14%,12%)] group-hover:text-amber-600 transition-colors">{p.titre}</h3>
                                            {p.category && (
                                                <span className="mt-1 inline-block rounded-full bg-[hsl(36,30%,93%)] px-2.5 py-0.5 text-xs font-medium text-[hsl(20,14%,35%)]">
                                                    {p.category.nom}
                                                </span>
                                            )}
                                            {p.description && (
                                                <p className="mt-2 text-sm text-[hsl(20,10%,45%)]">{p.description}</p>
                                            )}
                                            {(p.tarif_min != null || p.tarif_max != null) && (
                                                <div className="mt-3 rounded-xl bg-amber-50 border border-amber-100 px-3 py-2">
                                                    <p className="text-sm font-semibold text-amber-700">
                                                        {p.tarif_min != null && Number(p.tarif_min).toLocaleString('fr-FR')}
                                                        {p.tarif_min != null && p.tarif_max != null && ' — '}
                                                        {p.tarif_max != null && Number(p.tarif_max).toLocaleString('fr-FR')} FCFA
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Certifications */}
                        {artisan.certifications.length > 0 && (
                            <section className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
                                        <Award className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[hsl(20,14%,12%)]">Certifications & Qualifications</h2>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {artisan.certifications.map((c) => (
                                        <div key={c.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-5 shadow-sm">
                                            <h3 className="font-bold text-[hsl(20,14%,12%)]">{c.nom_certification}</h3>
                                            <p className="mt-1 text-sm text-[hsl(20,10%,45%)]">{c.organisme_delivrance}</p>
                                            {c.date_obtention && (
                                                <p className="mt-2 flex items-center gap-1.5 text-xs text-[hsl(20,10%,55%)]">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    {c.date_obtention}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Avis */}
                        {artisan.avis.length > 0 && (
                            <section className="space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                        <Star className="h-4 w-4" />
                                    </div>
                                    <h2 className="text-xl font-bold text-[hsl(20,14%,12%)]">Avis Clients</h2>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {artisan.avis.map((a) => (
                                        <div key={a.id} className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-5 shadow-sm">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star key={i} className={`h-4 w-4 ${i < a.note ? 'fill-amber-400 text-amber-400' : 'text-[hsl(30,20%,80%)]'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-sm font-semibold text-[hsl(20,14%,20%)]">{a.note}/5</span>
                                                </div>
                                                <span className="text-xs text-[hsl(20,10%,55%)]">
                                                    {a.client?.user ? `${a.client.user.prenom} ${a.client.user.nom}` : 'Client'}
                                                </span>
                                            </div>
                                            {a.commentaire && (
                                                <p className="text-sm text-[hsl(20,10%,35%)] leading-relaxed">{a.commentaire}</p>
                                            )}
                                            <p className="mt-2 text-xs text-[hsl(20,10%,60%)]">{a.date_avis}</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Devis */}
                        {isClient ? (
                            <section className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
                                        <Send className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[hsl(20,14%,12%)]">Demander un devis</h2>
                                        <p className="text-sm text-[hsl(20,10%,45%)]">Décrivez vos travaux et l&apos;artisan vous contactera rapidement</p>
                                    </div>
                                </div>
                                <form onSubmit={submitDevis} className="space-y-4">
                                    <div>
                                        <Label htmlFor="description_travaux" className="text-sm font-medium text-[hsl(20,14%,20%)]">
                                            Description des travaux
                                        </Label>
                                        <textarea
                                            id="description_travaux"
                                            value={devisForm.data.description_travaux}
                                            onChange={(e) => devisForm.setData('description_travaux', e.target.value)}
                                            rows={5}
                                            required
                                            className="mt-2 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-3 text-[hsl(20,14%,12%)] placeholder-[hsl(20,10%,60%)] focus:border-amber-400 focus:ring-amber-400/20 focus:outline-none transition-colors"
                                            placeholder="Décrivez les travaux à effectuer : lieu, urgence, matériaux souhaités, etc."
                                        />
                                        <InputError message={devisForm.errors.description_travaux} className="mt-2" />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={devisForm.processing}
                                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-900/20 transition-all disabled:opacity-60"
                                    >
                                        {devisForm.processing ? 'Envoi en cours...' : 'Envoyer la demande de devis'}
                                    </button>
                                </form>
                            </section>
                        ) : (
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-white p-8 text-center shadow-sm">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600 mx-auto mb-4">
                                    <User className="h-6 w-6" />
                                </div>
                                <h3 className="text-lg font-bold text-[hsl(20,14%,12%)]">Besoin d&apos;un devis ?</h3>
                                <p className="mt-2 text-sm text-[hsl(20,10%,45%)]">
                                    Inscrivez-vous en tant que client pour demander un devis à cet artisan
                                </p>
                                <Link
                                    href={route('register')}
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-900/20 transition-all"
                                >
                                    Créer un compte client <ChevronRight className="h-4 w-4" />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* RIGHT — contact card */}
                    <div className="space-y-5">
                        <div className="sticky top-24 space-y-5">
                            {/* Tarif & zone */}
                            <div className="rounded-2xl border border-[hsl(30,20%,88%)] bg-[hsl(20,14%,10%)] text-white p-6 shadow-xl">
                                <h3 className="text-base font-bold mb-5 text-white/90">Contact & Tarifs</h3>
                                <div className="space-y-4">
                                    {artisan.zone_intervention && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs text-white/40">Zone d&apos;intervention</p>
                                                <p className="text-sm font-medium text-white/90">{artisan.zone_intervention}</p>
                                            </div>
                                        </div>
                                    )}
                                    {artisan.tarifs_horaire != null && (
                                        <div className="rounded-xl bg-amber-500/15 border border-amber-500/20 px-4 py-3">
                                            <p className="text-xs text-amber-300/70">Tarif indicatif</p>
                                            <p className="text-xl font-bold text-amber-400">
                                                {Number(artisan.tarifs_horaire).toLocaleString('fr-FR')} FCFA
                                            </p>
                                        </div>
                                    )}
                                    {artisan.user?.telephone && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-amber-400 shrink-0" />
                                            <div>
                                                <p className="text-xs text-white/40">Téléphone</p>
                                                <p className="text-sm font-medium text-white/90">{artisan.user.telephone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {artisan.user?.email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-amber-400 shrink-0" />
                                            <div>
                                                <p className="text-xs text-white/40">Email</p>
                                                <p className="text-sm font-medium text-white/90 break-all">{artisan.user.email}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isClient && artisan.user && (
                                    <div className="mt-6 space-y-3">
                                        <Link
                                            href={route('client.messages', { withUser: artisan.user.id })}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-semibold text-white transition-all"
                                        >
                                            <MessageSquare className="h-4 w-4" />
                                            Contacter l&apos;artisan
                                        </Link>
                                        <Link
                                            href={route(isFavorited ? 'client.favoris.destroy' : 'client.favoris.store', { artisan: artisan.id })}
                                            method={isFavorited ? 'delete' : 'post'}
                                            preserveScroll
                                            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                                                isFavorited
                                                    ? 'bg-red-500/15 border border-red-500/25 text-red-400 hover:bg-red-500/25'
                                                    : 'bg-white/8 border border-white/10 text-white/80 hover:bg-white/15'
                                            }`}
                                        >
                                            <Heart className={`h-4 w-4 ${isFavorited ? 'fill-current' : ''}`} />
                                            {isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                        </Link>
                                        <button
                                            onClick={() => setShowReservationModal(true)}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all"
                                        >
                                            <Calendar className="h-4 w-4" />
                                            Réserver un service
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER — identique à l'accueil */}
            <footer className="bg-[hsl(20,14%,8%)] text-[hsl(36,10%,55%)] mt-16">
                <div className="mx-auto max-w-7xl px-6 py-12">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs border-t border-white/8 pt-8">
                        <p>© 2025 ArtisanPro. Tous droits réservés.</p>
                        <p className="text-[hsl(36,10%,35%)]">Porto-Novo, Bénin · Plateforme artisans-clients</p>
                    </div>
                </div>
            </footer>

            {/* MODAL RÉSERVATION */}
            {showReservationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[hsl(20,14%,6%)]/70 backdrop-blur-sm" onClick={() => setShowReservationModal(false)} />
                    <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-[hsl(20,14%,12%)]">Réserver un service</h3>
                                <p className="text-sm text-[hsl(20,10%,45%)]">Chez {artisan.user?.prenom} {artisan.user?.nom}</p>
                            </div>
                        </div>

                        <form onSubmit={submitReservation} className="space-y-4">
                            <div>
                                <Label htmlFor="res-date" className="text-sm font-medium text-[hsl(20,14%,20%)]">Date souhaitée *</Label>
                                <input
                                    id="res-date"
                                    type="date"
                                    title="Date de réservation"
                                    value={reservationForm.data.date}
                                    onChange={(e) => reservationForm.setData('date', e.target.value)}
                                    required
                                    className="mt-1 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2.5 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none transition-colors"
                                />
                                <InputError message={reservationForm.errors.date} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="res-creneau" className="text-sm font-medium text-[hsl(20,14%,20%)]">Créneau horaire</Label>
                                <select
                                    id="res-creneau"
                                    title="Créneau horaire"
                                    value={reservationForm.data.creneau}
                                    onChange={(e) => reservationForm.setData('creneau', e.target.value)}
                                    className="mt-1 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2.5 text-[hsl(20,14%,12%)] focus:border-amber-400 focus:outline-none transition-colors"
                                >
                                    <option value="">Aucun créneau</option>
                                    <option value="matin">Matin (08:00 - 12:00)</option>
                                    <option value="apres_midi">Après-midi (12:00 - 16:00)</option>
                                    <option value="soir">Soir (16:00 - 20:00)</option>
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="res-description" className="text-sm font-medium text-[hsl(20,14%,20%)]">Description du besoin</Label>
                                <textarea
                                    id="res-description"
                                    value={reservationForm.data.description_besoin}
                                    onChange={(e) => reservationForm.setData('description_besoin', e.target.value)}
                                    rows={3}
                                    className="mt-1 w-full rounded-xl border border-[hsl(30,20%,82%)] bg-white px-3 py-2.5 text-[hsl(20,14%,12%)] placeholder-[hsl(20,10%,60%)] focus:border-amber-400 focus:outline-none transition-colors"
                                    placeholder="Décrivez votre besoin..."
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowReservationModal(false)}
                                    className="flex-1 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2.5 text-sm font-semibold text-[hsl(20,14%,35%)] hover:bg-[hsl(36,33%,97%)] transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={reservationForm.processing}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-all disabled:opacity-60"
                                >
                                    {reservationForm.processing ? 'Réservation...' : 'Confirmer la réservation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
