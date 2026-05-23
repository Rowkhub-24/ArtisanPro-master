import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { MapPin, Star, Home, User, Mail, Phone, Calendar, Award, MessageSquare, Send, CreditCard, Heart } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { type SharedData } from '@/types';

interface UserLite {
    id: number;
    prenom: string;
    nom: string;
    email: string;
    telephone: string | null;
    adresse: string | null;
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <Head title={`${artisan.metier} — ${artisan.user?.prenom ?? ''} ${artisan.user?.nom ?? ''} | ArtisanPro`} />

            {/* Navigation Header */}
            <header className="sticky top-0 z-50 border-b border-gray-200/60 bg-white/95 backdrop-blur-lg shadow-sm">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
                    <div className="flex items-center gap-6">
                        <Link href={route('home')} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            <Home className="h-4 w-4" />
                            Accueil
                        </Link>
                        <Link href={route('artisans.index')} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                            ← Retour à l'annuaire
                        </Link>
                    </div>
                    <div className="flex items-center gap-4">
                        {auth.user ? (
                            <Link 
                                href={route('dashboard')} 
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                            >
                                <User className="h-4 w-4" />
                                Mon espace
                            </Link>
                        ) : (
                            <Link 
                                href={route('login')} 
                                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:shadow-lg hover:from-blue-700 hover:to-indigo-700 transition-all"
                            >
                                <User className="h-4 w-4" />
                                Connexion
                            </Link>
                        )}
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-12 px-6 py-10">
                {flash?.success && (
                    <Alert className="border-green-200 bg-green-50 text-green-800">
                        <AlertDescription>{flash.success}</AlertDescription>
                    </Alert>
                )}

