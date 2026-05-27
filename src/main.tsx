import App from '@/App';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeProvider } from '@/providers/theme-provider';
import { useThemeStore } from '@/stores/useTheme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import './i18n';
// import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import '@/styles/main.scss';
import { TooltipProvider } from './components/ui/tooltip';

const queryClient = new QueryClient();

let rootMounted = false;

function renderApp() {
	if (rootMounted) return;
	rootMounted = true;

	createRoot(document.getElementById('root')!).render(
		// <StrictMode>
		<QueryClientProvider client={queryClient}>
			<HelmetProvider>
				<AppProvider>
					<ThemeProvider>
						<BrowserRouter>
							<TooltipProvider delayDuration={0}>
								<App />
							</TooltipProvider>
						</BrowserRouter>
					</ThemeProvider>
				</AppProvider>
			</HelmetProvider>
			{/* <ReactQueryDevtools buttonPosition="bottom-left" initialIsOpen={false} /> */}
		</QueryClientProvider>
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

// https://support-developer.riotgames.com/hc/en-us/articles/22698698001939-League-of-Legends
// https://ddragon.leagueoflegends.com/cdn/13.22.1/img/sprite/spell0.png
// https://cdn.merakianalytics.com/riot/lol/resources/latest/en-US/champions/
