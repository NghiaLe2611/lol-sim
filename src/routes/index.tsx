import { AppLayout } from '@/components/AppLayout';
import BuildPage from '@/pages/build';
import ChampionDetailPage from '@/pages/champion-detail';
import ChampionsPage from '@/pages/champions';
import HomePage from '@/pages/home';
import ItemsPage from '@/pages/items';
import NotFoundPage from '@/pages/not-found';
import RunesPage from '@/pages/runes';
import SpellsPage from '@/pages/spells';
import type { RouteObject } from 'react-router-dom';

export const appRoutes: RouteObject[] = [
	{
		path: '/',
		element: <AppLayout />,
		children: [
			{ index: true, element: <HomePage /> },
			{ path: 'champions', element: <ChampionsPage /> },
			{ path: 'champions/:id', element: <ChampionDetailPage /> },
			{ path: 'items', element: <ItemsPage /> },
			{ path: 'runes', element: <RunesPage /> },
			{ path: 'spells', element: <SpellsPage /> },
			{ path: 'build', element: <BuildPage /> },
			{ path: '*', element: <NotFoundPage /> },
		],
	},
];
