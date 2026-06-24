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

// Shared color-swatch palette for the builder's quick-pick color pickers (hero
// element text/background colors, etc.). `value: null` = follow the theme accent.
// (Formerly STICKER_COLORS — relocated here when stickers were deprecated in V5.)
export const SWATCH_COLORS = [
    { value: null, label: "Theme accent" },
    { value: "#ffffff", label: "White" },
    { value: "#1a1a1a", label: "Black" },
    { value: "#d4a853", label: "Gold" },
    { value: "#e0556e", label: "Rose" },
    { value: "#5a8dee", label: "Blue" },
    { value: "#3fb27f", label: "Green" },
    { value: "#a06cd5", label: "Purple" },
];

// ── Fonts ──────────────────────────────────────────────────────────────────
// All families are already loaded globally via client/src/index.css.
export const PROFILE_FONTS = [
    { key: "outfit", label: "Outfit", stack: "'Outfit', sans-serif" },
    { key: "lexend", label: "Lexend", stack: "'Lexend Deca', sans-serif" },
    { key: "spaceGrotesk", label: "Space Grotesk", stack: "'Space Grotesk', sans-serif" },
    { key: "lora", label: "Lora", stack: "'Lora', serif" },
    { key: "spectral", label: "Spectral", stack: "'Spectral', serif" },
    { key: "garamond", label: "EB Garamond", stack: "'EB Garamond', serif" },
    { key: "playfair", label: "Playfair", stack: "'Playfair Display', serif" },
    { key: "dmSerif", label: "DM Serif", stack: "'DM Serif Display', serif" },
    { key: "fraunces", label: "Fraunces", stack: "'Fraunces', serif" },
    { key: "comfortaa", label: "Comfortaa", stack: "'Comfortaa', cursive" },
    { key: "caveat", label: "Caveat", stack: "'Caveat', cursive" },
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

// ── Container design controls (Profile Builder V5 — Container Design Studio) ──
// Mirrors the server whitelist in server/utils/profileThemeValidation.js. These
// control a container's CHROME only (surface / tone / radius / shadow / border /
// padding / header / title align / accent). Every value is a hardcoded enum that
// maps to a fixed CSS class / data-attribute — no raw CSS, no custom colors.
export const ALLOWED_DESIGN_SURFACES = ["paper", "glass", "solid", "minimal", "framed"];
export const ALLOWED_DESIGN_TONES = ["default", "warm", "cool", "ink", "rose", "forest", "ocean"];
export const ALLOWED_DESIGN_RADII = ["soft", "round", "sharp"];
export const ALLOWED_DESIGN_SHADOWS = ["none", "soft", "lifted"];
export const ALLOWED_DESIGN_BORDERS = ["none", "hairline", "accent"];
export const ALLOWED_DESIGN_PADDINGS = ["compact", "comfortable", "spacious"];
export const ALLOWED_DESIGN_HEADERS = ["plain", "label", "banner", "tab"];
export const ALLOWED_DESIGN_TITLE_ALIGNS = ["left", "center"];
export const ALLOWED_DESIGN_ACCENTS = ["theme", "amber", "blue", "green", "rose"];

// Safe defaults — reproduce the pre-V5 default container look.
export const DEFAULT_BLOCK_DESIGN = {
    surface: "glass",
    tone: "default",
    radius: "round",
    shadow: "soft",
    border: "hairline",
    padding: "comfortable",
    header: "label",
    titleAlign: "left",
    accent: "theme",
};

export const DESIGN_SURFACE_LABELS = { paper: "Paper", glass: "Glass", solid: "Solid", minimal: "Minimal", framed: "Framed" };
export const DESIGN_TONE_LABELS = { default: "Default", warm: "Warm", cool: "Cool", ink: "Ink", rose: "Rose", forest: "Forest", ocean: "Ocean" };
export const DESIGN_RADIUS_LABELS = { soft: "Soft", round: "Round", sharp: "Sharp" };
export const DESIGN_SHADOW_LABELS = { none: "None", soft: "Soft", lifted: "Lifted" };
export const DESIGN_BORDER_LABELS = { none: "None", hairline: "Hairline", accent: "Accent" };
export const DESIGN_PADDING_LABELS = { compact: "Compact", comfortable: "Comfortable", spacious: "Spacious" };
export const DESIGN_HEADER_LABELS = { plain: "Plain", label: "Label", banner: "Banner", tab: "Tab" };
export const DESIGN_TITLE_ALIGN_LABELS = { left: "Left", center: "Center" };
export const DESIGN_ACCENT_LABELS = { theme: "Theme", amber: "Amber", blue: "Blue", green: "Green", rose: "Rose" };

// Ordered descriptor the Design disclosure renders its segmented controls from.
export const DESIGN_CONTROLS = [
    { key: "surface", label: "Surface", options: ALLOWED_DESIGN_SURFACES, labels: DESIGN_SURFACE_LABELS },
    { key: "tone", label: "Tone", options: ALLOWED_DESIGN_TONES, labels: DESIGN_TONE_LABELS },
    { key: "radius", label: "Corners", options: ALLOWED_DESIGN_RADII, labels: DESIGN_RADIUS_LABELS },
    { key: "shadow", label: "Shadow", options: ALLOWED_DESIGN_SHADOWS, labels: DESIGN_SHADOW_LABELS },
    { key: "border", label: "Border", options: ALLOWED_DESIGN_BORDERS, labels: DESIGN_BORDER_LABELS },
    { key: "padding", label: "Padding", options: ALLOWED_DESIGN_PADDINGS, labels: DESIGN_PADDING_LABELS },
    { key: "header", label: "Header", options: ALLOWED_DESIGN_HEADERS, labels: DESIGN_HEADER_LABELS },
    { key: "titleAlign", label: "Title align", options: ALLOWED_DESIGN_TITLE_ALIGNS, labels: DESIGN_TITLE_ALIGN_LABELS },
    { key: "accent", label: "Accent", options: ALLOWED_DESIGN_ACCENTS, labels: DESIGN_ACCENT_LABELS },
];

// ════════════════════════════════════════════════════════════════════════════
// V5.1 Design Studio — deeper per-container creative controls.
// Everything stays whitelisted/validated/clamped (no raw CSS). Mirrors the server
// whitelist in server/utils/profileThemeValidation.js. All these design fields are
// OPTIONAL — stored only when the user sets them, so a default block stays minimal.
// ════════════════════════════════════════════════════════════════════════════

// ── Fill (Canva-style fill panel) ──
export const ALLOWED_FILL_TYPES = ["surface", "solid", "gradient", "pattern"];
// "surface" = no fill override (use the Surface tool's card style). Labelled "None"
// so it isn't confused with the dedicated Surface tool (paper / glass / …).
export const FILL_TYPE_LABELS = { surface: "None", solid: "Solid", gradient: "Gradient", pattern: "Pattern" };

export const ALLOWED_PATTERNS = ["dots", "grid", "lines", "diagonal", "crosshatch", "paper"];
export const PATTERN_LABELS = { dots: "Dots", grid: "Grid", lines: "Lines", diagonal: "Diagonal", crosshatch: "Cross-hatch", paper: "Paper" };

export const ALLOWED_PATTERN_SCALES = ["s", "m", "l"];
export const PATTERN_SCALE_LABELS = { s: "Small", m: "Medium", l: "Large" };
export const PATTERN_SCALE_PX = { s: 10, m: 18, l: 28 };

// ── Border / frame ──
export const ALLOWED_BORDER_STYLES = ["solid", "dashed", "dotted", "double"];
export const BORDER_STYLE_LABELS = { solid: "Solid", dashed: "Dashed", dotted: "Dotted", double: "Double" };

// ── Title typography ──
export const ALLOWED_TITLE_SIZES = ["sm", "md", "lg", "xl"];
export const TITLE_SIZE_LABELS = { sm: "S", md: "M", lg: "L", xl: "XL" };
export const TITLE_SIZE_MULT = { sm: 0.9, md: 1.1, lg: 1.4, xl: 1.75 };

export const ALLOWED_TITLE_WEIGHTS = ["normal", "medium", "bold", "black"];
export const TITLE_WEIGHT_LABELS = { normal: "Regular", medium: "Medium", bold: "Bold", black: "Black" };
export const TITLE_WEIGHT_VAL = { normal: "400", medium: "500", bold: "700", black: "900" };

export const ALLOWED_TITLE_SPACINGS = ["tight", "normal", "wide"];
export const TITLE_SPACING_LABELS = { tight: "Tight", normal: "Normal", wide: "Wide" };
export const TITLE_SPACING_EM = { tight: "-0.01em", normal: "0", wide: "0.14em" };

export const ALLOWED_TITLE_CASES = ["none", "upper"];
export const TITLE_CASE_LABELS = { none: "Aa", upper: "AB" };

// ── Effects ──
export const ALLOWED_HOVER_FX = ["none", "lift", "glow"];
export const HOVER_FX_LABELS = { none: "None", lift: "Lift", glow: "Glow" };

// Numeric ranges {min,max,def,step} — drive the sliders AND the clamp on save.
export const DESIGN_RANGES = {
    gradAngle: { min: 0, max: 360, def: 135, step: 5 },
    fillOpacity: { min: 0.1, max: 1, def: 1, step: 0.05 },
    blur: { min: 0, max: 30, def: 18, step: 1 },
    patternOpacity: { min: 0.05, max: 1, def: 0.4, step: 0.05 },
    radiusPx: { min: 0, max: 40, def: 18, step: 1 },
    borderWidth: { min: 0, max: 8, def: 1, step: 1 },
    paddingPx: { min: 4, max: 48, def: 18, step: 1 },
    shadowStrength: { min: 0, max: 1, def: 0.4, step: 0.05 },
    tilt: { min: -6, max: 6, def: 0, step: 1 },
    opacity: { min: 0.3, max: 1, def: 1, step: 0.05 },
};
