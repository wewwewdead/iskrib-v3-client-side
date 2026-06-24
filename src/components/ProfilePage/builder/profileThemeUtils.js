import {
    PROFILE_THEME_VERSION,
    FONT_STACK_BY_KEY,
    SCALE_MULTIPLIER_BY_KEY,
    RADIUS_VALUE_BY_KEY,
    BORDER_WIDTH_BY_KEY,
    SHADOW_VALUE_BY_KEY,
    CARD_BLUR_BY_STYLE,
    ALLOWED_SECTION_IDS,
    REQUIRED_SECTION_IDS,
    PROFILE_SECTIONS,
    ALLOWED_LAYOUT_MODES,
    ALLOWED_LAYOUT_BLOCK_TYPES,
    ALLOWED_LAYOUT_WIDTHS,
    ALLOWED_LAYOUT_STYLES,
    ALLOWED_LAYOUT_VARIANTS_BY_TYPE,
    MAX_LAYOUT_BLOCKS,
    MAX_LAYOUT_TITLE_LENGTH,
    DEFAULT_LAYOUT_BLOCK_TYPES,
    DEFAULT_LAYOUT_TITLE_BY_TYPE,
    DEFAULT_LAYOUT_WIDTH_BY_TYPE,
    ALLOWED_BLOCK_CONTENT_BY_TYPE,
    DEFAULT_BLOCK_CONTENT,
    ALLOWED_DESIGN_SURFACES,
    ALLOWED_DESIGN_TONES,
    ALLOWED_DESIGN_RADII,
    ALLOWED_DESIGN_SHADOWS,
    ALLOWED_DESIGN_BORDERS,
    ALLOWED_DESIGN_PADDINGS,
    ALLOWED_DESIGN_HEADERS,
    ALLOWED_DESIGN_TITLE_ALIGNS,
    ALLOWED_DESIGN_ACCENTS,
    DEFAULT_BLOCK_DESIGN,
    ALLOWED_FILL_TYPES,
    ALLOWED_PATTERNS,
    ALLOWED_PATTERN_SCALES,
    ALLOWED_BORDER_STYLES,
    ALLOWED_TITLE_SIZES,
    ALLOWED_TITLE_WEIGHTS,
    ALLOWED_TITLE_SPACINGS,
    ALLOWED_TITLE_CASES,
    ALLOWED_HOVER_FX,
    DESIGN_RANGES,
    PATTERN_SCALE_PX,
    TITLE_SIZE_MULT,
    TITLE_WEIGHT_VAL,
    TITLE_SPACING_EM,
    HERO_ELEMENT_KEYS,
    HERO_ELEMENT_ALIGNS,
    HERO_ELEMENT_STYLES,
    HERO_ELEMENT_WIDTHS,
    HERO_ELEMENT_BORDERS,
    HERO_ELEMENT_RADII,
    HERO_ELEMENT_DIVIDERS,
    DEFAULT_HERO_ORDER,
    ALLOWED_BACKGROUND_TYPES,
    DEFAULT_BACKGROUND,
} from "./profileThemeConstants";
import { getDefaultProfileTheme } from "./profileThemeDefaults";
import { getStaticBackgroundStyle } from "../background/backgroundUtils";

export { getDefaultProfileTheme };

const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
const RGB_COLOR_RE = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(?:,\s*(?:0|1|0?\.\d+)\s*)?\)$/;

export const isValidColor = (value) => {
    if (typeof value !== "string") return false;
    const v = value.trim();
    if (v.length === 0 || v.length > 32) return false;
    return HEX_COLOR_RE.test(v) || RGB_COLOR_RE.test(v);
};

// Strict 6-digit hex (#rrggbb) — the only form a native <input type="color">
// accepts, so the builder panels gate their color pickers on this (narrower than
// isValidColor, which also allows shorthand/alpha hex and rgb()/rgba()).
const HEX6_COLOR_RE = /^#[0-9a-fA-F]{6}$/;
export const isHexColor = (value) => typeof value === "string" && HEX6_COLOR_RE.test(value);

const clamp = (value, min, max, fallback) => {
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
};

const pickEnum = (value, allowedKeys, fallback) =>
    typeof value === "string" && allowedKeys.includes(value) ? value : fallback;

// Is a section id visible in a sections list? Seeds derived layout visibility.
const sectionVisibleInList = (sections, id) => {
    if (!Array.isArray(sections)) return true;
    const found = sections.find((s) => s && s.id === id);
    if (!found) return true;
    return found.visible !== false;
};

// Plain-text title: strip tags, collapse whitespace, clamp length, fall back.
const sanitizeBlockTitle = (value, fallback) => {
    if (typeof value !== "string") return fallback;
    const plain = value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
    if (!plain) return fallback;
    return plain.slice(0, MAX_LAYOUT_TITLE_LENGTH);
};

/**
 * Client mirror of the server `sanitizeBlockContent` (Profile Builder V3C).
 * Returns undefined for block types that carry no content controls. Rebuilds the
 * object from scratch: only whitelisted keys survive, count is clamped to the
 * allowed set, enums fall back to the per-type default, booleans coerce to the
 * default unless an explicit boolean is given. Never throws.
 */
