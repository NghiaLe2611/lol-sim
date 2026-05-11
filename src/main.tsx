import App from '@/App';
import { ThemeProvider } from '@/providers/theme-provider';
import { useThemeStore } from '@/stores/useTheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import '@/styles/main.scss';

const queryClient = new QueryClient();

let rootMounted = false;

function renderApp() {
    if (rootMounted) return;
    rootMounted = true;

    createRoot(document.getElementById('root')!).render(
        // <StrictMode>
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </ThemeProvider>
            {/* <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} /> */}
        </QueryClientProvider>,
        // </StrictMode>
    );
}

if (useThemeStore.persist.hasHydrated()) {
    renderApp();
} else {
    const unsub = useThemeStore.persist.onFinishHydration(() => {
        unsub();
        renderApp();
    });

    queueMicrotask(() => {
        if (useThemeStore.persist.hasHydrated()) {
            unsub();
            renderApp();
        }
    });
}
