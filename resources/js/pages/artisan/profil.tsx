import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, Camera, MapPin, Wrench, DollarSign, FileText, Star } from 'lucide-react';
import { type ChangeEvent, type FormEventHandler, useEffect, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

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
}

interface Props {
    artisan?: ArtisanProfile;
}

type ArtisanProfilForm = {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    smtp_username: string;
    smtp_password: string;
    metier: string;
    description: string;
    bio: string;
    zone_intervention: string;
    tarifs_horaire: string;
    payment_provider: string;
    payment_account_id: string;
    payment_account_key: string;
    payment_method: string;
    avatar: File | null;
};

export default function ArtisanProfil({ artisan }: Props) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const { data, setData, patch, processing, errors, clearErrors } = useForm<ArtisanProfilForm>({
        prenom:            user?.prenom ?? '',
        nom:               user?.nom ?? '',
        email:             user?.email ?? '',
        telephone:         (user?.telephone ?? '') as string,
        smtp_username:     (user?.smtp_username as string | undefined) ?? '',
        smtp_password:     '',
        metier:            artisan?.metier ?? '',
        description:       artisan?.description ?? '',
        bio:               artisan?.bio ?? '',
        zone_intervention: artisan?.zone_intervention ?? '',
        tarifs_horaire:    artisan?.tarifs_horaire?.toString() ?? '',
        payment_provider:  artisan?.payment_provider ?? 'kkiapay',
        payment_account_id: artisan?.payment_account_id ?? '',
        payment_account_key: '',
        payment_method:    artisan?.payment_method ?? 'card',
        avatar:            null,
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
        patch(route('artisan.profil.update'), {
            forceFormData: true,
        });
    };

    const badgeColors: Record<string, string> = {
        elite:    'bg-purple-100 text-purple-800',
        certifie: 'bg-blue-100 text-blue-800',
        aucun:    'bg-gray-100 text-gray-800',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mon Profil Artisan - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href={route('artisan.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mon Profil Artisan</h1>
                        <p className="mt-1 text-gray-600">Complétez votre profil pour attirer plus de clients</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Avatar & Stats */}
                    <div className="space-y-4">
                        <Card className="border-0 shadow-lg bg-white">
                            <CardContent className="p-8 text-center">
                                <div className="relative inline-block mb-6">
                                    <div className="overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-white text-4xl font-bold mx-auto h-28 w-28 flex items-center justify-center">
                                        {(avatarPreview || user?.avatar) ? (
                                            <img src={avatarPreview ?? user?.avatar ?? ''} alt="Avatar" className="h-full w-full object-cover" />
                                        ) : (
                                            <>{user?.prenom?.charAt(0)}{user?.nom?.charAt(0)}</>
                                        )}
                                    </div>
                                    <input
                                        id="avatar"
                                        name="avatar"
                                        type="file"
                                        accept="image/*"
                                        aria-label="Sélectionner une photo de profil"
                                        className="sr-only"
                                        onChange={handleAvatarChange}
                                    />
                                    <label
                                        htmlFor="avatar"
                                        title="Modifier la photo de profil"
                                        className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-colors"
                                    >
                                        <Camera className="h-4 w-4" />
                                    </label>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{user?.prenom} {user?.nom}</h2>
                                <p className="text-gray-500 mt-1">{artisan?.metier || 'Artisan'}</p>
                                <div className="mt-3">
                                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${badgeColors[artisan?.badge ?? 'aucun']}`}>
                                        {artisan?.badge === 'elite' ? '⭐ Élite' : artisan?.badge === 'certifie' ? '✓ Certifié' : 'Standard'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats Card */}
                        <Card className="border-0 shadow-lg bg-white">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base text-gray-900">Statistiques</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50">
                                    <div className="flex items-center gap-2">
                                        <Star className="h-4 w-4 text-yellow-600" />
                                        <span className="text-sm text-gray-700">Note moyenne</span>
                                    </div>
                                    <span className="font-bold text-yellow-700">{artisan?.note_moyenne?.toFixed(1) ?? '0.0'}/5</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-blue-600" />
                                        <span className="text-sm text-gray-700">Tarif horaire</span>
                                    </div>
                                    <span className="font-bold text-blue-700">
                                        {artisan?.tarifs_horaire ? `${Number(artisan.tarifs_horaire).toLocaleString('fr-FR')} F` : 'N/A'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Edit Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-lg bg-white">
                            <CardHeader className="border-b border-gray-100">
                                <CardTitle className="text-gray-900">Modifier mes informations</CardTitle>
                                <CardDescription>Ces informations sont visibles par les clients</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form id="artisan-profil-form" onSubmit={submit} className="space-y-6">
                                    {/* Identité */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Identité</h3>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <Label htmlFor="prenom">Prénom</Label>
                                                <Input id="prenom" name="prenom" value={data.prenom} onChange={handleFieldChange('prenom')} className="border-gray-300" />
                                                <InputError message={errors.prenom} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="nom">Nom</Label>
                                                <Input
                                                    form="artisan-profil-form"
                                                    id="nom"
                                                    name="nom"
                                                    value={data.nom}
                                                    onChange={e => {
                                                        setData('nom', e.target.value);
                                                        if (errors.nom) {
                                                            clearErrors('nom');
                                                        }
                                                    }}
                                                    className="border-gray-300"
                                                />
                                                <InputError message={errors.nom} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
                                                <Input id="email" name="email" type="email" value={data.email} onChange={handleFieldChange('email')} className="border-gray-300" />
                                                <InputError message={errors.email} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="telephone">Téléphone</Label>
                                                <Input id="telephone" name="telephone" value={data.telephone} onChange={handleFieldChange('telephone')} placeholder="+229 XX XX XX XX" className="border-gray-300" />
                                                <InputError message={errors.telephone} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_username">Adresse SMTP Gmail</Label>
                                                <Input id="smtp_username" name="smtp_username" type="email" value={data.smtp_username} onChange={handleFieldChange('smtp_username')} placeholder="artisan@gmail.com" className="border-gray-300" />
                                                <InputError message={errors.smtp_username} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="smtp_password">Mot de passe d'application</Label>
                                                <Input id="smtp_password" name="smtp_password" type="password" value={data.smtp_password} onChange={handleFieldChange('smtp_password')} placeholder="Mot de passe d'application Gmail" className="border-gray-300" />
                                                <p className="text-sm text-gray-500">Utilisez un mot de passe d'application Gmail. Laissez vide pour conserver le mot de passe SMTP actuel.</p>
                                                <InputError message={errors.smtp_password} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Activité */}
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Activité professionnelle</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="metier">
                                                    <Wrench className="inline h-4 w-4 mr-1" />
                                                    Métier / Spécialité
                                                </Label>
                                                <Input id="metier" name="metier" value={data.metier} onChange={handleFieldChange('metier')} placeholder="Ex: Plombier, Électricien..." className="border-gray-300" />
                                                <InputError message={errors.metier} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="zone_intervention">
                                                    <MapPin className="inline h-4 w-4 mr-1" />
                                                    Zone d'intervention
                                                </Label>
                                                <Input id="zone_intervention" name="zone_intervention" value={data.zone_intervention} onChange={handleFieldChange('zone_intervention')} placeholder="Ex: Porto-Novo, Cotonou..." className="border-gray-300" />
                                                <InputError message={errors.zone_intervention} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tarifs_horaire">
                                                    <DollarSign className="inline h-4 w-4 mr-1" />
                                                    Tarif horaire (FCFA)
                                                </Label>
                                                <Input id="tarifs_horaire" name="tarifs_horaire" type="number" value={data.tarifs_horaire} onChange={handleFieldChange('tarifs_horaire')} placeholder="Ex: 15000" className="border-gray-300" />
                                                <InputError message={errors.tarifs_horaire} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="payment_method">Mode de paiement</Label>
                                                <select
                                                    id="payment_method"
                                                    name="payment_method"
                                                    aria-label="Mode de paiement"
                                                    value={data.payment_method}
                                                    onChange={handleFieldChange('payment_method')}
                                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500/20"
                                                >
                                                    <option value="card">Carte bancaire</option>
                                                    <option value="mobile_money">Mobile Money</option>
                                                    <option value="virement">Virement bancaire</option>
                                                </select>
                                                <InputError message={errors.payment_method} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="payment_provider">Prestataire de paiement</Label>
                                                <select
                                                    id="payment_provider"
                                                    name="payment_provider"
                                                    aria-label="Prestataire de paiement"
                                                    value={data.payment_provider}
                                                    onChange={handleFieldChange('payment_provider')}
                                                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500/20"
                                                >
                                                    <option value="kkiapay">Kkiapay</option>
                                                    <option value="fedapay">Fedapay</option>
                                                </select>
                                                <InputError message={errors.payment_provider} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="payment_account_id">Identifiant du compte</Label>
                                                <Input
                                                    id="payment_account_id"
                                                    name="payment_account_id"
                                                    value={data.payment_account_id}
                                                    onChange={handleFieldChange('payment_account_id')}
                                                    placeholder="ID de compte Kkiapay/Fedapay"
                                                    className="border-gray-300"
                                                />
                                                <InputError message={errors.payment_account_id} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="payment_account_key">Clé secrète du compte</Label>
                                                <Input
                                                    id="payment_account_key"
                                                    name="payment_account_key"
                                                    type="password"
                                                    value={data.payment_account_key}
                                                    onChange={handleFieldChange('payment_account_key')}
                                                    placeholder="Laissez vide pour conserver la clé actuelle"
                                                    className="border-gray-300"
                                                />
                                                <InputError message={errors.payment_account_key} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="description">
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
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="bio">Biographie</Label>
                                                <textarea
                                                    id="bio"
                                                    name="bio"
                                                    value={data.bio}
                                                    onChange={handleFieldChange('bio')}
                                                    rows={4}
                                                    placeholder="Parlez de votre parcours, expérience, formations..."
                                                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button type="submit" disabled={processing} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 px-8">
                                            <Save className="mr-2 h-4 w-4" />
                                            {processing ? 'Enregistrement...' : 'Enregistrer'}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
