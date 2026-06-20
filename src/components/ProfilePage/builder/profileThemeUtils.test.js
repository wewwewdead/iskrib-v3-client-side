import { describe, it, expect } from "vitest";
import {
    normalizeProfileTheme,
    getDefaultProfileTheme,
    getOrderedLayoutBlocks,
    getVisibleOrderedLayoutBlocks,
    getLayoutBlock,
} from "./profileThemeUtils";
import {
    PROFILE_THEME_VERSION,
    DEFAULT_LAYOUT_BLOCK_TYPES,
    ALLOWED_LAYOUT_BLOCK_TYPES,
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
