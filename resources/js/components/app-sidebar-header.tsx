import { Breadcrumbs } from '@/components/breadcrumbs';
import LanguageSwitcher from '@/components/language-switcher';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLocale } from '@/i18n/use-locale';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';
import { Link } from '@inertiajs/react';
import { Home } from 'lucide-react';

export function AppSidebarHeader({ breadcrumbs = [] }: { breadcrumbs?: BreadcrumbItemType[] }) {
    const { locale, setLocale } = useLocale();

    return (
        <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-[hsl(30,20%,88%)] bg-white px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1 text-[hsl(20,10%,45%)] hover:text-[hsl(20,14%,12%)]" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            <div className="flex items-center gap-2">
                <LanguageSwitcher locale={locale} onLocaleChange={setLocale} variant="light" />
                <Link
                    href={route('home')}
                    className="flex items-center gap-1.5 rounded-xl border border-[hsl(30,20%,88%)] bg-[hsl(36,33%,97%)] px-3 py-1.5 text-sm font-medium text-[hsl(20,10%,45%)] hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 transition-all"
                >
                    <Home className="h-4 w-4" />
                    <span className="hidden sm:inline">Accueil</span>
                </Link>
            </div>
        </header>
    );
}