export const normalizeBlockContent = (type, raw) => {
    const spec = ALLOWED_BLOCK_CONTENT_BY_TYPE[type];
    if (!spec) return undefined;
    const def = DEFAULT_BLOCK_CONTENT[type];
    const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const out = {};

    if (spec.count) {
        const n = typeof src.count === "number" ? src.count : Number(src.count);
        out.count = spec.count.includes(n) ? n : def.count;
    }
    if (spec.source) out.source = pickEnum(src.source, spec.source, def.source);
    if (spec.density) out.density = pickEnum(src.density, spec.density, def.density);
    if (spec.imageShape) out.imageShape = pickEnum(src.imageShape, spec.imageShape, def.imageShape);
    (spec.booleans || []).forEach((key) => {
        out[key] = typeof src[key] === "boolean" ? src[key] : def[key];
    });

    return out;
};

// Attach a sanitized `content` config to a block, but only for content blocks.
const withBlockContent = (block, rawContent) => {
    const content = normalizeBlockContent(block.type, rawContent);
    return content ? { ...block, content } : block;
};

// Client mirror of the server legacy→design derivation (keeps old themes looking
// the same when they gain a design object). Mirrors deriveDesignFromLegacy.
const LEGACY_SHADOW_TO_DESIGN = { none: "none", soft: "soft", strong: "lifted" };
const LEGACY_BORDER_TO_DESIGN = { none: "none", soft: "hairline", bold: "accent" };

const deriveDesignFromLegacy = (block) => {
    const card = block && typeof block.card === "object" ? block.card : null;
    const style = block && block.style;
    let surface = DEFAULT_BLOCK_DESIGN.surface;
    if (card && ALLOWED_DESIGN_SURFACES.includes(card.style)) surface = card.style;
    else if (typeof style === "string" && style !== "inherit" && ALLOWED_DESIGN_SURFACES.includes(style)) {
        surface = style;
    }
    return {
        surface,
        radius: card && ALLOWED_DESIGN_RADII.includes(card.radius) ? card.radius : DEFAULT_BLOCK_DESIGN.radius,
        shadow: (card && LEGACY_SHADOW_TO_DESIGN[card.shadow]) || DEFAULT_BLOCK_DESIGN.shadow,
        border: (card && LEGACY_BORDER_TO_DESIGN[card.border]) || DEFAULT_BLOCK_DESIGN.border,
    };
};

/**
 * Client mirror of the server `sanitizeBlockDesign` (Profile Builder V5). Rebuilds
 * the design object from scratch: every field is a whitelisted enum, unknown keys
 * are dropped. Missing surface/radius/shadow/border derive from the legacy
 * style/card so old themes keep their look; the rest fall back to safe defaults.
 * Never throws — always returns a complete design object.
 */
// Optional-field helpers (mirror server) — return undefined → key omitted.
const enumOpt = (raw, allowed) => (typeof raw === "string" && allowed.includes(raw) ? raw : undefined);
const colorOpt = (raw) => (isValidColor(raw) ? raw.trim() : undefined);
const numOpt = (raw, range) => {
    if (raw === undefined || raw === null || raw === "") return undefined;
    const n = Number(raw);
    if (!Number.isFinite(n)) return undefined;
    return Math.min(range.max, Math.max(range.min, n));
};

// Client mirror of the server `sanitizeDesignExtras` (V5.1 Design Studio).
const normalizeDesignExtras = (src) => {
    if (!src) return {};
    const out = {};
    const setNum = (k) => {
        const v = numOpt(src[k], DESIGN_RANGES[k]);
        if (v !== undefined) out[k] = v;
    };
    const setEnum = (k, allowed) => {
        const v = enumOpt(src[k], allowed);
        if (v !== undefined) out[k] = v;
    };
    const setColor = (k) => {
        const v = colorOpt(src[k]);
        if (v !== undefined) out[k] = v;
    };

    const fillType = enumOpt(src.fillType, ALLOWED_FILL_TYPES);
    if (fillType && fillType !== "surface") out.fillType = fillType;
    setColor("gradFrom");
    setColor("gradTo");
    setNum("gradAngle");
    setEnum("pattern", ALLOWED_PATTERNS);
    setColor("patternColor");
    setEnum("patternScale", ALLOWED_PATTERN_SCALES);
    setNum("patternOpacity");
    setNum("fillOpacity");
    setNum("blur");

    setNum("radiusPx");
    setNum("borderWidth");
    setEnum("borderStyle", ALLOWED_BORDER_STYLES);
    setColor("borderColor");
    setNum("shadowStrength");
    setColor("glow");
    setNum("paddingPx");

    setEnum("titleSize", ALLOWED_TITLE_SIZES);
    setEnum("titleWeight", ALLOWED_TITLE_WEIGHTS);
    setEnum("titleSpacing", ALLOWED_TITLE_SPACINGS);
    setEnum("titleCase", ALLOWED_TITLE_CASES);

    setNum("tilt");
    setEnum("hover", ALLOWED_HOVER_FX);
    setNum("opacity");

    return out;
};

