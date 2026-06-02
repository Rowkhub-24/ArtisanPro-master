import { useEffect, useRef } from 'react';

// Extend Window to include KkiaPay globals injected by the CDN script
declare global {
    interface Window {
        openKkiapayWidget: (options: KkiapayOptions) => void;
        addSuccessListener: (callback: (response: KkiapaySuccessResponse) => void) => void;
        addFailedListener: (callback: (response: KkiapayFailedResponse) => void) => void;
        removeKkiapayListener: (event: string, callback: (...args: unknown[]) => void) => void;
    }
}

interface KkiapayOptions {
    amount: number;
    key: string;
    sandbox?: boolean;
    email?: string;
    phone?: string;
    name?: string;
    data?: string;
    callback?: string;
    theme?: string;
}

interface KkiapaySuccessResponse {
    transactionId: string;
    [key: string]: unknown;
}

interface KkiapayFailedResponse {
    message?: string;
    [key: string]: unknown;
}

interface KkiapayWidgetProps {
    /** Montant en FCFA */
    amount: number;
    /** Clé publique KkiaPay */
    publicKey: string;
    /** URL de callback après paiement (route Laravel) */
    callbackUrl: string;
    /** Email du client (optionnel) */
    email?: string;
    /** Téléphone du client (optionnel) */
    phone?: string;
    /** Nom du client (optionnel) */
    name?: string;
    /** Données supplémentaires (JSON stringifié) */
    data?: string;
    /** Mode sandbox (true en dev) */
    sandbox?: boolean;
    /** Appelé quand le paiement réussit */
    onSuccess?: (transactionId: string) => void;
    /** Appelé quand le paiement échoue */
    onFailed?: (message: string) => void;
    /** Label du bouton */
    label?: string;
    /** Classes CSS supplémentaires pour le bouton */
    className?: string;
    /** Désactiver le bouton */
    disabled?: boolean;
}

/**
 * Composant KkiapayWidget
 *
 * Intègre le widget de paiement KkiaPay via le CDN k.js.
 * Le script CDN doit être chargé dans app.blade.php avant </body>.
 */
export default function KkiapayWidget({
    amount,
    publicKey,
    callbackUrl,
    email,
    phone,
    name,
    data,
    sandbox = false,
    onSuccess,
    onFailed,
    label = 'Payer Maintenant',
    className = '',
    disabled = false,
}: KkiapayWidgetProps) {
    const successHandlerRef = useRef<((response: KkiapaySuccessResponse) => void) | null>(null);
    const failedHandlerRef = useRef<((response: KkiapayFailedResponse) => void) | null>(null);

    useEffect(() => {
        // Cleanup previous listeners on re-render
        return () => {
            if (successHandlerRef.current && window.removeKkiapayListener) {
                window.removeKkiapayListener('success', successHandlerRef.current as (...args: unknown[]) => void);
            }
            if (failedHandlerRef.current && window.removeKkiapayListener) {
                window.removeKkiapayListener('failed', failedHandlerRef.current as (...args: unknown[]) => void);
            }
        };
    }, []);

    const handleClick = () => {
        if (disabled) return;

        if (typeof window.openKkiapayWidget !== 'function') {
            console.error('KkiaPay SDK non chargé. Vérifiez que le script CDN est inclus dans app.blade.php.');
            alert('Le service de paiement est temporairement indisponible. Veuillez réessayer.');
            return;
        }

        // Register success listener
        const successHandler = (response: KkiapaySuccessResponse) => {
            onSuccess?.(response.transactionId);
        };
        successHandlerRef.current = successHandler;
        window.addSuccessListener(successHandler);

        // Register failed listener
        const failedHandler = (response: KkiapayFailedResponse) => {
            onFailed?.(response.message ?? 'Paiement échoué');
        };
        failedHandlerRef.current = failedHandler;
        window.addFailedListener(failedHandler);

        // Open the KkiaPay payment widget
        window.openKkiapayWidget({
            amount,
            key: publicKey,
            sandbox,
            callback: callbackUrl,
            email,
            phone,
            name,
            data,
            theme: '#f59e0b', // amber-500 — couleur ArtisanPro
        });
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={disabled}
            className={`inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold px-6 py-3 text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
        >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            {label}
        </button>
    );
}
