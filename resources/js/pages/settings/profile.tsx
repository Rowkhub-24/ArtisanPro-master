import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { Camera, X, User } from 'lucide-react';
import { type FormEventHandler, useRef, useState } from 'react';

import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Paramètres du profil', href: '/settings/profile' },
];

type SettingsProfileForm = {
    prenom: string;
    nom: string;
    telephone: string;
    email: string;
    avatar: File | null;
};

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;
    const role = auth.user?.type_utilisateur;

    const currentAvatar = auth.user.avatar_url ?? auth.user.avatar ?? null;
    const [preview, setPreview] = useState<string | null>(currentAvatar as string | null);
    const fileRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, errors, processing, recentlySuccessful, clearErrors } = useForm<SettingsProfileForm>({
        prenom: auth.user.prenom ?? '',
        nom: auth.user.nom ?? '',
        telephone: (auth.user.telephone ?? '') as string,
        email: auth.user.email,
        avatar: null,
    });

    const handleFieldChange = (field: keyof Omit<SettingsProfileForm, 'avatar'>) =>
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setData(field, e.target.value);
            if (errors[field]) clearErrors(field);
        };

    const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] ?? null;
        setData('avatar', file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setPreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const removeAvatar = () => {
        setData('avatar', null);
        setPreview(null);
        if (fileRef.current) fileRef.current.value = '';
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        const routeName = role === 'client'
            ? route('client.profil.update')
            : role === 'artisan'
                ? route('artisan.profil.update')
                : route('profile.update');

        post(routeName, {
            forceFormData: true,
            method: 'patch',
        } as any);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Paramètres du profil" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Profil" description="Nom, prénom, coordonnées et photo de profil" />

                    <form onSubmit={submit} className="space-y-6">

                        {/* ── Photo de profil ── */}
                        <div className="space-y-2">
                            <Label className="text-sm font-semibold text-[hsl(20,14%,20%)]">
                                Photo de profil
                            </Label>
                            <div className="flex items-center gap-5">
                                <div className="relative shrink-0">
                                    {preview ? (
                                        <>
                                            <img src={preview} alt="Avatar"
                                                className="h-20 w-20 rounded-full object-cover ring-2 ring-amber-300" />
                                            <button type="button" onClick={removeAvatar}
                                                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition-colors">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border-2 border-dashed border-amber-300 flex items-center justify-center text-amber-500">
                                            <User className="h-9 w-9" />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <input ref={fileRef} id="avatar-settings" type="file"
                                        accept="image/jpeg,image/png,image/webp,image/gif"
                                        onChange={handleAvatar} className="hidden" />
                                    <label htmlFor="avatar-settings"
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[hsl(30,20%,82%)] bg-white px-4 py-2.5 text-sm font-medium text-[hsl(20,14%,30%)] hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 transition-all">
                                        <Camera className="h-4 w-4" />
                                        {preview ? 'Changer la photo' : 'Ajouter une photo'}
                                    </label>
                                    <p className="mt-1.5 text-xs text-[hsl(20,10%,55%)]">JPG, PNG, WebP · Max 2 Mo</p>
                                    <InputError message={errors.avatar} className="mt-1" />
                                </div>
                            </div>
                        </div>

                        {/* ── Nom / Prénom ── */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="prenom">Prénom</Label>
                                <Input id="prenom" value={data.prenom}
                                    onChange={handleFieldChange('prenom')}
                                    required autoComplete="given-name" />
                                <InputError message={errors.prenom} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="nom">Nom</Label>
                                <Input id="nom" value={data.nom}
                                    onChange={handleFieldChange('nom')}
                                    required autoComplete="family-name" />
                                <InputError message={errors.nom} />
                            </div>
                        </div>

                        {/* ── Téléphone ── */}
                        <div className="grid gap-2">
                            <Label htmlFor="telephone">Téléphone</Label>
                            <Input id="telephone" type="tel" value={data.telephone}
                                onChange={handleFieldChange('telephone')}
                                autoComplete="tel" />
                            <InputError message={errors.telephone} />
                        </div>

                        {/* ── Email ── */}
                        <div className="grid gap-2">
                            <Label htmlFor="email">Adresse e-mail</Label>
                            <Input id="email" type="email" value={data.email}
                                onChange={handleFieldChange('email')}
                                required autoComplete="username" />
                            <InputError message={errors.email} />
                        </div>

                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="mt-2 text-sm text-neutral-800">
                                    Votre adresse e-mail n&apos;est pas vérifiée.{' '}
                                    <Link href={route('verification.send')} method="post" as="button"
                                        className="rounded-md text-sm text-amber-600 underline hover:text-amber-700">
                                        Renvoyer l&apos;e-mail de vérification.
                                    </Link>
                                </p>
                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm font-medium text-green-600">
                                        Un nouveau lien de vérification a été envoyé.
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center gap-4">
                            <Button disabled={processing}
                                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white border-0">
                                Enregistrer
                            </Button>
                            <Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                                <p className="text-sm text-emerald-600 font-medium">✓ Enregistré</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}