export const normalizeBlockDesign = (raw, block) => {
    const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
    const legacy = deriveDesignFromLegacy(block || {});
    return {
        surface: pickEnum(src && src.surface, ALLOWED_DESIGN_SURFACES, legacy.surface),
        tone: pickEnum(src && src.tone, ALLOWED_DESIGN_TONES, DEFAULT_BLOCK_DESIGN.tone),
        radius: pickEnum(src && src.radius, ALLOWED_DESIGN_RADII, legacy.radius),
        shadow: pickEnum(src && src.shadow, ALLOWED_DESIGN_SHADOWS, legacy.shadow),
        border: pickEnum(src && src.border, ALLOWED_DESIGN_BORDERS, legacy.border),
        padding: pickEnum(src && src.padding, ALLOWED_DESIGN_PADDINGS, DEFAULT_BLOCK_DESIGN.padding),
        header: pickEnum(src && src.header, ALLOWED_DESIGN_HEADERS, DEFAULT_BLOCK_DESIGN.header),
        titleAlign: pickEnum(src && src.titleAlign, ALLOWED_DESIGN_TITLE_ALIGNS, DEFAULT_BLOCK_DESIGN.titleAlign),
        accent: pickEnum(src && src.accent, ALLOWED_DESIGN_ACCENTS, DEFAULT_BLOCK_DESIGN.accent),
        // Optional per-container overrides (only stored when set) — mirrors server.
        ...(src && isValidColor(src.textColor) ? { textColor: src.textColor.trim() } : {}),
        ...(src && isValidColor(src.bgColor) ? { bgColor: src.bgColor.trim() } : {}),
        ...(src && typeof src.font === "string" && Object.keys(FONT_STACK_BY_KEY).includes(src.font)
            ? { font: src.font }
            : {}),
        ...normalizeDesignExtras(src),
    };
};

// Build a CSS `background-image` for a whitelisted pattern from a (pre-alpha'd)
// color + a clamped tile size. Pure CSS gradients — no images, no user strings.
const patternBackgroundImage = (pattern, c, px) => {
    switch (pattern) {
        case "dots":
            return { backgroundImage: `radial-gradient(${c} 1.4px, transparent 1.5px)`, backgroundSize: `${px}px ${px}px` };
        case "grid":
            return {
                backgroundImage: `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`,
                backgroundSize: `${px}px ${px}px`,
            };
        case "lines":
            return { backgroundImage: `repeating-linear-gradient(0deg, ${c} 0, ${c} 1px, transparent 1px, transparent ${px}px)` };
        case "diagonal":
            return { backgroundImage: `repeating-linear-gradient(45deg, ${c} 0, ${c} 1px, transparent 1px, transparent ${px}px)` };
        case "crosshatch":
            return {
                backgroundImage: `repeating-linear-gradient(45deg, ${c} 0, ${c} 1px, transparent 1px, transparent ${px}px), repeating-linear-gradient(-45deg, ${c} 0, ${c} 1px, transparent 1px, transparent ${px}px)`,
            };
        case "paper":
            return {
                backgroundImage: `radial-gradient(${c} 0.6px, transparent 0.7px), radial-gradient(${c} 0.6px, transparent 0.7px)`,
                backgroundSize: `${px}px ${px}px`,
                backgroundPosition: `0 0, ${px / 2}px ${px / 2}px`,
            };
        default:
            return {};
    }
};

/**
 * Inline style for a block's optional per-container design overrides (V5.1 Design
 * Studio): text color + font, fill (solid / gradient / pattern + opacity + blur),
 * frame (radius / border / shadow + glow / padding), title typography vars, tilt
 * and container opacity. Returns ONLY the keys that are set, so it composes with
 * the surface CSS + card vars (an unset field falls through to the page/surface).
 * Every value is derived from validated colors + clamped numbers — no raw CSS.
 */