                {/* Artisan Header */}
                <div className="space-y-8">
                    <div className="grid gap-8 lg:grid-cols-3">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-0 text-sm">
                                        {artisan.badge}
                                    </Badge>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star 
                                                key={i} 
                                                className={`h-5 w-5 ${
                                                    i < Math.floor(Number(artisan.note_moyenne)) 
                                                        ? 'text-yellow-500 fill-current' 
                                                        : 'text-gray-300'
                                                }`} 
                                            />
                                        ))}
                                        <span className="ml-2 text-lg font-semibold text-gray-900">{artisan.note_moyenne}</span>
                                    </div>
                                </div>
                                
                                <h1 className="text-4xl font-bold text-gray-900">{artisan.metier}</h1>
                                <p className="text-xl text-gray-600">
                                    {artisan.user?.prenom} {artisan.user?.nom}
                                </p>
                                
                                <div className="flex flex-wrap gap-2">
                                    {artisan.categories.map((c) => (
                                        <Badge key={c.id} variant="secondary" className="bg-gray-100 text-gray-700">
                                            {c.nom}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                            
                            {artisan.description && (
                                <Card className="border-gray-200 bg-white">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-gray-900">Présentation</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-700 leading-relaxed">{artisan.description}</p>
                                    </CardContent>
                                </Card>
                            )}
                            
                            {artisan.bio && (
                                <Card className="border-gray-200 bg-white">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-gray-900">Biographie</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 leading-relaxed">{artisan.bio}</p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                        
                        {/* Contact & Pricing Card */}
                        <div className="space-y-6">
                            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                                <CardContent className="p-6 space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold">Contact & Tarifs</h3>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {artisan.zone_intervention && (
                                            <div className="flex items-start gap-3">
                                                <MapPin className="h-5 w-5 text-blue-200 mt-0.5" />
                                                <div>
                                                    <p className="text-sm text-blue-200">Zone d'intervention</p>
                                                    <p className="font-medium">{artisan.zone_intervention}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {artisan.tarifs_horaire != null && (
                                            <div className="rounded-lg bg-white/10 p-4">
                                                <p className="text-sm text-blue-200">Tarif indicatif</p>
                                                <p className="text-2xl font-bold">
                                                    {Number(artisan.tarifs_horaire).toLocaleString('fr-FR')} FCFA
                                                </p>
                                            </div>
                                        )}

                                        {isClient && artisan.user && (
                                            <div className="space-y-3">
                                                <Button asChild className="w-full bg-white text-blue-700 hover:bg-blue-50">
                                                    <Link href={route('client.messages', { withUser: artisan.user.id })}>
                                                        <MessageSquare className="mr-2 h-4 w-4" />
                                                        Contacter l'artisan
                                                    </Link>
                                                </Button>
                                                <Button asChild className={`w-full ${isFavorited ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-blue-700 hover:bg-blue-50'}`}>
                                                    <Link
                                                        href={route(isFavorited ? 'client.favoris.destroy' : 'client.favoris.store', { artisan: artisan.id })}
                                                        method={isFavorited ? 'delete' : 'post'}
                                                        preserveScroll
                                                    >
                                                        <Heart className="mr-2 h-4 w-4" />
                                                        {isFavorited ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                                                    </Link>
                                                </Button>
                                                <Button onClick={() => setShowReservationModal(true)} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                                                    <Calendar className="mr-2 h-4 w-4" />
                                                    Réserver un service
                                                </Button>
                                            </div>
                                        )}

                                        {artisan.user?.telephone && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-5 w-5 text-blue-200" />
                                                <div>
                                                    <p className="text-sm text-blue-200">Téléphone</p>
                                                    <p className="font-medium">{artisan.user.telephone}</p>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {artisan.user?.email && (
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-5 w-5 text-blue-200" />
                                                <div>
                                                    <p className="text-sm text-blue-200">Email</p>
                                                    <p className="font-medium">{artisan.user.email}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Services Section */}
                {artisan.prestations.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                <Award className="h-5 w-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Services & Prestations</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {artisan.prestations.map((p) => (
                                <Card key={p.id} className="border-gray-200 bg-white hover:shadow-lg transition-shadow">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg text-gray-900">{p.titre}</CardTitle>
                                        {p.category && (
                                            <CardDescription className="text-gray-600">{p.category.nom}</CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {p.description && (
                                            <p className="text-sm text-gray-600">{p.description}</p>
                                        )}
                                        {(p.tarif_min != null || p.tarif_max != null) && (
                                            <div className="rounded-lg bg-blue-50 p-3">
                                                <p className="text-sm font-medium text-blue-900">
                                                    {p.tarif_min != null && Number(p.tarif_min).toLocaleString('fr-FR')}
                                                    {p.tarif_min != null && p.tarif_max != null && ' — '}
                                                    {p.tarif_max != null && Number(p.tarif_max).toLocaleString('fr-FR')} FCFA
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Certifications Section */}
                {artisan.certifications.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                <Award className="h-5 w-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Certifications & Qualifications</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {artisan.certifications.map((c) => (
                                <Card key={c.id} className="border-gray-200 bg-white">
                                    <CardContent className="p-6">
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-gray-900">{c.nom_certification}</h3>
                                            <p className="text-gray-600">{c.organisme_delivrance}</p>
                                            {c.date_obtention && (
                                                <p className="text-sm text-gray-500">
                                                    <Calendar className="inline h-4 w-4 mr-1" />
                                                    {c.date_obtention}
                                                </p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Reviews Section */}
                {artisan.avis.length > 0 && (
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 text-yellow-600">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Avis Clients</h2>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            {artisan.avis.map((a) => (
                                <Card key={a.id} className="border-gray-200 bg-white">
                                    <CardContent className="p-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                className={`h-4 w-4 ${
                                                                    i < a.note 
                                                                        ? 'text-yellow-500 fill-current' 
                                                                        : 'text-gray-300'
                                                                }`} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{a.note}/5</span>
                                                </div>
                                                <span className="text-sm text-gray-500">
                                                    {a.client?.user ? `${a.client.user.prenom} ${a.client.user.nom}` : 'Client'}
                                                </span>
                                            </div>
                                            {a.commentaire && (
                                                <p className="text-gray-700 leading-relaxed">{a.commentaire}</p>
                                            )}
                                            <p className="text-xs text-gray-500">{a.date_avis}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Quote Request Section */}
                {isClient ? (
                    <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
                        <CardHeader className="pb-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                                    <Send className="h-5 w-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-gray-900">Demander un devis</CardTitle>
                                    <CardDescription className="text-gray-600">
                                        Décrivez vos travaux et l'artisan vous contactera rapidement
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={submitDevis} className="space-y-6">
                                <div>
                                    <Label htmlFor="description_travaux" className="text-sm font-medium text-gray-700">
                                        Description des travaux
                                    </Label>
                                    <textarea
                                        id="description_travaux"
                                        value={devisForm.data.description_travaux}
                                        onChange={(e) => devisForm.setData('description_travaux', e.target.value)}
                                        rows={5}
                                        required
                                        className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                                        placeholder="Décrivez les travaux à effectuer : lieu, urgence, matériaux souhaités, etc."
                                    />
                                    <InputError message={devisForm.errors.description_travaux} className="mt-2" />
                                </div>
                                <Button 
                                    type="submit" 
                                    disabled={devisForm.processing} 
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all"
                                >
                                    {devisForm.processing ? 'Envoi en cours...' : 'Envoyer la demande de devis'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="border-gray-200 bg-gray-50">
                        <CardContent className="p-8 text-center">
                            <div className="space-y-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600 mx-auto">
                                    <User className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Besoin d'un devis ?</h3>
                                    <p className="text-gray-600 mt-2">
                                        Inscrivez-vous en tant que client pour demander un devis à cet artisan
                                    </p>
                                </div>
                                <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                                    <Link href={route('register')}>
                                        Créer un compte client
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </main>

            {/* Reservation Modal */}
            {showReservationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40" onClick={() => setShowReservationModal(false)} />
                    <div className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                        <h3 className="text-lg font-semibold text-gray-900">Réserver un service</h3>
                        <p className="mt-1 text-sm text-gray-600">Chez {artisan.user?.prenom} {artisan.user?.nom}</p>
                        
                        <form onSubmit={submitReservation} className="mt-6 space-y-4">
                            <div>
                                <Label htmlFor="res-date" className="text-sm font-medium text-gray-700">Date souhaitée *</Label>
                                <input
                                    id="res-date"
                                    type="date"
                                    title="Date de réservation"
                                    value={reservationForm.data.date}
                                    onChange={(e) => reservationForm.setData('date', e.target.value)}
                                    required
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                                />
                                <InputError message={reservationForm.errors.date} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="res-creneau" className="text-sm font-medium text-gray-700">Créneau horaire</Label>
                                <select
                                    id="res-creneau"
                                    title="Créneau horaire"
                                    value={reservationForm.data.creneau}
                                    onChange={(e) => reservationForm.setData('creneau', e.target.value)}
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                                >
                                    <option value="">Aucun créneau</option>
                                    <option value="matin">Matin (08:00 - 12:00)</option>
                                    <option value="apres_midi">Après-midi (12:00 - 16:00)</option>
                                    <option value="soir">Soir (16:00 - 20:00)</option>
                                </select>
                            </div>

                            <div>
                                <Label htmlFor="res-description" className="text-sm font-medium text-gray-700">Description du besoin</Label>
                                <textarea
                                    id="res-description"
                                    value={reservationForm.data.description_besoin}
                                    onChange={(e) => reservationForm.setData('description_besoin', e.target.value)}
                                    rows={3}
                                    className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500/20 focus:outline-none"
                                    placeholder="Décrivez votre besoin..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button 
                                    type="button" 
                                    onClick={() => setShowReservationModal(false)}
                                    className="flex-1 bg-gray-200 text-gray-900 hover:bg-gray-300"
                                >
                                    Annuler
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={reservationForm.processing}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                                >
                                    {reservationForm.processing ? 'Réservation...' : 'Confirmer la réservation'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
