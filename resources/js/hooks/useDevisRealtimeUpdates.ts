import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';

/**
 * Recharge les props `devis` Inertia :
 * - Immédiatement au focus de l'onglet ou quand la page redevient visible
 * - Toutes les 3 secondes en polling de fond (pour réactivité immédiate)
 *
 * Reverb/WebSocket est désactivé — on utilise du polling léger.
 */
export function useDevisRealtimeUpdates(_userId?: number) {
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const reload = () => router.reload({ only: ['devis'] });

        // Rechargement quand l'onglet reprend le focus
        window.addEventListener('focus', reload);

        // Rechargement quand la page redevient visible (changement d'onglet)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                reload();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Polling toutes les 3 secondes pour que le client voit les réponses rapidement
        pollRef.current = setInterval(reload, 3000);

        return () => {
            window.removeEventListener('focus', reload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (pollRef.current) {
                clearInterval(pollRef.current);
                pollRef.current = null;
            }
        };
    }, []);
}
