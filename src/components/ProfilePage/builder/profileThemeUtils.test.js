import { describe, it, expect } from "vitest";
import {
    normalizeProfileTheme,
    getDefaultProfileTheme,
    getOrderedLayoutBlocks,
    getVisibleOrderedLayoutBlocks,
    getLayoutBlock,
    getBlockContent,
    normalizeBlockContent,
    normalizeBlockCard,
    getBlockCardCssVars,
    normalizeBlockDesign,
    getBlockDesign,
    getBlockDesignDataAttrs,
    getBlockDesignStyle,
    normalizeHero,
    profileBackgroundToStyle,
    composeProfileBackgroundStyle,
    isHexColor,
} from "./profileThemeUtils";
import {
    PROFILE_THEME_VERSION,
    DEFAULT_LAYOUT_BLOCK_TYPES,
    ALLOWED_LAYOUT_BLOCK_TYPES,
    DEFAULT_BLOCK_CONTENT,
    DEFAULT_BLOCK_DESIGN,
} from "./profileThemeConstants";

const userData = { profile_font_color: "#ffffff", created_at: "2020-01-01" };

describe("normalizeProfileTheme — layout (V3A)", () => {
    it("stamps the current theme version", () => {
        const theme = normalizeProfileTheme({}, userData);
        expect(theme.version).toBe(PROFILE_THEME_VERSION);
        expect(PROFILE_THEME_VERSION).toBe(2);
    });

    it("derives a default layout when none is stored (legacy v1)", () => {
        const theme = normalizeProfileTheme({ version: 1, presetId: "noir" }, userData);
        expect(theme.layout).toBeDefined();
        expect(theme.layout.mode).toBe("stack");
        DEFAULT_LAYOUT_BLOCK_TYPES.forEach((type) => {
            expect(theme.layout.blocks.find((b) => b.type === type)).toBeDefined();
        });
        // order is a clean 0..n-1 sequence
        theme.layout.blocks.forEach((b, i) => expect(b.order).toBe(i));
    });

    it("seeds derived layout visibility from legacy sections", () => {
        const theme = normalizeProfileTheme(
            { sections: [{ id: "media", visible: false, order: 0 }] },
            userData
        );
        const media = theme.layout.blocks.find((b) => b.type === "media");
        expect(media.visible).toBe(false);
    });

    it("strips unknown block types and whitelists fields", () => {
        const theme = normalizeProfileTheme(
            {
                layout: {
                    mode: "free-canvas",
                    blocks: [
                        { type: "evil_block", order: 0 },
                        { type: "writings", order: 1, width: "ginormous", style: "hologram", variant: "boom", title: "Hi" },
                    ],
                },
            },
            userData
        );
        expect(theme.layout.mode).toBe("stack");
        expect(theme.layout.blocks.find((b) => b.type === "evil_block")).toBeUndefined();
        theme.layout.blocks.forEach((b) => expect(ALLOWED_LAYOUT_BLOCK_TYPES).toContain(b.type));
        const writings = theme.layout.blocks.find((b) => b.type === "writings");
        expect(writings.width).toBe("full"); // bad width → default
        expect(writings.style).toBe("inherit"); // bad style → default
        expect(writings.variant).toBe("editorial"); // bad variant → first allowed
        expect(writings.title).toBe("Hi");
    });

    it("dedupes blocks by type", () => {
        const theme = normalizeProfileTheme(
            { layout: { blocks: [{ type: "writings", order: 0, title: "A" }, { type: "writings", order: 1, title: "B" }] } },
            userData
        );
        expect(theme.layout.blocks.filter((b) => b.type === "writings")).toHaveLength(1);
    });

    it("getDefaultProfileTheme includes a layout", () => {
        const theme = getDefaultProfileTheme(userData);
        expect(theme.layout.blocks.length).toBe(DEFAULT_LAYOUT_BLOCK_TYPES.length);
    });
});

