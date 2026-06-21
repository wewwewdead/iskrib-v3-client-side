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
    normalizeHero,
    profileBackgroundToStyle,
    composeProfileBackgroundStyle,
} from "./profileThemeUtils";
import {
    PROFILE_THEME_VERSION,
    DEFAULT_LAYOUT_BLOCK_TYPES,
    ALLOWED_LAYOUT_BLOCK_TYPES,
    DEFAULT_BLOCK_CONTENT,
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

describe("hero (reorderable stack) normalization", () => {
    it("defaults to stack mode with the default order + per-element styles", () => {
        const hero = normalizeHero(undefined);
        expect(hero.mode).toBe("stack");
        expect(hero.order).toEqual(["avatar", "name", "stats", "bio"]);
        expect(hero.layout.avatar).toEqual({ align: "left", style: "none" });
        ["avatar", "name", "stats", "bio"].forEach((k) => expect(hero.layout[k]).toBeDefined());
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

    it("keeps a valid sticker color and drops invalid/absent ones", () => {
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
        const byId = Object.fromEntries(theme.stickers.map((s) => [s.id, s]));
        expect(byId["star-01"].color).toBe("#ff0000");
        expect(byId["heart-01"].color).toBeUndefined();
        expect(byId["moon-01"].color).toBeUndefined();
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
