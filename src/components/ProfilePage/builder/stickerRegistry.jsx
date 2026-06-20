/**
 * Hardcoded decorative sticker registry for Profile Builder V1.
 *
 * Stickers are NEVER user-uploaded HTML/SVG. Each entry is a fixed, local SVG
 * keyed by an id that the server whitelists. `currentColor` lets stickers pick
 * up the theme accent via CSS.
 */

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

const Heart = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M12 21s-7.5-4.7-10-9.3C.4 8.5 1.9 4.6 5.6 4.1c2-.3 3.6.8 4.4 2.1.8-1.3 2.4-2.4 4.4-2.1 3.7.5 5.2 4.4 3.6 7.6C19.5 16.3 12 21 12 21z" />
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

const Flower = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <circle cx="12" cy="5" r="3" />
        <circle cx="12" cy="19" r="3" />
        <circle cx="5" cy="12" r="3" />
        <circle cx="19" cy="12" r="3" />
        <circle cx="12" cy="12" r="3" opacity="0.6" />
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

const Quote = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M7 7h4v6a4 4 0 01-4 4v-2a2 2 0 002-2H7V7zm8 0h4v6a4 4 0 01-4 4v-2a2 2 0 002-2h-2V7z" />
    </svg>
);

const Leaf = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14z" />
        <path d="M5 19c3-5 7-8 11-9" stroke="currentColor" strokeWidth="1.4" fill="none" />
    </svg>
);

const Music = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M9 18V6l10-2v12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
        <circle cx="7" cy="18" r="2.4" />
        <circle cx="17" cy="16" r="2.4" />
    </svg>
);

const Coffee = (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
        <path d="M4 9h13v5a4 4 0 01-4 4H8a4 4 0 01-4-4V9z" />
        <path d="M17 10h2.5a2.5 2.5 0 010 5H17" stroke="currentColor" strokeWidth="1.6" fill="none" />
    </svg>
);

export const STICKER_REGISTRY = [
    { id: "sparkle-01", label: "Sparkle", Glyph: Sparkle },
    { id: "star-01", label: "Star", Glyph: Star },
    { id: "heart-01", label: "Heart", Glyph: Heart },
    { id: "moon-01", label: "Moon", Glyph: Moon },
    { id: "sun-01", label: "Sun", Glyph: Sun },
    { id: "flower-01", label: "Flower", Glyph: Flower },
    { id: "bolt-01", label: "Bolt", Glyph: Bolt },
    { id: "cloud-01", label: "Cloud", Glyph: Cloud },
    { id: "quote-01", label: "Quote", Glyph: Quote },
    { id: "leaf-01", label: "Leaf", Glyph: Leaf },
    { id: "music-01", label: "Music", Glyph: Music },
    { id: "coffee-01", label: "Coffee", Glyph: Coffee },
];

export const STICKER_BY_ID = STICKER_REGISTRY.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
}, {});

export const ALLOWED_STICKER_IDS = STICKER_REGISTRY.map((s) => s.id);