export const getBlockDesignStyle = (design) => {
    const d = design && typeof design === "object" ? design : {};
    const style = {};

    // Text color + font.
    if (isValidColor(d.textColor)) style.color = d.textColor.trim();
    const stack = typeof d.font === "string" ? FONT_STACK_BY_KEY[d.font] : null;
    if (stack) style["--pl-font"] = stack;

    // ── Fill ── (only fades the color to rgba when opacity is actually < 1)
    const fillOpacity = typeof d.fillOpacity === "number" ? d.fillOpacity : 1;
    const fc = (color) => (fillOpacity < 1 ? colorWithAlpha(color, fillOpacity) : color.trim());
    if (d.fillType === "gradient" && isValidColor(d.gradFrom) && isValidColor(d.gradTo)) {
        const angle = typeof d.gradAngle === "number" ? d.gradAngle : 135;
        style.backgroundImage = `linear-gradient(${angle}deg, ${fc(d.gradFrom)} 0%, ${fc(d.gradTo)} 100%)`;
        style.backgroundColor = "transparent";
    } else if (d.fillType === "pattern" && d.pattern) {
        const px = PATTERN_SCALE_PX[d.patternScale] || PATTERN_SCALE_PX.m;
        const pOpacity = typeof d.patternOpacity === "number" ? d.patternOpacity : 0.4;
        const pColor = colorWithAlpha(isValidColor(d.patternColor) ? d.patternColor : "rgba(0,0,0,1)", pOpacity);
        Object.assign(style, patternBackgroundImage(d.pattern, pColor, px));
        if (isValidColor(d.bgColor)) style.backgroundColor = fc(d.bgColor);
    } else if (isValidColor(d.bgColor)) {
        style.backgroundColor = fc(d.bgColor);
    }

    // Glass blur intensity.
    if (typeof d.blur === "number") {
        style.backdropFilter = `blur(${d.blur}px)`;
        style.WebkitBackdropFilter = `blur(${d.blur}px)`;
    }

    // ── Frame ──
    if (typeof d.radiusPx === "number") style.borderRadius = `${d.radiusPx}px`;
    if (typeof d.borderWidth === "number" || typeof d.borderStyle === "string" || isValidColor(d.borderColor)) {
        const w = typeof d.borderWidth === "number" ? d.borderWidth : 1;
        const bStyle = typeof d.borderStyle === "string" ? d.borderStyle : "solid";
        const bColor = isValidColor(d.borderColor) ? d.borderColor.trim() : "var(--pl-accent, var(--pt-accent, #d4a853))";
        style.border = w > 0 ? `${w}px ${bStyle} ${bColor}` : "none";
    }
    if (typeof d.shadowStrength === "number" || isValidColor(d.glow)) {
        const s = typeof d.shadowStrength === "number" ? d.shadowStrength : 0.4;
        if (isValidColor(d.glow)) {
            style.boxShadow = `0 0 ${Math.round(12 + s * 34)}px ${colorWithAlpha(d.glow, Math.min(1, 0.35 + s))}`;
        } else {
            style.boxShadow = `0 ${Math.round(2 + s * 16)}px ${Math.round(8 + s * 40)}px rgba(0,0,0,${(0.06 + s * 0.22).toFixed(3)}), 0 ${Math.round(1 + s * 4)}px ${Math.round(4 + s * 12)}px rgba(0,0,0,${(0.04 + s * 0.12).toFixed(3)})`;
        }
    }
    if (typeof d.paddingPx === "number") style.padding = `${d.paddingPx}px`;

    // ── Title typography (consumed by .pl-block-title via CSS vars) ──
    if (d.titleSize && TITLE_SIZE_MULT[d.titleSize]) style["--pl-title-size"] = String(TITLE_SIZE_MULT[d.titleSize]);
    if (d.titleWeight && TITLE_WEIGHT_VAL[d.titleWeight]) style["--pl-title-weight"] = TITLE_WEIGHT_VAL[d.titleWeight];
    if (d.titleSpacing && TITLE_SPACING_EM[d.titleSpacing]) style["--pl-title-spacing"] = TITLE_SPACING_EM[d.titleSpacing];

    // ── Effects (tilt via a var so :hover transforms compose; opacity inline) ──
    if (typeof d.tilt === "number" && d.tilt !== 0) style["--pl-tilt"] = `${d.tilt}deg`;
    if (typeof d.opacity === "number" && d.opacity < 1) style.opacity = d.opacity;

    return style;
};

// Attach a sanitized `design` object to every block (always present in V5).
const withBlockDesign = (block, rawDesign) => ({ ...block, design: normalizeBlockDesign(rawDesign, block) });

/**
 * Resolve a block's design config for rendering: a complete design object with
 * all fields filled (safe on old v2/v3 blocks that predate V5's `design` key).
 */
export const getBlockDesign = (block) => normalizeBlockDesign(block && block.design, block);

/**
 * Map a (normalized) design object to the `data-*` attributes the renderer puts
 * on a block element. Only whitelisted enum values reach the DOM — no raw CSS or
 * class names. The CSS in profileLayout.css targets these attributes.
 */
export const getBlockDesignDataAttrs = (design) => {
    const d = design && typeof design === "object" ? design : DEFAULT_BLOCK_DESIGN;
    return {
        "data-surface": pickEnum(d.surface, ALLOWED_DESIGN_SURFACES, DEFAULT_BLOCK_DESIGN.surface),
        "data-tone": pickEnum(d.tone, ALLOWED_DESIGN_TONES, DEFAULT_BLOCK_DESIGN.tone),
        "data-radius": pickEnum(d.radius, ALLOWED_DESIGN_RADII, DEFAULT_BLOCK_DESIGN.radius),
        "data-shadow": pickEnum(d.shadow, ALLOWED_DESIGN_SHADOWS, DEFAULT_BLOCK_DESIGN.shadow),
        "data-border": pickEnum(d.border, ALLOWED_DESIGN_BORDERS, DEFAULT_BLOCK_DESIGN.border),
        "data-padding": pickEnum(d.padding, ALLOWED_DESIGN_PADDINGS, DEFAULT_BLOCK_DESIGN.padding),
        "data-header": pickEnum(d.header, ALLOWED_DESIGN_HEADERS, DEFAULT_BLOCK_DESIGN.header),
        "data-title-align": pickEnum(d.titleAlign, ALLOWED_DESIGN_TITLE_ALIGNS, DEFAULT_BLOCK_DESIGN.titleAlign),
        "data-accent": pickEnum(d.accent, ALLOWED_DESIGN_ACCENTS, DEFAULT_BLOCK_DESIGN.accent),
        // V5.1 optional attrs — only emitted when set (drive text-transform / hover
        // / the tilt transform in CSS).
        ...(d.titleCase === "upper" ? { "data-title-case": "upper" } : {}),
        ...(d.hover && d.hover !== "none" ? { "data-hover": d.hover } : {}),
        ...(typeof d.tilt === "number" && d.tilt !== 0 ? { "data-tilt": String(d.tilt) } : {}),
    };
};

