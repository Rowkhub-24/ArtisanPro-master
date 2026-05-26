import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { type BreadcrumbItem } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, useForm } from '@inertiajs/react';
import { FormEventHandler, useRef } from 'react';

import HeadingSmall from '@/components/heading-small';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Mot de passe', href: '/settings/password' },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const updatePassword: FormEventHandler = (e) => {
        e.preventDefault();
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errors) => {
                if (errors.password) { reset('password', 'password_confirmation'); passwordInput.current?.focus(); }
                if (errors.current_password) { reset('current_password'); currentPasswordInput.current?.focus(); }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Mot de passe - ArtisanPro" />
            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="Modifier le mot de passe" description="Utilisez un mot de passe long et aléatoire pour sécuriser votre compte" />
                    <form onSubmit={updatePassword} className="space-y-5">
                        <div className="grid gap-2">
                            <Label htmlFor="current_password" className="text-sm font-semibold text-[hsl(20,14%,20%)]">Mot de passe actuel</Label>
                            <Input id="current_password" ref={currentPasswordInput} value={data.current_password}
                                onChange={(e) => setData('current_password', e.target.value)}
                                type="password" autoComplete="current-password" placeholder="••••••••"
                                className="rounded-xl border-[hsl(30,20%,82%)] focus:border-amber-400 focus:ring-amber-400/20" />
                            <InputError message={errors.current_password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password" className="text-sm font-semibold text-[hsl(20,14%,20%)]">Nouveau mot de passe</Label>
                            <Input id="password" ref={passwordInput} value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                type="password" autoComplete="new-password" placeholder="••••••••"
                                className="rounded-xl border-[hsl(30,20%,82%)] focus:border-amber-400 focus:ring-amber-400/20" />
                            <InputError message={errors.password} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation" className="text-sm font-semibold text-[hsl(20,14%,20%)]">Confirmer le mot de passe</Label>
                            <Input id="password_confirmation" value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                type="password" autoComplete="new-password" placeholder="••••••••"
                                className="rounded-xl border-[hsl(30,20%,82%)] focus:border-amber-400 focus:ring-amber-400/20" />
                            <InputError message={errors.password_confirmation} />
                        </div>
                        <div className="flex items-center gap-4">
                            <button type="submit" disabled={processing}
                                className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-6 py-2.5 shadow-sm transition-all disabled:opacity-60">
                                {processing ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                            <Transition show={recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                                <p className="text-sm text-emerald-600 font-medium">✓ Enregistré</p>
                            </Transition>
                        </div>
                    </form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
