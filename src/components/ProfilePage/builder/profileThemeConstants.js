/**
 * Profile Builder V1 — shared client-side whitelists & registries.
 *
 * These mirror the server whitelist in server/utils/profileThemeValidation.js.
 * Keep the two in sync: the server is the source of truth and will strip /
 * normalize anything the client sends that falls outside these sets.
 */

export const PROFILE_THEME_VERSION = 1;

export const MAX_STICKERS = 20;

// ── Fonts ──────────────────────────────────────────────────────────────────
// All families are already loaded globally via client/src/index.css.
export const PROFILE_FONTS = [
    { key: "outfit", label: "Outfit", stack: "'Outfit', sans-serif" },
    { key: "lora", label: "Lora", stack: "'Lora', serif" },
    { key: "playfair", label: "Playfair", stack: "'Playfair Display', serif" },
    { key: "comfortaa", label: "Comfortaa", stack: "'Comfortaa', cursive" },
    { key: "lexend", label: "Lexend", stack: "'Lexend Deca', sans-serif" },
    { key: "patrick", label: "Patrick Hand", stack: "'Patrick Hand', cursive" },
];

export const FONT_STACK_BY_KEY = PROFILE_FONTS.reduce((acc, f) => {
    acc[f.key] = f.stack;
    return acc;
}, {});

// ── Typography scale ─────────────────────────────────────────────────────────
export const TYPE_SCALES = [
    { key: "compact", label: "Compact", multiplier: 0.92 },
    { key: "normal", label: "Normal", multiplier: 1 },
    { key: "spacious", label: "Spacious", multiplier: 1.12 },
];

export const SCALE_MULTIPLIER_BY_KEY = TYPE_SCALES.reduce((acc, s) => {
    acc[s.key] = s.multiplier;
    return acc;
}, {});

// ── Cards ────────────────────────────────────────────────────────────────────
export const CARD_STYLES = [
    { key: "glass", label: "Glass" },
    { key: "solid", label: "Solid" },
    { key: "paper", label: "Paper" },
    { key: "minimal", label: "Minimal" },
];

export const CARD_RADII = [
    { key: "sharp", label: "Sharp", value: "6px" },
    { key: "soft", label: "Soft", value: "16px" },
    { key: "round", label: "Round", value: "26px" },
];

export const RADIUS_VALUE_BY_KEY = CARD_RADII.reduce((acc, r) => {
    acc[r.key] = r.value;
    return acc;
}, {});

export const CARD_BORDERS = [
    { key: "none", label: "None", width: "0px" },
    { key: "soft", label: "Soft", width: "0.7px" },
    { key: "bold", label: "Bold", width: "2px" },
];

export const BORDER_WIDTH_BY_KEY = CARD_BORDERS.reduce((acc, b) => {
    acc[b.key] = b.width;
    return acc;
}, {});

export const CARD_SHADOWS = [
    { key: "none", label: "None", value: "none" },
    { key: "soft", label: "Soft", value: "0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)" },
    { key: "strong", label: "Strong", value: "0 18px 48px rgba(0,0,0,0.22), 0 6px 16px rgba(0,0,0,0.14)" },
];

export const SHADOW_VALUE_BY_KEY = CARD_SHADOWS.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
}, {});

// Backdrop blur per card style (used for the glass effect).
export const CARD_BLUR_BY_STYLE = {
    glass: "blur(25px)",
    solid: "blur(0px)",
    paper: "blur(0px)",
    minimal: "blur(0px)",
};

// ── Sections ─────────────────────────────────────────────────────────────────
// `togglable: false` means the section can never be hidden in the builder UI.
export const PROFILE_SECTIONS = [
    { id: "hero", label: "Header", togglable: false },
    { id: "stats", label: "Stats", togglable: true },
    { id: "bio", label: "Bio", togglable: true },
    { id: "joined_date", label: "Joined date", togglable: true },
    { id: "pinned_writings", label: "Pinned writings", togglable: true },
    { id: "writings", label: "Writings", togglable: false },
    { id: "media", label: "Media", togglable: true },
    { id: "opinions", label: "Opinions", togglable: true },
    { id: "stories", label: "Stories", togglable: true },
    { id: "guestbook", label: "Guestbook", togglable: true },
];

export const ALLOWED_SECTION_IDS = PROFILE_SECTIONS.map((s) => s.id);

// Sections that are forced visible regardless of theme config.
export const REQUIRED_SECTION_IDS = PROFILE_SECTIONS.filter((s) => s.togglable === false).map((s) => s.id);
