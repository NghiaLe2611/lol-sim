import { apiUrl } from '@/constants/common';
import { getVersions } from '@/services/api';
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

export type AppContextState = {
	patchVersion: string | null;
	isPatchPending: boolean;
	isPatchError: boolean;
	patchError: Error | null;
	isPatchReady: boolean;
};

export type AppUpdaterValue = {
	refetchPatchVersion: () => Promise<unknown>;
};

const AppStateContext = createContext<AppContextState | null>(null);
const AppUpdaterContext = createContext<AppUpdaterValue | null>(null);

function AppProvider({ children }: { children: ReactNode }) {
	const q = useQuery({
		queryKey: ['version'],
		queryFn: getVersions,
		staleTime: 1000 * 60 * 60 * 12,
		gcTime: 1000 * 60 * 60 * 24,
		retry: 2,
		// refetchOnWindowFocus: false,
	});

	const state = useMemo((): AppContextState => {
		const patchVersion = q.data ?? null;
		const err = q.error;
		return {
			patchVersion,
			isPatchPending: q.isPending,
			isPatchError: q.isError,
			patchError: err instanceof Error ? err : err != null ? new Error(String(err)) : null,
			isPatchReady: patchVersion != null && !q.isError,
		};
	}, [q.data, q.error, q.isError, q.isPending]);

	const updater = useMemo(
		(): AppUpdaterValue => ({
			refetchPatchVersion: () => q.refetch(),
		}),
		[q.refetch]
	);

	return (
		<AppStateContext.Provider value={state}>
			<AppUpdaterContext.Provider value={updater}>{children}</AppUpdaterContext.Provider>
		</AppStateContext.Provider>
	);
}

function useAppContext(): AppContextState {
	const ctx = useContext(AppStateContext);
	if (!ctx) throw new Error('useAppContext must be used within AppProvider');
	return ctx;
}

function useAppUpdater(): AppUpdaterValue {
	const ctx = useContext(AppUpdaterContext);
	if (!ctx) throw new Error('useAppUpdater must be used within AppProvider');
	return ctx;
}

export { AppProvider, useAppContext, useAppUpdater };