describe("getOrderedLayoutBlocks / getVisibleOrderedLayoutBlocks", () => {
    const themeWith = (blocks) => normalizeProfileTheme({ layout: { blocks } }, userData);

    it("returns blocks in their stored order", () => {
        const theme = themeWith([
            { type: "writings", order: 5 },
            { type: "guestbook", order: 0 },
        ]);
        const ordered = getOrderedLayoutBlocks(theme);
        expect(ordered[0].type).toBe("guestbook");
        expect(ordered.map((b) => b.order)).toEqual([...ordered.map((_, i) => i)]);
    });

    it("filters hidden blocks out of the visible list", () => {
        const theme = themeWith([
            { type: "guestbook", order: 0, visible: false },
            { type: "writings", order: 1, visible: true },
        ]);
        const visible = getVisibleOrderedLayoutBlocks(theme);
        expect(visible.find((b) => b.type === "guestbook")).toBeUndefined();
        expect(visible.find((b) => b.type === "writings")).toBeDefined();
    });

    it("includes guestbook exactly once (no duplication)", () => {
        const theme = getDefaultProfileTheme(userData);
        const guestbooks = getVisibleOrderedLayoutBlocks(theme).filter((b) => b.type === "guestbook");
        expect(guestbooks).toHaveLength(1);
    });

    it("works on a raw (un-normalized) legacy theme with no layout", () => {
        const ordered = getOrderedLayoutBlocks({ version: 1, sections: [] });
        expect(ordered.find((b) => b.type === "guestbook")).toBeDefined();
    });

    it("getLayoutBlock finds a block by type", () => {
        const theme = getDefaultProfileTheme(userData);
        expect(getLayoutBlock(theme, "media").type).toBe("media");
        expect(getLayoutBlock(theme, "nope")).toBeUndefined();
    });
});

describe("content controls (V3C)", () => {
    it("adds default content controls when normalizing a theme with none", () => {
        const theme = normalizeProfileTheme({ version: 1 }, userData);
        const writings = theme.layout.blocks.find((b) => b.type === "writings");
        expect(writings.content).toEqual(DEFAULT_BLOCK_CONTENT.writings);
        const media = theme.layout.blocks.find((b) => b.type === "media");
        expect(media.content).toEqual(DEFAULT_BLOCK_CONTENT.media);
    });

    it("falls back invalid content controls to safe defaults", () => {
        const theme = normalizeProfileTheme(
            {
                layout: {
                    blocks: [
                        { type: "writings", order: 0, content: { count: 99, source: "evil", density: "ultra", imageShape: "triangle" } },
                    ],
                },
            },
            userData
        );
        const writings = theme.layout.blocks.find((b) => b.type === "writings");
        expect(writings.content.count).toBe(DEFAULT_BLOCK_CONTENT.writings.count);
        expect(writings.content.source).toBe("latest");
        expect(writings.content.density).toBe("comfortable");
        expect(writings.content.imageShape).toBe("rounded");
    });

    it("strips unknown content keys", () => {
        const content = normalizeBlockContent("media", { count: 4, evil: "x", query: "*" });
        expect(content.evil).toBeUndefined();
        expect(content.query).toBeUndefined();
        expect(content.count).toBe(4);
    });

    it("enforces the per-block source whitelist", () => {
        expect(normalizeBlockContent("writings", { source: "most_discussed" }).source).toBe("latest");
        expect(normalizeBlockContent("opinions", { source: "most_discussed" }).source).toBe("most_discussed");
        expect(normalizeBlockContent("stories", { source: "popular" }).source).toBe("popular");
    });

    it("returns {} from getBlockContent for non-content blocks", () => {
        expect(getBlockContent({ type: "bio" })).toEqual({});
        expect(normalizeBlockContent("stats", {})).toBeUndefined();
    });

    it("getBlockContent fills defaults for an old block with no content key", () => {
        expect(getBlockContent({ type: "writings" })).toEqual(DEFAULT_BLOCK_CONTENT.writings);
    });

    it("never throws on malformed content", () => {
        expect(() => normalizeBlockContent("writings", null)).not.toThrow();
        expect(() => normalizeBlockContent("writings", [1, 2])).not.toThrow();
        expect(normalizeBlockContent("writings", "bad")).toEqual(DEFAULT_BLOCK_CONTENT.writings);
    });
});

