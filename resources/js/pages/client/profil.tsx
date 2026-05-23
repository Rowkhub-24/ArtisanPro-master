import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { User, ArrowLeft, Mail, Phone, MapPin, Edit, Save, Camera } from 'lucide-react';
import { type ChangeEvent, type FormEventHandler, useEffect, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Tableau de bord', href: '/client/dashboard' },
    { title: 'Mon Profil', href: '/client/profil' },
];

type ClientProfilForm = {
    prenom: string;
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
    avatar: File | null;
};

export default function ClientProfil() {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    const { data, setData, patch, processing, errors, clearErrors } = useForm<ClientProfilForm>({
        prenom: user?.prenom ?? '',
        nom: user?.nom ?? '',
        email: user?.email ?? '',
        telephone: (user?.telephone ?? '') as string,
        adresse: (user?.adresse as string | undefined) ?? '',
        avatar: null,
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const handleFieldChange = (field: Exclude<keyof ClientProfilForm, 'avatar'>) => (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    ) => {
        setData(field, e.target.value as ClientProfilForm[typeof field]);
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
        patch(route('client.profil.update'), {
            forceFormData: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mon Profil - ArtisanPro" />
            <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-slate-50 via-white to-blue-50 min-h-screen">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button asChild variant="outline" size="icon">
                        <Link href={route('client.dashboard')}><ArrowLeft className="h-4 w-4" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Mon Profil</h1>
                        <p className="mt-1 text-gray-600">Gérez vos informations personnelles</p>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Avatar Card */}
                    <Card className="border-0 shadow-lg bg-white">
                        <CardContent className="p-8 text-center">
                            <div className="relative inline-block mb-6">
                                <div className="overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-4xl font-bold mx-auto h-28 w-28 flex items-center justify-center">
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
                                    className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition-colors"
                                    title="Modifier la photo de profil"
                                >
                                    <Camera className="h-4 w-4" />
                                </label>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">{user?.prenom} {user?.nom}</h2>
                            <p className="text-gray-500 mt-1">{user?.email}</p>
                            <div className="mt-4 inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                                Compte Client
                            </div>
                        </CardContent>
                    </Card>

                    {/* Edit Form */}
                    <div className="lg:col-span-2">
                        <Card className="border-0 shadow-lg bg-white">
                            <CardHeader className="border-b border-gray-100">
                                <CardTitle className="flex items-center gap-2 text-gray-900">
                                    <Edit className="h-5 w-5 text-blue-600" />
                                    Modifier mes informations
                                </CardTitle>
                                <CardDescription>Mettez à jour vos données personnelles</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form id="client-profil-form" onSubmit={submit} className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="prenom" className="text-sm font-medium text-gray-700">Prénom</Label>
                                            <input
                                                form="client-profil-form"
                                                id="prenom"
                                                name="prenom"
                                                value={data.prenom}
                                                onChange={handleFieldChange('prenom')}
                                                className="border-gray-300 focus:border-blue-500"
                                            />
                                            <InputError message={errors.prenom} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="nom" className="text-sm font-medium text-gray-700">Nom</Label>
                                            <Input
                                                id="nom"
                                                name="nom"
                                                value={data.nom}
                                                onChange={handleFieldChange('nom')}
                                                className="border-gray-300 focus:border-blue-500"
                                            />
                                            <InputError message={errors.nom} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                            <Mail className="inline h-4 w-4 mr-1" />
                                            Email
                                        </Label>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={data.email}
                                            onChange={handleFieldChange('email')}
                                            className="border-gray-300 focus:border-blue-500"
                                        />
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="telephone" className="text-sm font-medium text-gray-700">
                                            <Phone className="inline h-4 w-4 mr-1" />
                                            Téléphone
                                        </Label>
                                        <Input
                                            id="telephone"
                                            name="telephone"
                                            value={data.telephone}
                                            onChange={handleFieldChange('telephone')}
                                            placeholder="+229 XX XX XX XX"
                                            className="border-gray-300 focus:border-blue-500"
                                        />
                                        <InputError message={errors.telephone} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="adresse" className="text-sm font-medium text-gray-700">
                                            <MapPin className="inline h-4 w-4 mr-1" />
                                            Adresse
                                        </Label>
                                        <Input
                                            id="adresse"
                                            name="adresse"
                                            value={data.adresse}
                                            onChange={handleFieldChange('adresse')}
                                            placeholder="Quartier, Porto-Novo"
                                            className="border-gray-300 focus:border-blue-500"
                                        />
                                        <InputError message={errors.adresse} />
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-8"
                                        >
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
