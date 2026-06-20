/**
 * Profile Builder V1 — preset themes.
 *
 * A preset only carries presentation overrides (colors / typography / cards).
 * Section visibility and stickers are left to the user, so applying a preset
 * never destroys their layout choices.
 */

export const PROFILE_THEME_PRESETS = [
    {
        id: "midnight",
        label: "Midnight",
        swatch: ["#0f1226", "#D4A853"],
        colors: {
            text: "#f3f4ff",
            accent: "#D4A853",
            cardBackground: "rgba(20,24,48,0.55)",
            cardBorder: "rgba(212,168,83,0.28)",
        },
        typography: { font: "outfit", scale: "normal" },
        cards: { style: "glass", radius: "round", border: "soft", shadow: "soft" },
    },
    {
        id: "parchment",
        label: "Parchment",
        swatch: ["#f3e9d2", "#8a6d3b"],
        colors: {
            text: "#3b2f1c",
            accent: "#8a6d3b",
            cardBackground: "rgba(255,250,238,0.78)",
            cardBorder: "rgba(138,109,59,0.30)",
        },
        typography: { font: "lora", scale: "normal" },
        cards: { style: "paper", radius: "soft", border: "soft", shadow: "soft" },
    },
    {
        id: "sakura",
        label: "Sakura",
        swatch: ["#ffd9e3", "#d6336c"],
        colors: {
            text: "#5a2a3c",
            accent: "#d6336c",
            cardBackground: "rgba(255,235,242,0.70)",
            cardBorder: "rgba(214,51,108,0.25)",
        },
        typography: { font: "comfortaa", scale: "normal" },
        cards: { style: "glass", radius: "round", border: "soft", shadow: "soft" },
    },
    {
        id: "forest",
        label: "Forest",
        swatch: ["#1c3a2e", "#7bc47f"],
        colors: {
            text: "#eaf7ee",
            accent: "#7bc47f",
            cardBackground: "rgba(20,46,36,0.55)",
            cardBorder: "rgba(123,196,127,0.28)",
        },
        typography: { font: "lexend", scale: "normal" },
        cards: { style: "glass", radius: "soft", border: "soft", shadow: "soft" },
    },
    {
        id: "noir",
        label: "Noir",
        swatch: ["#111111", "#ffffff"],
        colors: {
            text: "#fafafa",
            accent: "#ffffff",
            cardBackground: "rgba(255,255,255,0.06)",
            cardBorder: "rgba(255,255,255,0.18)",
        },
        typography: { font: "playfair", scale: "normal" },
        cards: { style: "minimal", radius: "sharp", border: "soft", shadow: "none" },
    },
    {
        id: "sunset",
        label: "Sunset",
        swatch: ["#ff7e5f", "#feb47b"],
        colors: {
            text: "#3a1d16",
            accent: "#ff5e62",
            cardBackground: "rgba(255,240,230,0.62)",
            cardBorder: "rgba(255,94,98,0.25)",
        },
        typography: { font: "outfit", scale: "spacious" },
        cards: { style: "glass", radius: "round", border: "soft", shadow: "strong" },
    },
    {
        id: "ocean",
        label: "Ocean",
        swatch: ["#1a5276", "#76d7ea"],
        colors: {
            text: "#eaf7fb",
            accent: "#76d7ea",
            cardBackground: "rgba(20,60,88,0.52)",
            cardBorder: "rgba(118,215,234,0.28)",
        },
        typography: { font: "lexend", scale: "normal" },
        cards: { style: "glass", radius: "round", border: "soft", shadow: "soft" },
    },
    {
        id: "lavender",
        label: "Lavender",
        swatch: ["#e9defb", "#7048c4"],
        colors: {
            text: "#3a2a5e",
            accent: "#7048c4",
            cardBackground: "rgba(245,239,255,0.74)",
            cardBorder: "rgba(112,72,196,0.24)",
        },
        typography: { font: "comfortaa", scale: "normal" },
        cards: { style: "paper", radius: "round", border: "soft", shadow: "soft" },
    },
];

export const PRESET_BY_ID = PROFILE_THEME_PRESETS.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
}, {});

/**
 * Return a new theme with the preset's presentation applied, preserving the
 * user's section layout and stickers.
 */
export const applyPresetToTheme = (theme, presetId) => {
    const preset = PRESET_BY_ID[presetId];
    if (!preset) return theme;
    return {
        ...theme,
        presetId: preset.id,
        colors: { ...preset.colors },
        typography: { ...preset.typography },
        cards: { ...preset.cards },
    };
};
