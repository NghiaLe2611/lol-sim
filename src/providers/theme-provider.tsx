import { THEME_STORAGE_KEY, useThemeStore, type Theme } from '@/stores/useTheme';
import { createContext, useContext, useEffect, type ReactNode } from 'react';

export type { Theme };

type ThemeProviderProps = {
	children: ReactNode;
	defaultTheme?: Theme;
	/** Reserved for API compatibility; persist uses localStorage key `"theme"`. */
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({
	children,
	defaultTheme = 'dark',
	storageKey: _storageKey = 'theme',
}: ThemeProviderProps) {
	void _storageKey;

	const theme = useThemeStore((s) => s.theme);
	const setTheme = useThemeStore((s) => s.setTheme);

	useEffect(() => {
		try {
			if (localStorage.getItem(THEME_STORAGE_KEY) === null) {
				setTheme(defaultTheme);
			}
		} catch {
			setTheme(defaultTheme);
		}
	}, [defaultTheme, setTheme]);

	useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove('light', 'dark');
		root.classList.add(theme);
		root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
	}, [theme]);

	const value: ThemeProviderState = {
		theme,
		setTheme,
	};

	return <ThemeProviderContext.Provider value={value}>{children}</ThemeProviderContext.Provider>;
}

export function useTheme() {
	const context = useContext(ThemeProviderContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
