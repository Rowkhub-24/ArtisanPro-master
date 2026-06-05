import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { route as routeFn } from 'ziggy-js';
import { Ziggy } from './ziggy';
import { initializeTheme } from './hooks/use-appearance';
import { LocaleProvider } from './i18n/locale-context';

declare global {
    // eslint-disable-next-line no-var
    var route: typeof routeFn;
}

// Make route() available globally in all components, using the local Ziggy config
window.route = (name, params, absolute) => routeFn(name, params, absolute, Ziggy);

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
            <LocaleProvider>
                <App {...props} />
            </LocaleProvider>
        );
    },
    progress: {
        color: '#f59e0b',
    },
});

initializeTheme();
