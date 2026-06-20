import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
    APP_THEMES,
    APP_THEME_STORAGE_KEY,
    getThemeBase,
    isValidAppTheme,
    readStoredAppTheme,
    resolveAppTheme,
    systemPrefersDark,
} from '../theme/appThemes.js';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    // What the user picked: 'system' | 'light' | 'dark' | 'midnight' | … (persisted).
    const [selectedTheme, setSelectedTheme] = useState(() => readStoredAppTheme());
    // Live OS preference — only matters while selectedTheme === 'system'.
    const [prefersDark, setPrefersDark] = useState(() => systemPrefersDark());

    // The concrete theme id with a real palette (never 'system').
    const resolvedTheme = resolveAppTheme(selectedTheme, prefersDark);
    // The light/dark family — drives the legacy `data-theme` attribute so all the
    // existing `[data-theme="dark"]` component overrides keep applying to the
    // dark-family app themes (midnight / forest / ocean).
    const base = getThemeBase(resolvedTheme);

    // Apply to <html> + persist whenever the resolution changes.
    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = base;              // backward-compat: 'light' | 'dark'
        root.dataset.appTheme = resolvedTheme;  // specific palette: 'midnight', …
        root.dataset.themePreference = selectedTheme; // raw choice incl. 'system'
        try {
            localStorage.setItem(APP_THEME_STORAGE_KEY, selectedTheme);
        } catch {
            // Ignore storage failures (private mode); the attribute is still applied.
        }
    }, [base, resolvedTheme, selectedTheme]);

    // Track OS preference changes so 'system' follows the device live.
    useEffect(() => {
        if (typeof window.matchMedia !== 'function') return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => setPrefersDark(e.matches);
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const setAppTheme = useCallback((id) => {
        if (isValidAppTheme(id)) setSelectedTheme(id);
    }, []);

    // Legacy binary toggle (sidebar / mobile nav). Flips between canonical
    // light and dark based on the current family, so the switch stays intuitive
    // even when a fancy theme is active. Picking midnight/sepia/etc. lives in
    // the Settings Appearance picker.
    const toggleTheme = useCallback(() => {
        setSelectedTheme(base === 'dark' ? 'light' : 'dark');
    }, [base]);

    const value = useMemo(
        () => ({
            // Legacy API — kept stable for existing consumers.
            theme: base,
            toggleTheme,
            // App theme API.
            selectedTheme,
            resolvedTheme,
            setAppTheme,
            availableThemes: APP_THEMES,
        }),
        [base, toggleTheme, selectedTheme, resolvedTheme, setAppTheme]
    );

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
