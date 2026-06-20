// App Theme system — the PRIVATE Iskrib app interface appearance.
//
// IMPORTANT: this is NOT the public Profile Builder theme (`profile_theme`).
// Profile themes style a user's public room; App themes style the app shell
// (feed, settings, discovery, notifications, etc.) for the viewer only.
// These two systems never share schema or storage.
//
// Each theme maps to a base light/dark "family" so the existing
// `[data-theme="dark"]` component overrides keep working: dark-family app
// themes still get `data-theme="dark"` on <html>, while the specific palette
// comes from `[data-app-theme="<id>"]` blocks in index.css.

export const APP_THEME_STORAGE_KEY = "iskrib-app-theme";
// The pre-existing binary toggle persisted here ('light' | 'dark'). We migrate
// from it once so users keep their previous choice.
export const LEGACY_THEME_STORAGE_KEY = "theme";
export const DEFAULT_APP_THEME = "system";

// Swatches are [background, surface, text, accent] — used by the picker preview.
export const APP_THEMES = [
    {
        id: "system",
        label: "System",
        description: "Follow your device setting.",
        base: null, // resolved at runtime from prefers-color-scheme
        swatches: ["#FAF9F6", "#1A1916", "#D4A853"],
    },
    {
        id: "light",
        label: "Light",
        description: "Warm paper and ink.",
        base: "light",
        swatches: ["#FAF9F6", "#FEFEFE", "#1A1612", "#D4A853"],
    },
    {
        id: "dark",
        label: "Dark",
        description: "Classic Iskrib dark.",
        base: "dark",
        swatches: ["#1A1916", "#262624", "#F0EBE3", "#E0BA6A"],
    },
    {
        id: "midnight",
        label: "Midnight",
        description: "Deep night writing.",
        base: "dark",
        swatches: ["#0E1320", "#1A2233", "#E6ECF7", "#84A9E8"],
    },
    {
        id: "sepia",
        label: "Sepia",
        description: "Old notebook warmth.",
        base: "light",
        swatches: ["#F4ECD8", "#FBF6E8", "#3B2F22", "#C28A3D"],
    },
    {
        id: "forest",
        label: "Forest",
        description: "Quiet moss and ink.",
        base: "dark",
        swatches: ["#11160F", "#1C2417", "#E8EEDF", "#9DB079"],
    },
    {
        id: "rose",
        label: "Rose",
        description: "Soft diary warmth.",
        base: "light",
        swatches: ["#F7ECEA", "#FDF6F4", "#3E2A28", "#C77B7B"],
    },
    {
        id: "ocean",
        label: "Ocean",
        description: "Deep blue calm.",
        base: "dark",
        swatches: ["#0C1A1E", "#142A30", "#DDEAEC", "#5FB3B0"],
    },
];

const BASE_BY_ID = APP_THEMES.reduce((acc, t) => {
    if (t.base) acc[t.id] = t.base;
    return acc;
}, {});

const THEME_IDS = new Set(APP_THEMES.map((t) => t.id));

export const isValidAppTheme = (id) => THEME_IDS.has(id);

// The light/dark family for a *resolved* theme id (never 'system').
export const getThemeBase = (id) => BASE_BY_ID[id] || "light";

export const systemPrefersDark = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

// Turn the user's selection (which may be 'system' or invalid) into a concrete
// theme id that has a real palette.
export const resolveAppTheme = (selected, prefersDark) => {
    if (selected === "system" || !isValidAppTheme(selected)) {
        return prefersDark ? "dark" : "light";
    }
    return selected;
};

// Read the stored selection, migrating from the legacy binary toggle key once.
export const readStoredAppTheme = () => {
    try {
        const saved = localStorage.getItem(APP_THEME_STORAGE_KEY);
        if (saved && isValidAppTheme(saved)) return saved;
        const legacy = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
        if (legacy === "light" || legacy === "dark") return legacy;
    } catch {
        // localStorage can throw in private mode / sandboxed iframes — fall back.
    }
    return DEFAULT_APP_THEME;
};