/**
 * Resolve a block's content config for rendering: returns a complete content
 * object (defaults filled) for content blocks, or {} for blocks without content
 * controls. Safe on old v2 themes whose blocks predate V3C (no `content` key).
 */
export const getBlockContent = (block) => normalizeBlockContent(block?.type, block?.content) || {};

const buildDefaultLayoutBlock = (type, order, sections) =>
    withBlockDesign(
        withBlockContent(
            {
                id: type,
                type,
                visible: sectionVisibleInList(sections, type),
                order,
                width: DEFAULT_LAYOUT_WIDTH_BY_TYPE[type] || "full",
                style: "inherit",
                variant: ALLOWED_LAYOUT_VARIANTS_BY_TYPE[type][0],
                title: DEFAULT_LAYOUT_TITLE_BY_TYPE[type],
            },
            undefined
        ),
        undefined
    );

/**
 * Client mirror of the server `sanitizeLayout`. Derives a layout from `sections`
 * when missing (legacy v1), strips unknown block types, dedupes by type, clamps
 * + re-indexes order, and whitelists width/style/variant. Never throws.
 */
const normalizeLayout = (rawLayout, sections) => {
    const byType = new Map();

    if (rawLayout && typeof rawLayout === "object" && Array.isArray(rawLayout.blocks)) {
        rawLayout.blocks.forEach((block, index) => {
            if (!block || typeof block !== "object") return;
            const type = typeof block.type === "string" ? block.type : block.id;
            if (!ALLOWED_LAYOUT_BLOCK_TYPES.includes(type)) return;
            if (byType.has(type)) return;
            const variants = ALLOWED_LAYOUT_VARIANTS_BY_TYPE[type];
            const card = normalizeBlockCard(block.card);
            byType.set(
                type,
                withBlockDesign(
                    withBlockContent(
                        {
                            id: type,
                            type,
                            visible: block.visible !== false,
                            order: clamp(block.order, 0, MAX_LAYOUT_BLOCKS * 4, index),
                            width: pickEnum(block.width, ALLOWED_LAYOUT_WIDTHS, DEFAULT_LAYOUT_WIDTH_BY_TYPE[type] || "full"),
                            style: pickEnum(block.style, ALLOWED_LAYOUT_STYLES, "inherit"),
                            variant: pickEnum(block.variant, variants, variants[0]),
                            title: sanitizeBlockTitle(block.title, DEFAULT_LAYOUT_TITLE_BY_TYPE[type]),
                            ...(card ? { card } : {}),
                        },
                        block.content
                    ),
                    block.design
                )
            );
        });
    }

    DEFAULT_LAYOUT_BLOCK_TYPES.forEach((type, index) => {
        if (!byType.has(type)) {
            byType.set(type, buildDefaultLayoutBlock(type, MAX_LAYOUT_BLOCKS + index, sections));
        }
    });

    let blocks = Array.from(byType.values()).sort((a, b) => a.order - b.order);
    if (blocks.length > MAX_LAYOUT_BLOCKS) blocks = blocks.slice(0, MAX_LAYOUT_BLOCKS);
    blocks = blocks.map((block, index) => ({ ...block, order: index }));

    return {
        mode: pickEnum(rawLayout && rawLayout.mode, ALLOWED_LAYOUT_MODES, "stack"),
        blocks,
    };
};

/**
 * Client mirror of the server `sanitizeBackground`. Rebuilds the page background
 * from scratch: type is whitelisted, angle/opacity are clamped, and the two
 * gradient stops fall back to safe defaults when not valid colors. Never throws.
 */
export const normalizeBackground = (raw) => {
    const obj = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    return {
        type: pickEnum(obj.type, ALLOWED_BACKGROUND_TYPES, DEFAULT_BACKGROUND.type),
        angle: clamp(obj.angle, 0, 360, DEFAULT_BACKGROUND.angle),
        from: isValidColor(obj.from) ? obj.from.trim() : DEFAULT_BACKGROUND.from,
        to: isValidColor(obj.to) ? obj.to.trim() : DEFAULT_BACKGROUND.to,
        opacity: clamp(obj.opacity, 0, 1, DEFAULT_BACKGROUND.opacity),
    };
};

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
        background: normalizeBackground(rawTheme.background),
        sections,
        // Stickers were deprecated in Profile Builder V5. The key is kept (always
        // empty) so the theme shape stays stable; any old stored stickers are
        // dropped here so they never render and never get re-saved.
        stickers: [],
        layout: normalizeLayout(rawTheme.layout, sections),
        hero: normalizeHero(rawTheme.hero),
    };
};

/**
 * Resolve the hero element order: a deduped list of valid element keys, with any
 * missing keys appended in default order. Safe on un-normalized themes.
 */
export const getHeroOrder = (hero) => {
    const raw = Array.isArray(hero?.order) ? hero.order : [];
    const seen = new Set();
    const order = [];
    for (const k of raw) {
        if (HERO_ELEMENT_KEYS.includes(k) && !seen.has(k)) {
            order.push(k);
            seen.add(k);
        }
    }
    for (const k of DEFAULT_HERO_ORDER) if (!seen.has(k)) order.push(k);
    return order;
};

