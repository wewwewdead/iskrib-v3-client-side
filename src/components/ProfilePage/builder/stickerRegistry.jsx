/**
 * Hardcoded decorative sticker registry for Profile Builder.
 *
 * Stickers are NEVER user-uploaded HTML/SVG. Each entry is a fixed, local SVG
 * keyed by an id that the server whitelists. `currentColor` lets stickers pick
 * up the theme accent (or a per-sticker color) via CSS.
 *
 * Curated for a social-journaling app: writing tools, celestial, nature,
 * expressive, and decorative glyphs. Keep ids in sync with the server list in
 * server/utils/profileThemeValidation.js (ALLOWED_STICKER_IDS).
 */

/* ── Celestial / sparkle ─────────────────────────────────────────────────── */
const Sparkle = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2l1.8 5.6L19.5 9l-5.7 1.4L12 16l-1.8-5.6L4.5 9l5.7-1.4L12 2z" />
        <path d="M19 14l.9 2.6L22.5 18l-2.6.6L19 21l-.9-2.4L15.5 18l2.6-1.4L19 14z" opacity="0.7" />
    </svg>
);

const Star = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 17.3 5.8 20.9l1.6-6.8L2.2 8.9l6.9-.6L12 2z" />
    </svg>
);

const Moon = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M21 12.8A8.5 8.5 0 1111.2 3a6.5 6.5 0 009.8 9.8z" />
    </svg>
);

const Sun = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <circle cx="12" cy="12" r="4.5" />
        <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
        </g>
    </svg>
);

const Comet = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <circle cx="17" cy="7" r="3.6" />
        <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
            <path d="M13.5 10.5L4 20M15 13l-6 6M11.5 9L6.5 14" />
        </g>
    </svg>
);

const Planet = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <circle cx="12" cy="12" r="5.2" />
        <ellipse cx="12" cy="12" rx="10" ry="3.4" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(-20 12 12)" />
    </svg>
);

const Rainbow = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
        <path d="M3 18a9 9 0 0118 0" />
        <path d="M6.5 18a5.5 5.5 0 0111 0" opacity="0.7" />
        <path d="M10 18a2 2 0 014 0" opacity="0.45" />
    </svg>
);

const Snowflake = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...props}>
        <path d="M12 2v20M3.34 7l17.32 10M20.66 7L3.34 17" />
        <path d="M12 6l-2-1.4M12 6l2-1.4M12 18l-2 1.4M12 18l2 1.4M6.2 9l-2.3.2M6.2 9l-.3-2.3M17.8 15l2.3-.2M17.8 15l.3 2.3M6.2 15l-.3 2.3M6.2 15l-2.3-.2M17.8 9l.3-2.3M17.8 9l2.3.2" />
    </svg>
);

const Bolt = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
);

const Cloud = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M7 18a4 4 0 010-8 5 5 0 019.6-1.4A3.5 3.5 0 0117 18H7z" />
    </svg>
);

/* ── Writing / journaling ────────────────────────────────────────────────── */
const Pen = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
);

const Quill = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20.5 3.5C12 3.5 6 8.5 6 16.5l-2.7 2.7a1 1 0 101.4 1.4L7.5 18c8 0 13-6 13-14.5z" />
    </svg>
);

const Ink = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2.5s6.5 6.8 6.5 11A6.5 6.5 0 015.5 13.5c0-4.2 6.5-11 6.5-11z" />
    </svg>
);

const Book = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M11 6C9.3 4.8 6.7 4.3 4 4.6a1 1 0 00-.9 1v11.8c0 .6.5 1 1.1.9 2.3-.3 4.4.1 5.8 1.1V6z" />
        <path d="M13 6c1.7-1.2 4.3-1.7 7-1.4a1 1 0 01.9 1v11.8c0 .6-.5 1-1.1.9-2.3-.3-4.4.1-5.8 1.1V6z" opacity="0.65" />
    </svg>
);

const Bookmark = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M7 3h10a1 1 0 011 1v17l-6-3.8L6 21V4a1 1 0 011-1z" />
    </svg>
);