describe("isHexColor (shared color-input guard)", () => {
    it("accepts only strict 6-digit hex (what <input type=color> needs)", () => {
        expect(isHexColor("#ffffff")).toBe(true);
        expect(isHexColor("#D4A853")).toBe(true);
    });

    it("rejects shorthand/alpha hex, rgb(), and non-strings", () => {
        expect(isHexColor("#fff")).toBe(false);
        expect(isHexColor("#ffffffaa")).toBe(false);
        expect(isHexColor("rgba(0,0,0,0.5)")).toBe(false);
        expect(isHexColor("red")).toBe(false);
        expect(isHexColor(null)).toBe(false);
        expect(isHexColor(undefined)).toBe(false);
    });
});

describe("normalizeProfileTheme — stability / idempotency", () => {
    it("re-normalizing a default theme is a no-op (saved themes stay accepted)", () => {
        const once = normalizeProfileTheme({}, userData);
        const twice = normalizeProfileTheme(once, userData);
        expect(twice).toEqual(once);
    });

    it("preserves a rich customized theme across a second normalize pass", () => {
        const rich = normalizeProfileTheme(
            {
                presetId: "midnight",
                colors: {
                    text: "#112233",
                    accent: "#aabbcc",
                    cardBackground: "rgba(0,0,0,0.4)",
                    cardBorder: "rgba(255,255,255,0.2)",
                },
                typography: { font: "lora", scale: "spacious" },
                cards: { style: "paper", radius: "sharp", border: "bold", shadow: "strong" },
                background: { type: "gradient", angle: 90, from: "#112233", to: "#445566", opacity: 0.5 },
                layout: {
                    mode: "stack",
                    blocks: [
                        {
                            type: "writings",
                            order: 0,
                            width: "half",
                            style: "paper",
                            variant: "list",
                            title: "Words",
                            content: { count: 1, source: "pinned_first", density: "compact", imageShape: "square", showMeta: false, showExcerpt: false },
                        },
                        { type: "media", order: 1, card: { style: "glass", radius: "round", border: "soft", shadow: "soft" } },
                    ],
                },
                hero: {
                    mode: "stack",
                    order: ["name", "avatar", "stats", "bio"],
                    layout: { name: { align: "center", style: "glass", color: "#ffffff" } },
                },
            },
            userData
        );
        const again = normalizeProfileTheme(rich, userData);
        expect(again).toEqual(rich);
    });
});