/**
 * Normalize the hero config. The hero is a fixed vertical stack: `order` is the
 * top-to-bottom element order (drag-reorderable), and `layout[key]` holds each
 * element's isolated style (align / card style / color / font / size). Free-canvas
 * x/y/w positioning was removed. Never throws.
 */
export const normalizeHero = (rawHero) => {
    const order = getHeroOrder(rawHero);
    const rawLayout =
        rawHero && rawHero.layout && typeof rawHero.layout === "object" ? rawHero.layout : {};
    const layout = {};
    for (const key of HERO_ELEMENT_KEYS) {
        const el = rawLayout[key] && typeof rawLayout[key] === "object" ? rawLayout[key] : {};
        layout[key] = {
            align: pickEnum(el.align, HERO_ELEMENT_ALIGNS, "left"),
            style: pickEnum(el.style, HERO_ELEMENT_STYLES, "none"),
            ...(HERO_ELEMENT_WIDTHS.includes(el.width) ? { width: el.width } : {}),
            ...(HERO_ELEMENT_BORDERS.includes(el.border) ? { border: el.border } : {}),
            ...(HERO_ELEMENT_RADII.includes(el.radius) ? { radius: el.radius } : {}),
            ...(HERO_ELEMENT_DIVIDERS.includes(el.divider) ? { divider: el.divider } : {}),
            ...(isValidColor(el.color) ? { color: el.color.trim() } : {}),
            ...(isValidColor(el.bgColor) ? { bgColor: el.bgColor.trim() } : {}),
            ...(typeof el.font === "string" && Object.keys(FONT_STACK_BY_KEY).includes(el.font)
                ? { font: el.font }
                : {}),
            ...(typeof el.size === "string" && Object.keys(SCALE_MULTIPLIER_BY_KEY).includes(el.size)
                ? { size: el.size }
                : {}),
            ...(Number.isFinite(Number(el.scale)) && Number(el.scale) >= 0.5 && Number(el.scale) <= 2.5
                ? { scale: Number(el.scale) }
                : {}),
            // V5.2 — a hero element can carry the SAME container design object (so
            // the hero is edited with the container tools). Only present when set.
            // Legacy align/width/divider/scale stay separate.
            ...(el.design && typeof el.design === "object"
                ? { design: normalizeHeroElementDesign(el.design) }
                : {}),
        };
    }
    return { mode: "stack", order, layout };
};

// Hero elements default to NO card chrome (minimal surface, no shadow/border) so a
// bare avatar/name/bio stays clean — unlike a container, which is a card by default.
const HERO_DEFAULT_DESIGN = {
    surface: "minimal",
    tone: "default",
    radius: "soft",
    shadow: "none",
    border: "none",
    padding: "comfortable",
    header: "label",
    titleAlign: "left",
    accent: "theme",
};

/**
 * Normalize a hero element's `design` object: the SAME shape + tools as a container
 * design, but with hero defaults (no card unless chosen). Mirrors the server
 * `sanitizeHeroElementDesign`. Reuses the shared extras normalizer.
 */
export const normalizeHeroElementDesign = (raw) => {
    const src = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : null;
    return {
        surface: pickEnum(src && src.surface, ALLOWED_DESIGN_SURFACES, HERO_DEFAULT_DESIGN.surface),
        tone: pickEnum(src && src.tone, ALLOWED_DESIGN_TONES, HERO_DEFAULT_DESIGN.tone),
        radius: pickEnum(src && src.radius, ALLOWED_DESIGN_RADII, HERO_DEFAULT_DESIGN.radius),
        shadow: pickEnum(src && src.shadow, ALLOWED_DESIGN_SHADOWS, HERO_DEFAULT_DESIGN.shadow),
        border: pickEnum(src && src.border, ALLOWED_DESIGN_BORDERS, HERO_DEFAULT_DESIGN.border),
        padding: pickEnum(src && src.padding, ALLOWED_DESIGN_PADDINGS, HERO_DEFAULT_DESIGN.padding),
        header: pickEnum(src && src.header, ALLOWED_DESIGN_HEADERS, HERO_DEFAULT_DESIGN.header),
        titleAlign: pickEnum(src && src.titleAlign, ALLOWED_DESIGN_TITLE_ALIGNS, HERO_DEFAULT_DESIGN.titleAlign),
        accent: pickEnum(src && src.accent, ALLOWED_DESIGN_ACCENTS, HERO_DEFAULT_DESIGN.accent),
        ...(src && isValidColor(src.textColor) ? { textColor: src.textColor.trim() } : {}),
        ...(src && isValidColor(src.bgColor) ? { bgColor: src.bgColor.trim() } : {}),
        ...(src && typeof src.font === "string" && Object.keys(FONT_STACK_BY_KEY).includes(src.font)
            ? { font: src.font }
            : {}),
        ...normalizeDesignExtras(src),
    };
};

/**
 * Resolve a hero element's design for rendering/editing: a complete design object
 * (hero defaults). Used by FreeHero + the hero editor so the container design tools
 * work on hero elements exactly as on containers.
 */
export const getHeroElementDesign = (el) => normalizeHeroElementDesign(el && el.design);

/**
 * Seed a design object from a hero element's LEGACY style fields, so opening the
 * design tools on an already-styled element shows its current look (and the first
 * edit migrates it). Maps style→surface, color→textColor, bgColor, font, radius,
 * border (hairline stays; thicker/dashed → accent).
 */
