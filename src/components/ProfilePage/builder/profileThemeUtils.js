import {
    PROFILE_THEME_VERSION,
    MAX_STICKERS,
    FONT_STACK_BY_KEY,
    SCALE_MULTIPLIER_BY_KEY,
    RADIUS_VALUE_BY_KEY,
    BORDER_WIDTH_BY_KEY,
    SHADOW_VALUE_BY_KEY,
    CARD_BLUR_BY_STYLE,
    ALLOWED_SECTION_IDS,
    REQUIRED_SECTION_IDS,
    PROFILE_SECTIONS,
} from "./profileThemeConstants";
import { ALLOWED_STICKER_IDS } from "./stickerRegistry";
import { getDefaultProfileTheme } from "./profileThemeDefaults";

export { getDefaultProfileTheme };

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/;

export const isValidColor = (value) => {
    if (typeof value !== "string") return false;
    const v = value.trim();
    if (v.length === 0 || v.length > 32) return false;
    return HEX_COLOR_RE.test(v) || RGB_COLOR_RE.test(v);
};

const clamp = (value, min, max, fallback) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
};

const pickEnum = (value, allowedKeys, fallback) =>
    typeof value === "string" && allowedKeys.includes(value) ? value : fallback;

/**
 * Client-side mirror of the server normalization. Used to render any stored
 * theme safely, even if it is partial, legacy, or slightly malformed. It never
 * throws — it always returns a complete, renderable theme.
 */
export const normalizeProfileTheme = (rawTheme, userData) => {
    const base = getDefaultProfileTheme(userData);
    if (!rawTheme || typeof rawTheme !== "object" || Array.isArray(rawTheme)) {
        return base;
    }

    const colors = { ...base.colors };
    if (rawTheme.colors && typeof rawTheme.colors === "object") {
        for (const key of Object.keys(base.colors)) {
            if (isValidColor(rawTheme.colors[key])) {
                colors[key] = rawTheme.colors[key].trim();
            }
        }
    }

    const typography = rawTheme.typography || {};
    const cards = rawTheme.cards || {};

    // Sections: keep known ids, dedupe, fill missing, force required visible.
    const sectionById = new Map();
    if (Array.isArray(rawTheme.sections)) {
        rawTheme.sections.forEach((section, index) => {
            if (!section || typeof section !== "object") return;
            if (!ALLOWED_SECTION_IDS.includes(section.id)) return;
            if (sectionById.has(section.id)) return;
            sectionById.set(section.id, {
                id: section.id,
                visible: REQUIRED_SECTION_IDS.includes(section.id) ? true : section.visible !== false,
                order: clamp(section.order, 0, ALLOWED_SECTION_IDS.length * 4, index),
            });
        });
    }
    PROFILE_SECTIONS.forEach((section, index) => {
        if (!sectionById.has(section.id)) {
            sectionById.set(section.id, { id: section.id, visible: true, order: index });
        }
    });
    const sections = Array.from(sectionById.values()).sort((a, b) => a.order - b.order);

    // Stickers: keep known ids, clamp positions, cap count.
    const stickers = [];
    if (Array.isArray(rawTheme.stickers)) {
        for (const sticker of rawTheme.stickers) {
            if (stickers.length >= MAX_STICKERS) break;
            if (!sticker || typeof sticker !== "object") continue;
            if (!ALLOWED_STICKER_IDS.includes(sticker.id)) continue;
            stickers.push({
                id: sticker.id,
                x: clamp(sticker.x, 0, 100, 50),
                y: clamp(sticker.y, 0, 100, 50),
                rotation: clamp(sticker.rotation, -180, 180, 0),
                scale: clamp(sticker.scale, 0.3, 3, 1),
            });
        }
    }

    return {
        version: PROFILE_THEME_VERSION,
        presetId: typeof rawTheme.presetId === "string" ? rawTheme.presetId : "custom",
        colors,
        typography: {
            font: pickEnum(typography.font, Object.keys(FONT_STACK_BY_KEY), base.typography.font),
            scale: pickEnum(typography.scale, Object.keys(SCALE_MULTIPLIER_BY_KEY), base.typography.scale),
        },
        cards: {
            style: pickEnum(cards.style, Object.keys(CARD_BLUR_BY_STYLE), base.cards.style),
            radius: pickEnum(cards.radius, Object.keys(RADIUS_VALUE_BY_KEY), base.cards.radius),
            border: pickEnum(cards.border, Object.keys(BORDER_WIDTH_BY_KEY), base.cards.border),
            shadow: pickEnum(cards.shadow, Object.keys(SHADOW_VALUE_BY_KEY), base.cards.shadow),
        },
        sections,
        stickers,
    };
};

/**
 * Compute the card surface treatment (background / border / blur) for a card
 * style. Colors come from the theme so the user's accent/card choices apply.
 */
const cardSurface = (theme) => {
    const { style } = theme.cards;
    const cardBg = theme.colors.cardBackground;
    const cardBorder = theme.colors.cardBorder;

    switch (style) {
        case "solid":
            return { background: cardBg, border: cardBorder, blur: "blur(0px)" };
        case "paper":
            return { background: cardBg, border: cardBorder, blur: "blur(0px)" };
        case "minimal":
            return { background: "transparent", border: cardBorder, blur: "blur(0px)" };
        case "glass":
        default:
            return { background: cardBg, border: cardBorder, blur: CARD_BLUR_BY_STYLE.glass };
    }
};

/**
 * Convert a (normalized) theme into a CSS-variable style object that the
 * profile CSS consumes. No arbitrary CSS strings are produced — every value is
 * derived from validated colors and whitelisted enums.
 */
export const profileThemeToCssVars = (theme, userData) => {
    const safe = normalizeProfileTheme(theme, userData);
    const surface = cardSurface(safe);
    const borderWidth = safe.cards.border === "none" ? "0px" : BORDER_WIDTH_BY_KEY[safe.cards.border];

    return {
        color: safe.colors.text,
        "--pt-text": safe.colors.text,
        "--pt-accent": safe.colors.accent,
        "--pt-card-bg": surface.background,
        "--pt-card-border-color": surface.border,
        "--pt-card-border-width": borderWidth,
        "--pt-card-blur": surface.blur,
        "--pt-card-radius": RADIUS_VALUE_BY_KEY[safe.cards.radius],
        "--pt-card-shadow": SHADOW_VALUE_BY_KEY[safe.cards.shadow],
        "--pt-font": FONT_STACK_BY_KEY[safe.typography.font],
        "--pt-scale": String(SCALE_MULTIPLIER_BY_KEY[safe.typography.scale]),
    };
};

/**
 * Return the set of section ids that should be visible, in their configured
 * order. Required sections are always included.
 */
export const getVisibleOrderedSections = (theme) => {
    if (!theme || !Array.isArray(theme.sections)) {
        return PROFILE_SECTIONS.map((s) => s.id);
    }
    return theme.sections
        .filter((s) => s && ALLOWED_SECTION_IDS.includes(s.id))
        .filter((s) => s.visible !== false || REQUIRED_SECTION_IDS.includes(s.id))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((s) => s.id);
};

/**
 * Convenience: is a section visible in this theme? Required sections always are.
 */
export const isSectionVisible = (theme, sectionId) => {
    if (REQUIRED_SECTION_IDS.includes(sectionId)) return true;
    if (!theme || !Array.isArray(theme.sections)) return true;
    const section = theme.sections.find((s) => s.id === sectionId);
    if (!section) return true;
    return section.visible !== false;
};