describe("container design (V5) — client normalization mirrors the server", () => {
    it("attaches a complete default design to every block of a legacy theme", () => {
        const theme = normalizeProfileTheme({ version: 1 }, userData);
        theme.layout.blocks.forEach((b) => {
            expect(b.design).toBeDefined();
            expect(Object.keys(b.design).sort()).toEqual(Object.keys(DEFAULT_BLOCK_DESIGN).sort());
        });
        const writings = theme.layout.blocks.find((b) => b.type === "writings");
        expect(writings.design).toEqual(DEFAULT_BLOCK_DESIGN);
    });

    it("the default theme carries the default design on each block", () => {
        const theme = getDefaultProfileTheme(userData);
        theme.layout.blocks.forEach((b) => expect(b.design).toEqual(DEFAULT_BLOCK_DESIGN));
    });

    it("normalizeBlockDesign rebuilds from scratch (strips unknown keys, clamps enums)", () => {
        const out = normalizeBlockDesign(
            { surface: "hologram", tone: "neon", header: "marquee", evil: "<x>", radius: "sharp" },
            { type: "writings", style: "inherit" }
        );
        expect(out.surface).toBe(DEFAULT_BLOCK_DESIGN.surface); // bad → default
        expect(out.tone).toBe(DEFAULT_BLOCK_DESIGN.tone);
        expect(out.header).toBe(DEFAULT_BLOCK_DESIGN.header);
        expect(out.radius).toBe("sharp"); // valid kept
        expect(out.evil).toBeUndefined();
        expect(Object.keys(out).sort()).toEqual(Object.keys(DEFAULT_BLOCK_DESIGN).sort());
    });

    it("derives surface/radius/shadow/border from a legacy card (mirrors server)", () => {
        const out = normalizeBlockDesign(undefined, {
            type: "writings",
            style: "inherit",
            card: { style: "paper", radius: "sharp", border: "bold", shadow: "strong" },
        });
        expect(out.surface).toBe("paper");
        expect(out.radius).toBe("sharp");
        expect(out.shadow).toBe("lifted"); // strong → lifted
        expect(out.border).toBe("accent"); // bold → accent
    });

    it("getBlockDesign fills a missing design (safe on old blocks)", () => {
        expect(getBlockDesign({ type: "media" })).toEqual(DEFAULT_BLOCK_DESIGN);
        const custom = getBlockDesign({ type: "media", design: { surface: "solid" } });
        expect(custom.surface).toBe("solid");
    });

    it("getBlockDesignDataAttrs maps a design to whitelisted data-* attributes", () => {
        const attrs = getBlockDesignDataAttrs({ surface: "paper", tone: "warm", titleAlign: "center" });
        expect(attrs["data-surface"]).toBe("paper");
        expect(attrs["data-tone"]).toBe("warm");
        expect(attrs["data-title-align"]).toBe("center");
        // unfilled fields fall back to defaults, never undefined
        expect(attrs["data-header"]).toBe(DEFAULT_BLOCK_DESIGN.header);
    });

    it("keeps a valid per-container text/background color + font (mirrors server)", () => {
        const out = normalizeBlockDesign(
            { textColor: "#ff0000", bgColor: "rgba(0,0,0,0.4)", font: "spaceGrotesk" },
            { type: "writings", style: "inherit" }
        );
        expect(out.textColor).toBe("#ff0000");
        expect(out.bgColor).toBe("rgba(0,0,0,0.4)");
        expect(out.font).toBe("spaceGrotesk");
    });

    it("drops invalid color/font and omits the optional keys", () => {
        const out = normalizeBlockDesign(
            { textColor: "red", bgColor: "url(x)", font: "evil-font" },
            { type: "media", style: "inherit" }
        );
        expect(out.textColor).toBeUndefined();
        expect(out.bgColor).toBeUndefined();
        expect(out.font).toBeUndefined();
        expect(Object.keys(out).sort()).toEqual(Object.keys(DEFAULT_BLOCK_DESIGN).sort());
    });

    it("getBlockDesignStyle returns inline color/background + a --pl-font var", () => {
        const style = getBlockDesignStyle({ textColor: "#ff0000", bgColor: "#112233", font: "lora" });
        expect(style.color).toBe("#ff0000");
        expect(style.backgroundColor).toBe("#112233");
        expect(style["--pl-font"]).toMatch(/Lora/);
        // nothing set → empty style (composes cleanly with card vars)
        expect(getBlockDesignStyle({ surface: "glass" })).toEqual({});
    });

    it("getBlockDesignStyle builds gradient / pattern / frame / effects from validated parts", () => {
        const grad = getBlockDesignStyle({ fillType: "gradient", gradFrom: "#000000", gradTo: "#ffffff", gradAngle: 90 });
        expect(grad.backgroundImage).toMatch(/linear-gradient\(90deg/);

        const pat = getBlockDesignStyle({ fillType: "pattern", pattern: "dots", patternColor: "#000000", patternScale: "m", patternOpacity: 0.5 });
        expect(pat.backgroundImage).toMatch(/radial-gradient/);

        const frame = getBlockDesignStyle({ radiusPx: 30, borderWidth: 2, borderStyle: "dashed", borderColor: "#ff0000", paddingPx: 20 });
        expect(frame.borderRadius).toBe("30px");
        expect(frame.border).toBe("2px dashed #ff0000");
        expect(frame.padding).toBe("20px");

        const fx = getBlockDesignStyle({ tilt: -3, opacity: 0.8, titleSize: "xl", titleWeight: "black" });
        expect(fx["--pl-tilt"]).toBe("-3deg");
        expect(fx.opacity).toBe(0.8);
        expect(fx["--pl-title-size"]).toBeDefined();
        expect(fx["--pl-title-weight"]).toBe("900");

        // fill opacity < 1 fades a solid color to rgba; = 1 keeps the raw hex
        expect(getBlockDesignStyle({ bgColor: "#112233", fillOpacity: 0.5 }).backgroundColor).toMatch(/rgba\(17,\s*34,\s*51/);
    });

    it("getBlockDesignDataAttrs emits optional title-case / hover / tilt attrs only when set", () => {
        const attrs = getBlockDesignDataAttrs({ surface: "glass", titleCase: "upper", hover: "lift", tilt: -3 });
        expect(attrs["data-title-case"]).toBe("upper");
        expect(attrs["data-hover"]).toBe("lift");
        expect(attrs["data-tilt"]).toBe("-3");
        const plain = getBlockDesignDataAttrs({ surface: "glass" });
        expect(plain["data-hover"]).toBeUndefined();
        expect(plain["data-tilt"]).toBeUndefined();
    });

    it("normalizeBlockDesign keeps valid extras and clamps/drops bad ones (mirrors server)", () => {
        const out = normalizeBlockDesign(
            { fillType: "gradient", gradFrom: "#000000", gradTo: "#ffffff", gradAngle: 9999, tilt: -50, hover: "lift", pattern: "spiral", titleSize: "xl" },
            { type: "writings", style: "inherit" }
        );
        expect(out.fillType).toBe("gradient");
        expect(out.gradAngle).toBe(360); // clamped
        expect(out.tilt).toBe(-6); // clamped
        expect(out.hover).toBe("lift");
        expect(out.titleSize).toBe("xl");
        expect(out.pattern).toBeUndefined(); // invalid enum dropped
    });
});

describe("hero (reorderable stack) normalization", () => {
    it("defaults to stack mode with the default order + per-element styles", () => {
        const hero = normalizeHero(undefined);
        expect(hero.mode).toBe("stack");
        expect(hero.order).toEqual(["avatar", "name", "stats", "bio"]);
        expect(hero.layout.avatar).toEqual({ align: "left", style: "none" });
        ["avatar", "name", "stats", "bio"].forEach((k) => expect(hero.layout[k]).toBeDefined());
    });

    it("keeps a hero element `design` with HERO defaults (no card chrome) — V5.2", () => {
        const hero = normalizeHero({
            order: ["avatar", "name", "stats", "bio"],
            layout: {
                name: { design: { surface: "paper", tilt: -3, textColor: "#ff0000", shadow: "lifted" } },
                avatar: {},
            },
        });
        const d = hero.layout.name.design;
        expect(d.surface).toBe("paper");
        expect(d.tilt).toBe(-3);
        expect(d.textColor).toBe("#ff0000");
        expect(d.shadow).toBe("lifted"); // explicit value kept
        // an element with no design carries none (stays on the legacy path)
        expect(hero.layout.avatar.design).toBeUndefined();
        // hero defaults: a bare design has minimal surface + no shadow/border
        const bare = normalizeHero({ layout: { bio: { design: {} } } }).layout.bio.design;
        expect(bare.surface).toBe("minimal");
        expect(bare.shadow).toBe("none");
        expect(bare.border).toBe("none");
    });

    it("is always stack and drops legacy free-canvas x/y/w + height", () => {
        const hero = normalizeHero({
            mode: "free",
            height: 9999,
            layout: { avatar: { x: -50, y: 200, w: 999 } },
        });
        expect(hero.mode).toBe("stack");
        expect(hero.height).toBeUndefined();
        expect(hero.layout.avatar).toEqual({ align: "left", style: "none" });
    });

    it("normalizes the element order: dedupes, drops unknown, appends missing", () => {
        const hero = normalizeHero({ order: ["bio", "bio", "ghost", "stats"] });
        expect(hero.order).toEqual(["bio", "stats", "avatar", "name"]);
    });

    it("whitelists per-element align/style and isolates a patch to one element", () => {
        const hero = normalizeHero({
            layout: {
                name: { align: "center", style: "glass" },
                bio: { align: "diagonal", style: "neon" }, // bad → defaults
            },
        });
        expect(hero.layout.name.align).toBe("center");
        expect(hero.layout.name.style).toBe("glass");
        expect(hero.layout.bio.align).toBe("left"); // invalid → default
        expect(hero.layout.bio.style).toBe("none");
        // other elements stay at defaults (isolation)
        expect(hero.layout.avatar.align).toBe("left");
        expect(hero.layout.avatar.style).toBe("none");
    });

    it("keeps a valid per-element text color and drops invalid/absent ones", () => {
        const hero = normalizeHero({
            layout: { name: { color: "#ff0000" }, bio: { color: "not-a-color" } },
        });
        expect(hero.layout.name.color).toBe("#ff0000");
        expect(hero.layout.bio.color).toBeUndefined();
        expect(hero.layout.avatar.color).toBeUndefined();
    });

    it("whitelists per-element font and size (isolated)", () => {
        const hero = normalizeHero({
            layout: {
                name: { font: "lora", size: "spacious" },
                bio: { font: "evil", size: "huge" }, // bad → dropped
            },
        });
        expect(hero.layout.name.font).toBe("lora");
        expect(hero.layout.name.size).toBe("spacious");
        expect(hero.layout.bio.font).toBeUndefined();
        expect(hero.layout.bio.size).toBeUndefined();
        expect(hero.layout.avatar.font).toBeUndefined();
    });

    it("is included in the default theme as stack", () => {
        const theme = normalizeProfileTheme({}, userData);
        expect(theme.hero.mode).toBe("stack");
        expect(getDefaultProfileTheme(userData).hero).toBeDefined();
    });
});

describe("per-block card override", () => {
    it("normalizes a full card override and whitelists fields", () => {
        expect(normalizeBlockCard({ style: "paper", radius: "sharp", border: "bold", shadow: "strong" })).toEqual({
            style: "paper",
            radius: "sharp",
            border: "bold",
            shadow: "strong",
        });
        const fixed = normalizeBlockCard({ style: "evil", radius: "huge", border: "x", shadow: "y" });
        expect(fixed.style).toBe("glass");
        expect(fixed.radius).toBe("round");
    });

    it("returns undefined when there's no override object", () => {
        expect(normalizeBlockCard(undefined)).toBeUndefined();
        expect(normalizeBlockCard(null)).toBeUndefined();
        expect(normalizeBlockCard("glass")).toBeUndefined();
        expect(normalizeBlockCard([1, 2])).toBeUndefined();
    });

    it("normalizeProfileTheme keeps a valid block card and re-whitelists it", () => {
        const theme = normalizeProfileTheme(
            {
                layout: {
                    blocks: [
                        { type: "writings", order: 0, card: { style: "minimal", radius: "sharp", border: "none", shadow: "none" } },
                        { type: "media", order: 1 },
                    ],
                },
            },
            userData
        );
        const writings = theme.layout.blocks.find((b) => b.type === "writings");
        expect(writings.card).toEqual({ style: "minimal", radius: "sharp", border: "none", shadow: "none" });
        const media = theme.layout.blocks.find((b) => b.type === "media");
        expect(media.card).toBeUndefined();
    });

    it("deprecates stickers — drops any legacy sticker data to an empty array", () => {
        const theme = normalizeProfileTheme(
            {
                stickers: [
                    { id: "star-01", x: 10, y: 10, color: "#ff0000" },
                    { id: "heart-01", x: 20, y: 20, color: "not-a-color" },
                    { id: "moon-01", x: 30, y: 30 },
                ],
            },
            userData
        );
        // The key is preserved (stable shape) but is always empty — old stickers
        // never render and never get re-saved.
        expect(theme.stickers).toEqual([]);
    });

    it("renders a per-block 'paper' card as a distinct warm surface with its own ink (not 'solid')", () => {
        const theme = normalizeProfileTheme({}, userData);
        const card = (style) => getBlockCardCssVars(theme, { type: "writings", card: { style, radius: "soft", border: "soft", shadow: "soft" } });
        const paper = card("paper");
        const solid = card("solid");
        // Paper is no longer identical to Solid: different background + its own ink.
        expect(paper["--pt-card-bg"]).not.toBe(solid["--pt-card-bg"]);
        expect(paper["--pt-card-text"]).toBeDefined();
        expect(solid["--pt-card-text"]).toBeUndefined();
    });

    it("getBlockCardCssVars returns per-block --pt-card vars, or null without an override", () => {
        const theme = normalizeProfileTheme({}, userData);
        const blockNoCard = { type: "writings" };
        expect(getBlockCardCssVars(theme, blockNoCard)).toBeNull();

        const blockWithCard = { type: "writings", card: { style: "minimal", radius: "sharp", border: "none", shadow: "none" } };
        const vars = getBlockCardCssVars(theme, blockWithCard);
        expect(vars["--pt-card-bg"]).toBe("transparent"); // minimal style
        expect(vars["--pt-card-radius"]).toBe("6px"); // sharp
        expect(vars["--pt-card-border-width"]).toBe("0px"); // none
        expect(vars["--pt-card-shadow"]).toBe("none");
    });
});

describe("page background", () => {
    const gradientTheme = (over = {}) => ({
        background: { type: "gradient", angle: 90, from: "#112233", to: "#445566", opacity: 0.5, ...over },
    });
    const image = {
        backgroundImage: "url(https://x/y.jpg)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
    };

    it("profileBackgroundToStyle bakes opacity into the gradient stops, or null for 'none'", () => {
        expect(profileBackgroundToStyle({ background: { type: "none" } })).toBeNull();
        const style = profileBackgroundToStyle(gradientTheme());
        expect(style.backgroundImage).toBe(
            "linear-gradient(90deg, rgba(17,34,51,0.5) 0%, rgba(68,85,102,0.5) 100%)"
        );
    });

    it("composes the gradient OVER the legacy image (gradient layer first)", () => {
        const style = composeProfileBackgroundStyle(gradientTheme(), image);
        expect(style.backgroundImage).toBe(
            "linear-gradient(90deg, rgba(17,34,51,0.5) 0%, rgba(68,85,102,0.5) 100%), url(https://x/y.jpg)"
        );
        // image's sizing/positioning is preserved for the photo layer
        expect(style.backgroundSize).toBe("cover");
        expect(style.backgroundPosition).toBe("center");
    });

    it("falls back to the image alone when there's no gradient", () => {
        expect(composeProfileBackgroundStyle({ background: { type: "none" } }, image)).toEqual(image);
    });

    it("uses the gradient alone when there's no legacy background", () => {
        const style = composeProfileBackgroundStyle(gradientTheme(), null);
        expect(style.backgroundImage).toBe(
            "linear-gradient(90deg, rgba(17,34,51,0.5) 0%, rgba(68,85,102,0.5) 100%)"
        );
    });

    it("returns null when neither layer exists", () => {
        expect(composeProfileBackgroundStyle({ background: { type: "none" } }, null)).toBeNull();
        expect(composeProfileBackgroundStyle({ background: { type: "none" } }, {})).toBeNull();
    });
});