export const heroLegacyToDesign = (el) => {
    const e = el && typeof el === "object" ? el : {};
    return {
        ...(e.style && e.style !== "none" ? { surface: e.style } : {}),
        ...(isValidColor(e.color) ? { textColor: e.color } : {}),
        ...(isValidColor(e.bgColor) ? { bgColor: e.bgColor } : {}),
        ...(typeof e.font === "string" ? { font: e.font } : {}),
        ...(typeof e.radius === "string" ? { radius: e.radius } : {}),
        ...(e.border && e.border !== "none" ? { border: e.border === "hairline" ? "hairline" : "accent" } : {}),
    };
};

/**
 * Compute the card surface treatment (background / border / blur) for a card
 * style. Colors come from the theme so the user's accent/card choices apply.
 */
const cardSurfaceFor = (style, colors) => {
    const cardBg = colors.cardBackground;
    const cardBorder = colors.cardBorder;

    switch (style) {
        case "solid":
            return { background: cardBg, border: cardBorder, blur: "blur(0px)" };
        case "paper":
            // A warm cream paper surface with its own dark ink text — distinct from
            // "solid" (which uses the theme card colour). Mirrors the Design tray's
            // [data-surface="paper"] look so the two paths agree.
            return {
                background: "rgba(253, 248, 238, 0.96)",
                border: "rgba(120, 95, 55, 0.22)",
                blur: "blur(0px)",
                text: "#3b2f1c",
            };
        case "minimal":
            return { background: "transparent", border: cardBorder, blur: "blur(0px)" };
        case "glass":
        default:
            return { background: cardBg, border: cardBorder, blur: CARD_BLUR_BY_STYLE.glass };
    }
};

const cardSurface = (theme) => cardSurfaceFor(theme.cards.style, theme.colors);

// Build the `--pt-card-*` CSS vars for a single card config (style/radius/
// border/shadow) using the theme's colors. Shared by the global preview and
// per-block card overrides.
const cardCssVars = (card, colors) => {
    const surface = cardSurfaceFor(card.style, colors);
    const borderWidth = card.border === "none" ? "0px" : BORDER_WIDTH_BY_KEY[card.border];
    return {
        "--pt-card-bg": surface.background,
        "--pt-card-border-color": surface.border,
        "--pt-card-border-width": borderWidth,
        "--pt-card-blur": surface.blur,
        "--pt-card-radius": RADIUS_VALUE_BY_KEY[card.radius],
        "--pt-card-shadow": SHADOW_VALUE_BY_KEY[card.shadow],
        // Some surfaces (paper) carry their own legible text colour.
        ...(surface.text ? { "--pt-card-text": surface.text } : {}),
    };
};

// Whitelisted keys for a per-block card override (mirrors the global cards set).
const CARD_STYLE_KEYS = Object.keys(CARD_BLUR_BY_STYLE);
const CARD_RADIUS_KEYS = Object.keys(RADIUS_VALUE_BY_KEY);
const CARD_BORDER_KEYS = Object.keys(BORDER_WIDTH_BY_KEY);
const CARD_SHADOW_KEYS = Object.keys(SHADOW_VALUE_BY_KEY);

/**
 * Normalize a per-block `card` override to a full {style,radius,border,shadow}.
 * Returns undefined when there's no override object — the block then inherits
 * the page (global) card style. Missing fields fall back to `fallback` (the
 * effective surface the block is currently showing) then to safe defaults.
 */
export const normalizeBlockCard = (raw, fallback) => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
    const base = fallback && typeof fallback === "object" ? fallback : {};
    return {
        style: pickEnum(raw.style, CARD_STYLE_KEYS, base.style || "glass"),
        radius: pickEnum(raw.radius, CARD_RADIUS_KEYS, base.radius || "round"),
        border: pickEnum(raw.border, CARD_BORDER_KEYS, base.border || "soft"),
        shadow: pickEnum(raw.shadow, CARD_SHADOW_KEYS, base.shadow || "soft"),
    };
};

/**
 * Per-block card CSS vars for rendering, or null when the block has no override
 * (it then inherits the global `--pt-card-*` vars from the profile scope).
 */
export const getBlockCardCssVars = (theme, block) => {
    const card = block && block.card;
    if (!card || !theme || !theme.colors) return null;
    return cardCssVars(card, theme.colors);
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
        ...(surface.text ? { "--pt-card-text": surface.text } : {}),
    };
};

/**
 * Apply an opacity multiplier to a hex (#rgb/#rgba/#rrggbb/#rrggbbaa) or
 * rgb()/rgba() color, returning an `rgba(...)` string. The color's own alpha (if
 * any) is multiplied by `opacity`, so lowering opacity always fades the color.
 * Falls back to the original string for anything it can't parse.
 */