const Page = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M14 2H7a2 2 0 00-2 2v16a2 2 0 002 2h10a2 2 0 002-2V7l-5-5z" />
        <path d="M14 2v5h5z" opacity="0.5" />
    </svg>
);

const Quote = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M7 7h4v6a4 4 0 01-4 4v-2a2 2 0 002-2H7V7zm8 0h4v6a4 4 0 01-4 4v-2a2 2 0 002-2h-2V7z" />
    </svg>
);

const Music = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="7" cy="18" r="2.4" />
        <circle cx="17" cy="16" r="2.4" />
    </svg>
);

/* ── Nature ──────────────────────────────────────────────────────────────── */
const Flower = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <circle cx="12" cy="5" r="3" />
        <circle cx="12" cy="19" r="3" />
        <circle cx="5" cy="12" r="3" />
        <circle cx="19" cy="12" r="3" />
        <circle cx="12" cy="12" r="3" opacity="0.6" />
    </svg>
);

const Leaf = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" />
        <path d="M5 19c3-5 7-8 11-9" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
);

const Sprout = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 21v-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 14C12 9.6 8.4 6 4 6c0 4.4 3.6 8 8 8z" />
        <path d="M12 12c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6z" opacity="0.7" />
    </svg>
);

const Mushroom = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3 11a9 7 0 0118 0 1 1 0 01-1 1H4a1 1 0 01-1-1z" />
        <path d="M9.5 12h5v5a2.5 2.5 0 01-5 0v-5z" />
    </svg>
);

const Fire = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 2c-1 3.5-3.5 5.3-3.5 8.5C8.5 8 10 7 10 7c-2.5 2-4 4.3-4 7a6 6 0 0012 0c0-2.5-1.3-4.8-3-6.5.2 1.5-.5 2.5-1.3 3C14.3 7 13 4.5 12 2z" />
    </svg>
);

/* ── Expressive / social ─────────────────────────────────────────────────── */
const Heart = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
);

const Smiley = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M8.5 14a4.5 4.5 0 007 0" strokeLinecap="round" />
        <circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none" />
        <circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none" />
    </svg>
);

const Chat = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M20 2H4a2 2 0 00-2 2v12a2 2 0 002 2h3v4l5-4h8a2 2 0 002-2V4a2 2 0 00-2-2z" />
    </svg>
);

const Eye = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
        <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7z" />
        <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    </svg>
);

const Peace = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M12 2.5v19M12 12l-6.7 6.7M12 12l6.7 6.7" />
    </svg>
);

/* ── Decorative / achievement / misc ─────────────────────────────────────── */
const Coffee = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4 9h13v5a4 4 0 01-4 4H8a4 4 0 01-4-4V9z" />
        <path d="M17 10h2.5a2.5 2.5 0 010 5H17" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
);

const Crown = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M3 8l4.5 3.5L12 4l4.5 7.5L21 8l-2 11H5L3 8z" />
    </svg>
);

const Gem = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
    </svg>
);

const Idea = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M9 18h6v1.5a1 1 0 01-1 1h-4a1 1 0 01-1-1V18z" />
        <path d="M12 2a7 7 0 00-4.2 12.6c.5.4.9 1 .9 1.7v.2h6.6v-.2c0-.7.4-1.3.9-1.7A7 7 0 0012 2z" />
    </svg>
);

const Compass = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M15.8 8.2l-2 5.6-5.6 2 2-5.6 5.6-2z" fill="currentColor" stroke="none" />
    </svg>
);

const Globe = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
        <circle cx="12" cy="12" r="9.5" />
        <path d="M2.5 12h19M12 2.5a14 14 0 010 19M12 2.5a14 14 0 000 19" />
    </svg>
);

const Anchor = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="12" cy="4.5" r="2" />
        <path d="M12 6.5v14M8.5 10h7M4.5 14a7.5 7.5 0 0015 0M4.5 14H2.8M19.5 14h1.7" />
    </svg>
);

