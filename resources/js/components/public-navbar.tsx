/**
 * Navbar partagée pour toutes les pages publiques (accueil, annuaire, a-propos, faq, contact, cgv...).
 * Inclut : logo, navigation, Diagnostic IA, sélecteur de langue, boutons auth.
 */
import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import DiagnosticIAModal from '@/components/diagnostic-ia-modal';
import LanguageSwitcher from '@/components/language-switcher';
import { useLocale } from '@/i18n/use-locale';
import { type SharedData } from '@/types';

export default function PublicNavbar() {
    const { auth } = usePage<SharedData>().props;
    const { locale, setLocale, t } = useLocale();
    const [showDiagnostic, setShowDiagnostic] = useState(false);

    return (
        <>
            <header className="fixed top-0 inset-x-0 z-50 border-b border-white/8 bg-[hsl(20,14%,10%)]/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5">
                        <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-12 w-12 object-contain" />
                    </Link>

                    {/* Nav links */}
                    <nav className="hidden md:flex items-center gap-1">
                        <Link href={route('artisans.index')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">
                            {t('nav.annuaire')}
                        </Link>
                        <Link href={route('about')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">
                            {t('nav.about')}
                        </Link>
                        <Link href={route('faq')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">
                            {t('nav.faq')}
                        </Link>
                        <Link href={route('contact')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white hover:bg-white/8 transition-all">
                            {t('nav.contact')}
                        </Link>
                        {/* Diagnostic IA */}
                        <button
                            onClick={() => setShowDiagnostic(true)}
                            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium text-violet-300 hover:text-white hover:bg-violet-500/20 border border-violet-500/30 transition-all"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            {t('nav.diagnostic')}
                        </button>
                    </nav>

                    {/* Right actions */}
                    <div className="flex items-center gap-2">
                        {/* Diagnostic IA mobile */}
                        <button
                            onClick={() => setShowDiagnostic(true)}
                            className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-xl border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 transition-all"
                            aria-label="Diagnostic IA"
                        >
                            <Sparkles className="h-4 w-4" />
                        </button>

                        {/* Sélecteur de langue */}
                        <LanguageSwitcher locale={locale} onLocaleChange={setLocale} variant="dark" />

                        {/* Auth */}
                        {auth.user ? (
                            <Link href={route('dashboard')} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/25 transition-all">
                                {t('nav.dashboard')} <ArrowRight className="h-4 w-4" />
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="rounded-lg px-3.5 py-2 text-sm font-medium text-white/70 hover:text-white transition-all">
                                    {t('nav.login')}
                                </Link>
                                <Link href={route('register')} className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-amber-900/25 transition-all">
                                    {t('nav.register')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {showDiagnostic && <DiagnosticIAModal onClose={() => setShowDiagnostic(false)} />}
        </>
    );
}