const colorWithAlpha = (color, opacity) => {
    const o = clamp(opacity, 0, 1, 1);
    if (typeof color !== "string") return color;
    const v = color.trim();

    const hexMatch = /^#([0-9a-fA-F]{3,8})$/.exec(v);
    if (hexMatch) {
        let h = hexMatch[1];
        if (h.length === 3 || h.length === 4) {
            h = h.split("").map((c) => c + c).join("");
        }
        if (h.length === 6 || h.length === 8) {
            const r = parseInt(h.slice(0, 2), 16);
            const g = parseInt(h.slice(2, 4), 16);
            const b = parseInt(h.slice(4, 6), 16);
            const baseA = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
            return `rgba(${r},${g},${b},${+(baseA * o).toFixed(3)})`;
        }
    }

    const rgbMatch = /^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*(0|1|0?\.\d+)\s*)?\)$/.exec(v);
    if (rgbMatch) {
        const baseA = rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1;
        return `rgba(${rgbMatch[1]},${rgbMatch[2]},${rgbMatch[3]},${+(baseA * o).toFixed(3)})`;
    }

    return v;
};

/**
 * Build the inline background style for the profile column from the theme's
 * `background` config. Returns null when the theme uses no gradient background
 * (so the caller can fall back to the legacy image / app shell). The gradient's
 * opacity is baked into its color stops, so a lower opacity lets the page behind
 * show through — giving the user a contrast knob.
 */
export const profileBackgroundToStyle = (theme) => {
    const bg = normalizeBackground(theme && theme.background);
    if (bg.type !== "gradient") return null;
    const from = colorWithAlpha(bg.from, bg.opacity);
    const to = colorWithAlpha(bg.to, bg.opacity);
    return {
        backgroundImage: `linear-gradient(${bg.angle}deg, ${from} 0%, ${to} 100%)`,
        backgroundRepeat: "no-repeat",
    };
};

/**
 * Resolve a legacy `users.background` style for the current motion preference.
 *
 * GIF backgrounds are stored as a normal style object PLUS two extra keys:
 *   - mediaType: "gif"
 *   - backgroundPosterImage: `url(<poster>)`  (static fallback)
 * Those extra keys aren't valid CSS, so this helper always strips them and
 * returns a clean style object safe to spread into `style={...}`:
 *   - non-GIF backgrounds (image / gradient) pass through unchanged
 *   - GIF + reduced motion + poster → swaps backgroundImage to the poster (still)
 *   - GIF otherwise → keeps the animated GIF (poster missing falls back to GIF)
 */
export const resolveLegacyBackgroundForMotion = (legacyStyle, prefersReducedMotion = false) => {
    if (!legacyStyle || typeof legacyStyle !== "object") return legacyStyle;

    // Production animated-background manifest (optimized video, or the GIF
    // fallback manifest): NEVER spread its non-CSS fields (mp4Url, processing, …)
    // into a style. Animated media is rendered by ProfileBackgroundLayer; any
    // CSS consumer here resolves to the static poster instead.
    if (legacyStyle.type === "animated_background" || legacyStyle.mp4Url || legacyStyle.webmUrl) {
        return getStaticBackgroundStyle(legacyStyle, { posterForAnimated: true }) || {};
    }

    if (legacyStyle.mediaType !== "gif") return legacyStyle;

    const { mediaType, backgroundPosterImage, ...cleanStyle } = legacyStyle;

    if (prefersReducedMotion && backgroundPosterImage) {
        return { ...cleanStyle, backgroundImage: backgroundPosterImage };
    }
    return cleanStyle;
};

/**
 * Compose the profile column's background style by OVERLAYING the theme gradient
 * on top of the legacy image/gradient background (rather than replacing it). CSS
 * stacks comma-separated background layers with the FIRST listed on top, so the
 * gradient sits over the image — at opacity < 1 the image shows through, giving a
 * tint. Falls back to whichever layer exists:
 *   - gradient only      → the gradient
 *   - legacy image only  → the image (unchanged behavior)
 *   - both               → gradient over image
 *   - neither            → null
 */
export const composeProfileBackgroundStyle = (theme, legacyStyle) => {
    const gradient = profileBackgroundToStyle(theme);
    const legacy = legacyStyle && typeof legacyStyle === "object" ? legacyStyle : null;
    const legacyHasBg = legacy && (legacy.backgroundImage || legacy.background);

    if (!gradient) return legacyHasBg ? legacy : null;
    if (!legacyHasBg) return gradient;

    const layers = [gradient.backgroundImage];
    if (legacy.backgroundImage) layers.push(legacy.backgroundImage);

    return {
        ...legacy,
        backgroundImage: layers.join(", "),
        backgroundSize: legacy.backgroundSize || "cover",
        backgroundPosition: legacy.backgroundPosition || "center",
        backgroundRepeat: legacy.backgroundRepeat || "no-repeat",
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

/**
 * Return the layout's blocks in their stored order, regardless of visibility.
 * Falls back to a derived default layout for legacy/partial themes.
 */
export const getOrderedLayoutBlocks = (theme) => {
    const layout =
        theme && theme.layout && Array.isArray(theme.layout.blocks)
            ? theme.layout
            : normalizeLayout(null, theme?.sections);
    return [...layout.blocks]
        .filter((b) => b && ALLOWED_LAYOUT_BLOCK_TYPES.includes(b.type))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
};

/**
 * Return only the VISIBLE layout blocks, in order. Used by the renderer so a
 * profile shows the containers the user chose, where they chose them.
 */
export const getVisibleOrderedLayoutBlocks = (theme) =>
    getOrderedLayoutBlocks(theme).filter((b) => b.visible !== false);

/** Find a single layout block by type (or undefined). */
export const getLayoutBlock = (theme, type) =>
    getOrderedLayoutBlocks(theme).find((b) => b.type === type);
