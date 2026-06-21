import { describe, it, expect } from "vitest";
import { STICKER_REGISTRY, STICKER_BY_ID, ALLOWED_STICKER_IDS } from "./stickerRegistry";

describe("sticker registry", () => {
    it("every entry has a unique id, a label and a Glyph component", () => {
        const ids = STICKER_REGISTRY.map((s) => s.id);
        expect(new Set(ids).size).toBe(ids.length); // no duplicates
        STICKER_REGISTRY.forEach((s) => {
            expect(typeof s.id).toBe("string");
            expect(s.label.length).toBeGreaterThan(0);
            expect(typeof s.Glyph).toBe("function");
        });
    });

    it("ALLOWED_STICKER_IDS and STICKER_BY_ID stay in lockstep with the registry", () => {
        expect(ALLOWED_STICKER_IDS).toEqual(STICKER_REGISTRY.map((s) => s.id));
        STICKER_REGISTRY.forEach((s) => expect(STICKER_BY_ID[s.id]).toBe(s));
    });

    it("ships a generously expanded set", () => {
        expect(STICKER_REGISTRY.length).toBeGreaterThanOrEqual(30);
    });
});
