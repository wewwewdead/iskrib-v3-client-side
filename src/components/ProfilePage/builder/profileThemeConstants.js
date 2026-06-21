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

// ── Page background (Profile Builder — gradient background) ───────────────────
// Mirrors the server whitelist in server/utils/profileThemeValidation.js. A
// `gradient` background paints the whole profile column; its opacity is tunable
// so the user can dial in good contrast against their text/cards.
export const ALLOWED_BACKGROUND_TYPES = ["none", "gradient"];

export const DEFAULT_BACKGROUND = {
    type: "none",
    angle: 135,
    from: "#7c3aed",
    to: "#2563eb",
    opacity: 1,
};

export const BACKGROUND_TYPE_LABELS = { none: "None", gradient: "Gradient" };

// Quick direction presets for the gradient angle picker (degrees → arrow label).
export const BACKGROUND_ANGLE_OPTIONS = [
    { key: 180, label: "↓" },
    { key: 135, label: "↘" },
    { key: 90, label: "→" },
    { key: 45, label: "↗" },
];

// ── Hero (free-canvas layout) ────────────────────────────────────────────────
// Mirrors the server whitelist. Only "stack" now — the hero is a fixed vertical
// stack whose elements can be drag-REORDERED (free-canvas drag was removed).
export const ALLOWED_HERO_MODES = ["stack"];
export const HERO_ELEMENT_KEYS = ["avatar", "name", "stats", "bio"];
// Default top-to-bottom order of the hero elements in the stack.
export const DEFAULT_HERO_ORDER = ["avatar", "name", "stats", "bio"];
export const HERO_ELEMENT_LABELS = {
    avatar: "Avatar",
    name: "Name",
    stats: "Stats",
    bio: "Bio",
};
export const HERO_HEIGHT_MIN = 160;
export const HERO_HEIGHT_MAX = 520;
export const DEFAULT_HERO_HEIGHT = 260;

// Per-element (isolated) styling for a free-hero container.
export const HERO_ELEMENT_ALIGNS = ["left", "center", "right"];
export const HERO_ELEMENT_STYLES = ["none", "glass", "paper", "minimal", "framed"];
export const HERO_ELEMENT_STYLE_LABELS = {
    none: "None",
    glass: "Glass",
    paper: "Paper",
    minimal: "Minimal",
    framed: "Framed",
};
export const HERO_ELEMENT_ALIGN_LABELS = { left: "Left", center: "Center", right: "Right" };

// Per-element container width (resize), border, corner radius and a break-line
// divider below the element. All whitelisted enums — no raw CSS.
export const HERO_ELEMENT_WIDTHS = ["full", "wide", "narrow"];
export const HERO_ELEMENT_WIDTH_LABELS = { full: "Full", wide: "Wide", narrow: "Narrow" };
export const HERO_ELEMENT_BORDERS = ["none", "hairline", "solid", "thick", "dashed"];
export const HERO_ELEMENT_BORDER_LABELS = {
    none: "None",
    hairline: "Hairline",
    solid: "Solid",
    thick: "Thick",
    dashed: "Dashed",
};
export const HERO_ELEMENT_RADII = ["sharp", "soft", "round"];
export const HERO_ELEMENT_RADIUS_LABELS = { sharp: "Sharp", soft: "Soft", round: "Round" };
export const HERO_ELEMENT_DIVIDERS = ["none", "line", "dashed", "dotted"];
export const HERO_ELEMENT_DIVIDER_LABELS = {
    none: "None",
    line: "Line",
    dashed: "Dashed",
    dotted: "Dotted",
};

// Per-element style defaults (no positioning — the stack lays them out).
export const DEFAULT_HERO_LAYOUT = {
    avatar: {},
    name: {},
    stats: {},
    bio: {},
};

export const DEFAULT_HERO = {
    mode: "stack",
    order: DEFAULT_HERO_ORDER,
    layout: DEFAULT_HERO_LAYOUT,
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

// ── Container content controls (Profile Builder V3C) ─────────────────────────
// Mirrors the server whitelist in server/utils/profileThemeValidation.js. These
// control PRESENTATION only (count / source / density / image shape / meta /
// excerpt). The server is the source of truth and re-clamps everything.
export const ALLOWED_BLOCK_CONTENT_BY_TYPE = {
    writings: {
        count: [1, 2, 3],
        source: ["latest", "pinned_first"],
        density: ["comfortable", "compact"],
        imageShape: ["rounded", "square", "soft"],
        booleans: ["showMeta", "showExcerpt"],
    },
    pinned_writings: {
        count: [1, 2, 3],
        density: ["comfortable", "compact"],
        imageShape: ["rounded", "square", "soft"],
        booleans: ["showMeta", "showExcerpt"],
    },
    media: {
        count: [4, 6],
        source: ["latest"],
        density: ["comfortable", "compact"],
        imageShape: ["rounded", "square", "soft"],
        booleans: ["showMeta"],
    },
    opinions: {
        count: [2, 3],
        source: ["latest", "most_discussed"],
        density: ["comfortable", "compact"],
        booleans: ["showMeta", "showExcerpt"],
    },
    stories: {
        count: [3, 4],
        source: ["latest", "popular"],
        density: ["comfortable", "compact"],
        imageShape: ["rounded", "square", "soft"],
        booleans: ["showMeta", "showExcerpt"],
    },
    guestbook: {
        count: [3, 5],
        source: ["latest"],
        density: ["compact", "comfortable"],
        booleans: ["showMeta"],
    },
};

export const DEFAULT_BLOCK_CONTENT = {
    writings: { count: 3, source: "latest", density: "comfortable", imageShape: "rounded", showMeta: true, showExcerpt: true },
    pinned_writings: { count: 3, density: "comfortable", imageShape: "rounded", showMeta: true, showExcerpt: true },
    media: { count: 6, source: "latest", density: "comfortable", imageShape: "rounded", showMeta: false },
    opinions: { count: 3, source: "latest", density: "comfortable", showMeta: true, showExcerpt: true },
    stories: { count: 4, source: "latest", density: "comfortable", imageShape: "rounded", showMeta: true, showExcerpt: true },
    guestbook: { count: 3, source: "latest", density: "compact", showMeta: true },
};

// Human labels for the content-control pickers.
export const CONTENT_SOURCE_LABELS = {
    latest: "Latest",
    pinned_first: "Pinned first",
    most_discussed: "Most discussed",
    popular: "Popular",
};
export const CONTENT_DENSITY_LABELS = { comfortable: "Comfortable", compact: "Compact" };
export const CONTENT_IMAGE_SHAPE_LABELS = { rounded: "Rounded", square: "Square", soft: "Soft" };
export const CONTENT_BOOLEAN_LABELS = { showMeta: "Show meta", showExcerpt: "Show excerpt" };
