import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Must match `localStorage` key and inline bootstrap in `index.html`. */
export const THEME_STORAGE_KEY = 'theme';

export type Theme = 'light' | 'dark';

export type ThemeStore = {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    toggleTheme: () => void;
};

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set, get) => ({
            theme: 'dark',
            setTheme: (theme: Theme) => set({ theme }),
            toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
        }),
        {
            name: THEME_STORAGE_KEY,
            partialize: (state) => ({ theme: state.theme }),
        },
    ),
);