const Camera = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...props}>
        <rect x="2.5" y="7" width="19" height="13" rx="2.5" />
        <path d="M8 7l1.5-2.5h5L16 7" strokeLinejoin="round" />
        <circle cx="12" cy="13.5" r="3.3" />
    </svg>
);

const Key = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="8" cy="8" r="4.2" />
        <path d="M11 11l8.5 8.5M16.5 16.5l2-2M19 19l1.8-1.8" />
    </svg>
);

export const STICKER_REGISTRY = [
    // Writing & journaling
    { id: "pen-01", label: "Pen", Glyph: Pen },
    { id: "quill-01", label: "Quill", Glyph: Quill },
    { id: "ink-01", label: "Ink", Glyph: Ink },
    { id: "book-01", label: "Book", Glyph: Book },
    { id: "bookmark-01", label: "Bookmark", Glyph: Bookmark },
    { id: "page-01", label: "Page", Glyph: Page },
    { id: "quote-01", label: "Quote", Glyph: Quote },
    { id: "music-01", label: "Music", Glyph: Music },
    // Celestial
    { id: "sparkle-01", label: "Sparkle", Glyph: Sparkle },
    { id: "star-01", label: "Star", Glyph: Star },
    { id: "moon-01", label: "Moon", Glyph: Moon },
    { id: "sun-01", label: "Sun", Glyph: Sun },
    { id: "comet-01", label: "Comet", Glyph: Comet },
    { id: "planet-01", label: "Planet", Glyph: Planet },
    { id: "rainbow-01", label: "Rainbow", Glyph: Rainbow },
    { id: "snow-01", label: "Snowflake", Glyph: Snowflake },
    { id: "bolt-01", label: "Bolt", Glyph: Bolt },
    { id: "cloud-01", label: "Cloud", Glyph: Cloud },
    // Nature
    { id: "flower-01", label: "Flower", Glyph: Flower },
    { id: "leaf-01", label: "Leaf", Glyph: Leaf },
    { id: "sprout-01", label: "Sprout", Glyph: Sprout },
    { id: "mushroom-01", label: "Mushroom", Glyph: Mushroom },
    { id: "fire-01", label: "Flame", Glyph: Fire },
    // Expressive & social
    { id: "heart-01", label: "Heart", Glyph: Heart },
    { id: "smiley-01", label: "Smiley", Glyph: Smiley },
    { id: "chat-01", label: "Chat", Glyph: Chat },
    { id: "eye-01", label: "Eye", Glyph: Eye },
    { id: "peace-01", label: "Peace", Glyph: Peace },
    // Decorative & misc
    { id: "coffee-01", label: "Coffee", Glyph: Coffee },
    { id: "crown-01", label: "Crown", Glyph: Crown },
    { id: "gem-01", label: "Gem", Glyph: Gem },
    { id: "idea-01", label: "Lightbulb", Glyph: Idea },
    { id: "compass-01", label: "Compass", Glyph: Compass },
    { id: "globe-01", label: "Globe", Glyph: Globe },
    { id: "anchor-01", label: "Anchor", Glyph: Anchor },
    { id: "camera-01", label: "Camera", Glyph: Camera },
    { id: "key-01", label: "Key", Glyph: Key },
];

export const STICKER_BY_ID = STICKER_REGISTRY.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
}, {});

export const ALLOWED_STICKER_IDS = STICKER_REGISTRY.map((s) => s.id);

// Quick-pick colors for stickers. `null` = follow the theme accent (default).
export const STICKER_COLORS = [
    { value: null, label: "Theme accent" },
    { value: "#ffffff", label: "White" },
    { value: "#1a1a1a", label: "Black" },
    { value: "#d4a853", label: "Gold" },
    { value: "#e0556e", label: "Rose" },
    { value: "#5a8dee", label: "Blue" },
    { value: "#3fb27f", label: "Green" },
    { value: "#a06cd5", label: "Purple" },
];

// Sticker resize bounds (mirrors the validation clamp).
export const STICKER_SCALE_MIN = 0.3;
export const STICKER_SCALE_MAX = 3;
