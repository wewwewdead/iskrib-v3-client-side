/**
 * Profile Builder V1 — shared client-side whitelists & registries.
 *
 * These mirror the server whitelist in server/utils/profileThemeValidation.js.
 * Keep the two in sync: the server is the source of truth and will strip /
 * normalize anything the client sends that falls outside these sets.
 */

// V2 adds the `layout` block (Profile Builder V3 — Layout Composer). Older v1
// themes are still read: a default layout is derived from their `sections`.
export const PROFILE_THEME_VERSION = 2;

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

// Hero sub-blocks managed in the Sections tab (the content containers moved to
// the Layout tab in V3A). These toggle visibility inside the profile header.
export const HERO_SUBBLOCK_SECTION_IDS = ["stats", "bio", "joined_date"];

// ── Layout (Profile Builder V3A — Layout Composer) ───────────────────────────
// Mirrors the server whitelist in server/utils/profileThemeValidation.js. The
// layout controls ORDER, WIDTH, container STYLE and VARIANT of content blocks.
export const ALLOWED_LAYOUT_MODES = ["stack"];

export const ALLOWED_LAYOUT_BLOCK_TYPES = [
    "guestbook",
    "writings",
    "media",
    "opinions",
    "stories",
    "pinned_writings",
    "bio",
    "stats",
    "joined_date",
];

export const ALLOWED_LAYOUT_WIDTHS = ["full", "half", "compact"];

export const ALLOWED_LAYOUT_STYLES = ["inherit", "glass", "paper", "minimal", "framed"];

export const ALLOWED_LAYOUT_VARIANTS_BY_TYPE = {
    guestbook: ["compact", "wall"],
    writings: ["editorial", "list", "compact"],
    media: ["grid", "collage", "strip"],
    opinions: ["cards", "compact", "debate"],
    stories: ["shelf", "covers", "compact"],
    pinned_writings: ["featured", "compact"],
    bio: ["card", "plain"],
    stats: ["row", "chips"],
    joined_date: ["plain", "stamp"],
};

export const MAX_LAYOUT_BLOCKS = 12;
export const MAX_LAYOUT_TITLE_LENGTH = 32;

// Content blocks shown by default, in order. Guestbook stays near the top.
// bio/stats/joined_date are valid types but live in the hero by default.
export const DEFAULT_LAYOUT_BLOCK_TYPES = [
    "guestbook",
    "writings",
    "media",
    "opinions",
    "stories",
    "pinned_writings",
];

export const DEFAULT_LAYOUT_TITLE_BY_TYPE = {
    guestbook: "Guestbook",
    writings: "Writings",
    media: "Media",
    opinions: "Opinions",
    stories: "Stories",
    pinned_writings: "Pinned",
    bio: "About",
    stats: "Stats",
    joined_date: "Joined",
};

export const DEFAULT_LAYOUT_WIDTH_BY_TYPE = {
    guestbook: "full",
    writings: "full",
    media: "full",
    opinions: "full",
    stories: "full",
    pinned_writings: "full",
    bio: "full",
    stats: "full",
    joined_date: "compact",
};

// Builder UI metadata for each layout block: label + which blocks are
// reorderable in the Layout panel (hero sub-blocks bio/stats/joined_date are
// managed in the Sections panel for V3A, so they are not listed here).
export const LAYOUT_BLOCK_LABELS = {
    guestbook: "Guestbook",
    writings: "Writings",
    media: "Media",
    opinions: "Opinions",
    stories: "Stories",
    pinned_writings: "Pinned writings",
    bio: "Bio",
    stats: "Stats",
    joined_date: "Joined date",
};

// Human labels for the per-block option pickers.
export const LAYOUT_WIDTH_LABELS = { full: "Full", half: "Half", compact: "Compact" };
export const LAYOUT_STYLE_LABELS = {
    inherit: "Theme",
    glass: "Glass",
    paper: "Paper",
    minimal: "Minimal",
    framed: "Framed",
};
