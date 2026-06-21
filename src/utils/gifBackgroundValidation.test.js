import { describe, it, expect } from "vitest";
import { validateGifFile, isGifFile, MAX_GIF_BYTES } from "./gifBackgroundValidation";

const makeFile = ({ name = "anim.gif", type = "image/gif", size = 1000 } = {}) => ({
    name,
    type,
    size,
});

describe("gifBackgroundValidation", () => {
    it("accepts a valid GIF by mimetype", () => {
        expect(validateGifFile(makeFile())).toEqual({ ok: true });
    });

    it("accepts a GIF by extension when mimetype is missing", () => {
        expect(isGifFile(makeFile({ type: "" }))).toBe(true);
        expect(validateGifFile(makeFile({ type: "" }))).toEqual({ ok: true });
    });

    it("rejects a non-GIF file with a friendly message", () => {
        const result = validateGifFile(makeFile({ name: "photo.png", type: "image/png" }));
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/gif/i);
    });

    it("rejects an oversized GIF", () => {
        const result = validateGifFile(makeFile({ size: MAX_GIF_BYTES + 1 }));
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/8 ?MB|large/i);
    });

    it("rejects a missing file", () => {
        expect(validateGifFile(null).ok).toBe(false);
    });
});
