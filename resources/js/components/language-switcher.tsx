import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { type Locale, LOCALES } from '@/i18n/translations';

interface Props {
    locale: Locale;
    onLocaleChange: (l: Locale) => void;
    variant?: 'dark' | 'light';
}

export default function LanguageSwitcher({ locale, onLocaleChange, variant = 'dark' }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isDark = variant === 'dark';

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-all ${
                    isDark
                        ? 'text-white/70 hover:text-white hover:bg-white/8'
                        : 'text-[hsl(20,10%,45%)] hover:text-[hsl(20,14%,12%)] hover:bg-[hsl(36,33%,97%)]'
                }`}
                aria-label="Changer de langue"
            >
                <span className="text-base leading-none">{current.flag}</span>
                <span className="hidden sm:block">{current.code.toUpperCase()}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-[hsl(30,20%,88%)] bg-white shadow-xl z-50 overflow-hidden">
                    {LOCALES.map((l) => (
                        <button
                            key={l.code}
                            onClick={() => { onLocaleChange(l.code); setOpen(false); }}
                            className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                l.code === locale
                                    ? 'bg-amber-50 text-amber-700 font-semibold'
                                    : 'text-[hsl(20,14%,12%)] hover:bg-[hsl(36,33%,97%)]'
                            }`}
                        >
                            <span className="text-base">{l.flag}</span>
                            <div className="text-left">
                                <div className="font-medium">{l.nativeName}</div>
                                <div className="text-xs text-[hsl(20,10%,55%)]">{l.label}</div>
                            </div>
                            {l.code === locale && (
                                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-500" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
