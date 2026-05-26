import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { type Locale, translations } from './translations';

const STORAGE_KEY = 'artisanpro_locale';
const DEFAULT_LOCALE: Locale = 'fr';

interface LocaleContextValue {
    locale: Locale;
    setLocale: (l: Locale) => void;
    t: (key: string, fallback?: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
    locale: DEFAULT_LOCALE,
    setLocale: () => {},
    t: (key) => key,
});

function detectLocale(): Locale {
    try {
        const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
        if (stored && translations[stored]) return stored;
        const lang = navigator.language?.toLowerCase() ?? '';
        if (lang.startsWith('en')) return 'en';
        if (lang.startsWith('yo')) return 'yo';
        if (lang.startsWith('fon') || lang.startsWith('fɔ')) return 'fon';
    } catch {}
    return DEFAULT_LOCALE;
}

export function LocaleProvider({ children }: { children: ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

    useEffect(() => {
        setLocaleState(detectLocale());
    }, []);

    const setLocale = useCallback((l: Locale) => {
        try { localStorage.setItem(STORAGE_KEY, l); } catch {}
        setLocaleState(l);
        // Met à jour l'attribut lang du document HTML
        document.documentElement.lang = l;
    }, []);

    const t = useCallback(
        (key: string, fallback?: string): string =>
            translations[locale]?.[key] ?? translations['fr']?.[key] ?? fallback ?? key,
        [locale],
    );

    return (
        <LocaleContext.Provider value={{ locale, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    );
}

/** Hook pour utiliser le contexte de langue dans n'importe quel composant */
export function useLocale() {
    return useContext(LocaleContext);
}
