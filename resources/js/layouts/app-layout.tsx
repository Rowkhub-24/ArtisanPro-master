import { Link, usePage } from '@inertiajs/react';
import {
    LayoutGrid, Calendar, FileText, MessageSquare, CreditCard,
    Star, Heart, AlertTriangle, User, Image, GraduationCap,
    MapPin, Bell, Home, ChevronRight, Menu, LogOut, Sparkles,
    Hammer, Search,
} from 'lucide-react';
import { useState } from 'react';
import { type BreadcrumbItem, type SharedData } from '@/types';
import DiagnosticIAModal from '@/components/diagnostic-ia-modal';

// ── Nav items ─────────────────────────────────────────────────────────────────

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    routePrefix: string;
    badge?: 'notifications';
}

const clientNavItems: NavItem[] = [
    { label: 'Tableau de bord', href: '/client/dashboard',    icon: LayoutGrid,    routePrefix: '/client/dashboard' },
    { label: 'Réservations',    href: '/client/reservations', icon: Calendar,      routePrefix: '/client/reservations' },
    { label: 'Mes Devis',       href: '/client/devis',        icon: FileText,      routePrefix: '/client/devis' },
    { label: 'Messages',        href: '/client/messages',     icon: MessageSquare, routePrefix: '/client/messages' },
    { label: 'Paiements',       href: '/client/paiements',    icon: CreditCard,    routePrefix: '/client/paiements' },
    { label: 'Mes Avis',        href: '/client/avis',         icon: Star,          routePrefix: '/client/avis' },
    { label: 'Favoris',         href: '/client/favoris',      icon: Heart,         routePrefix: '/client/favoris' },
    { label: 'Litiges',         href: '/client/litiges',      icon: AlertTriangle, routePrefix: '/client/litiges' },
    { label: 'Notifications',   href: '/notifications',       icon: Bell,          routePrefix: '/notifications', badge: 'notifications' },
    { label: 'Mon Profil',      href: '/client/profil',       icon: User,          routePrefix: '/client/profil' },
];

const artisanNavItems: NavItem[] = [
    { label: 'Tableau de bord', href: '/artisan/dashboard',       icon: LayoutGrid,    routePrefix: '/artisan/dashboard' },
    { label: 'Réservations',    href: '/artisan/reservations',    icon: Calendar,      routePrefix: '/artisan/reservations' },
    { label: 'Mes Devis',       href: '/artisan/devis',           icon: FileText,      routePrefix: '/artisan/devis' },
    { label: 'Messages',        href: '/artisan/messages',        icon: MessageSquare, routePrefix: '/artisan/messages' },
    { label: 'Mes Revenus',     href: '/artisan/paiements',       icon: CreditCard,    routePrefix: '/artisan/paiements' },
    { label: 'Mes Avis',        href: '/artisan/avis',            icon: Star,          routePrefix: '/artisan/avis' },
    { label: 'Portfolio',       href: '/artisan/portfolio',       icon: Image,         routePrefix: '/artisan/portfolio' },
    { label: 'Académie',        href: '/artisan/academy',         icon: GraduationCap, routePrefix: '/artisan/academy' },
    { label: 'Géolocalisation', href: '/artisan/geolocalisation', icon: MapPin,        routePrefix: '/artisan/geolocalisation' },
    { label: 'Notifications',   href: '/notifications',           icon: Bell,          routePrefix: '/notifications', badge: 'notifications' },
    { label: 'Mon Profil',      href: '/artisan/profil',          icon: User,          routePrefix: '/artisan/profil' },
];

const defaultNavItems: NavItem[] = [
    { label: 'Tableau de bord', href: '/dashboard', icon: LayoutGrid, routePrefix: '/dashboard' },
    { label: 'Annuaire',        href: '/artisans',  icon: Search,     routePrefix: '/artisans' },
    { label: 'Accueil',         href: '/',          icon: Hammer,     routePrefix: '/' },
];

// ── Sidebar component (defined OUTSIDE AppLayout to avoid remount) ────────────

interface SidebarProps {
    navItems: NavItem[];
    role: string | undefined;
    roleLabel: string;
    profileHref: string;
    notificationsCount: number;
    currentPath: string;
    onClose: () => void;
    onDiagnostic: () => void;
    mobile?: boolean;
    userName: string;
    userEmail: string;
    avatarUrl: string | null;
}

function AppSidebarPanel({
    navItems, role, roleLabel, profileHref, notificationsCount,
    currentPath, onClose, onDiagnostic, mobile = false,
    userName, userEmail, avatarUrl,
}: SidebarProps) {
    const isActive = (item: NavItem) => {
        if (item.routePrefix === '/client/dashboard')  return currentPath === '/client/dashboard';
        if (item.routePrefix === '/artisan/dashboard') return currentPath === '/artisan/dashboard';
        if (item.routePrefix === '/dashboard')         return currentPath === '/dashboard';
        return currentPath.startsWith(item.routePrefix);
    };

    const dashHref = role === 'client' ? '/client/dashboard' : role === 'artisan' ? '/artisan/dashboard' : '/';

    return (
        <aside className={`flex h-full flex-col bg-[hsl(20,14%,8%)] ${mobile ? 'w-72' : 'w-64'}`}>
            {/* Logo */}
            <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
                <Link href={dashHref} onClick={onClose}>
                    <img src="/images/ArtisanPro.jpg" alt="ArtisanPro" className="h-11 w-11 object-contain rounded-lg" />
                </Link>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-white/80 truncate">ArtisanPro</p>
                    <p className="text-xs text-white/40">{roleLabel}</p>
                </div>
            </div>

            {/* Diagnostic IA — client uniquement */}
            {role === 'client' && (
                <div className="px-3 pt-3">
                    <button
                        type="button"
                        onClick={onDiagnostic}
                        className="flex w-full items-center gap-2.5 rounded-xl border border-violet-500/30 bg-violet-500/10 px-3 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 transition-all"
                    >
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white shrink-0">
                            <Sparkles className="h-3.5 w-3.5" />
                        </span>
                        Diagnostic IA
                    </button>
                </div>
            )}

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
                {navItems.map((item) => {
                    const active = isActive(item);
                    const badgeCount = item.badge === 'notifications' ? notificationsCount : 0;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                                active
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                                    : 'text-white/55 hover:bg-white/8 hover:text-white/85'
                            }`}
                        >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {badgeCount > 0 && (
                                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                                    {badgeCount > 99 ? '99+' : badgeCount}
                                </span>
                            )}
                            {active && badgeCount === 0 && (
                                <ChevronRight className="h-3.5 w-3.5 text-amber-400/60" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-white/10 p-3 space-y-1">
                <Link
                    href="/"
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/45 hover:bg-white/8 hover:text-white/70 transition-all"
                >
                    <Home className="h-4 w-4" />
                    Voir le site
                </Link>
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-white/45 hover:bg-red-500/10 hover:text-red-400 transition-all"
                >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                </Link>

                {/* User card */}
                <Link
                    href={profileHref}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 mt-1 hover:bg-white/8 transition-all"
                >
                    {avatarUrl ? (
                        <img
                            src={avatarUrl}
                            alt={userName}
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-amber-500/40 shrink-0"
                        />
                    ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold shrink-0">
                            {userName.charAt(0).toUpperCase()}
                        </span>
                    )}
                    <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-white/80">{userName}</p>
                        <p className="truncate text-xs text-white/40">{userEmail}</p>
                    </div>
                </Link>
            </div>
        </aside>
    );
}

// ── Main layout ───────────────────────────────────────────────────────────────

interface AppLayoutProps {
    children: React.ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    const { auth, flash, notifications_non_lues } = usePage<SharedData>().props;
    const role = auth?.user?.type_utilisateur as string | undefined;
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showDiagnostic, setShowDiagnostic] = useState(false);

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const navItems =
        role === 'client'  ? clientNavItems  :
        role === 'artisan' ? artisanNavItems :
        defaultNavItems;

    const profileHref =
        role === 'client'  ? '/client/profil'  :
        role === 'artisan' ? '/artisan/profil' :
        '/settings/profile';

    const roleLabel =
        role === 'client'  ? 'Client'  :
        role === 'artisan' ? 'Artisan' :
        'Utilisateur';

    const userName  = `${auth?.user?.prenom ?? ''} ${auth?.user?.nom ?? ''}`.trim();
    const userEmail = (auth?.user?.email as string) ?? '';
    const avatarUrl = (auth?.user?.avatar_url ?? auth?.user?.avatar) as string | null ?? null;
    const notifCount = notifications_non_lues ?? 0;

    const sidebarProps: SidebarProps = {
        navItems,
        role,
        roleLabel,
        profileHref,
        notificationsCount: notifCount,
        currentPath,
        onClose: () => setSidebarOpen(false),
        onDiagnostic: () => { setShowDiagnostic(true); setSidebarOpen(false); },
        userName,
        userEmail,
        avatarUrl,
    };

    return (
        <>
            <div className="flex h-screen bg-[hsl(36,33%,97%)] overflow-hidden">

                {/* Desktop Sidebar */}
                <div className="hidden lg:flex lg:shrink-0">
                    <AppSidebarPanel {...sidebarProps} />
                </div>

                {/* Mobile Sidebar Overlay */}
                {sidebarOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setSidebarOpen(false)}
                        />
                        <div className="absolute left-0 top-0 h-full">
                            <AppSidebarPanel {...sidebarProps} mobile />
                        </div>
                    </div>
                )}

                {/* Main content */}
                <div className="flex flex-1 flex-col overflow-hidden">

                    {/* Top bar */}
                    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[hsl(30,20%,88%)] bg-white px-6 shadow-sm">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden rounded-xl p-2 text-[hsl(20,10%,45%)] hover:bg-[hsl(36,30%,93%)] transition-colors"
                            >
                                <Menu className="h-5 w-5" />
                            </button>

                            {breadcrumbs.length > 0 && (
                                <nav className="hidden sm:flex items-center gap-1.5 text-sm">
                                    {breadcrumbs.map((crumb, i) => (
                                        <span key={`${crumb.href}-${i}`} className="flex items-center gap-1.5">
                                            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[hsl(20,10%,60%)]" />}
                                            {i === breadcrumbs.length - 1 ? (
                                                <span className="font-medium text-[hsl(20,14%,12%)]">{crumb.title}</span>
                                            ) : (
                                                <Link href={crumb.href} className="text-[hsl(20,10%,50%)] hover:text-amber-600 transition-colors">
                                                    {crumb.title}
                                                </Link>
                                            )}
                                        </span>
                                    ))}
                                </nav>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <Link
                                href="/notifications"
                                className="relative rounded-xl p-2 text-[hsl(20,10%,45%)] hover:bg-[hsl(36,30%,93%)] transition-colors"
                            >
                                <Bell className="h-5 w-5" />
                                {notifCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">
                                        {notifCount > 9 ? '9+' : notifCount}
                                    </span>
                                )}
                            </Link>

                            <Link
                                href={profileHref}
                                className="flex items-center gap-2 rounded-xl border border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)] px-3 py-1.5 hover:border-amber-300 transition-colors"
                            >
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={userName}
                                        className="h-7 w-7 rounded-full object-cover ring-1 ring-amber-200"
                                    />
                                ) : (
                                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-white text-xs font-bold">
                                        {userName.charAt(0).toUpperCase()}
                                    </span>
                                )}
                                <span className="text-sm font-medium text-[hsl(20,14%,20%)] hidden sm:block">
                                    {userName}
                                </span>
                            </Link>
                        </div>
                    </header>

                    {/* Flash messages */}
                    {flash?.success && (
                        <div className="mx-6 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                            ✓ {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                            ✕ {flash.error}
                        </div>
                    )}

                    {/* Page content */}
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>

            {showDiagnostic && (
                <DiagnosticIAModal onClose={() => setShowDiagnostic(false)} />
            )}
        </>
    );
}
