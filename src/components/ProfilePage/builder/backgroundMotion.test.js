import { describe, it, expect } from "vitest";
import {
    resolveLegacyBackgroundForMotion,
    composeProfileBackgroundStyle,
} from "./profileThemeUtils";

const gifBackground = {
    mediaType: "gif",
    backgroundImage: "url(https://cdn.test/anim.gif)",
    backgroundPosterImage: "url(https://cdn.test/poster.webp)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
};

describe("resolveLegacyBackgroundForMotion", () => {
    it("strips GIF metadata keys when animation is allowed", () => {
        const resolved = resolveLegacyBackgroundForMotion(gifBackground, false);
        expect(resolved.mediaType).toBeUndefined();
        expect(resolved.backgroundPosterImage).toBeUndefined();
        expect(resolved.backgroundImage).toBe("url(https://cdn.test/anim.gif)");
    });

    it("swaps to the poster under reduced motion", () => {
        const resolved = resolveLegacyBackgroundForMotion(gifBackground, true);
        expect(resolved.backgroundImage).toBe("url(https://cdn.test/poster.webp)");
        expect(resolved.mediaType).toBeUndefined();
        expect(resolved.backgroundPosterImage).toBeUndefined();
    });

    it("falls back to the GIF when reduced motion is set but no poster exists", () => {
        const noPoster = { ...gifBackground };
        delete noPoster.backgroundPosterImage;
        const resolved = resolveLegacyBackgroundForMotion(noPoster, true);
        expect(resolved.backgroundImage).toBe("url(https://cdn.test/anim.gif)");
    });

    it("leaves a normal image/gradient background unchanged", () => {
        const imageBg = {
            backgroundImage: "url(https://cdn.test/photo.webp)",
            backgroundSize: "cover",
        };
        expect(resolveLegacyBackgroundForMotion(imageBg, true)).toBe(imageBg);
        expect(resolveLegacyBackgroundForMotion(imageBg, false)).toBe(imageBg);
    });

    it("passes through null/undefined", () => {
        expect(resolveLegacyBackgroundForMotion(null, true)).toBeNull();
        expect(resolveLegacyBackgroundForMotion(undefined, false)).toBeUndefined();
    });
});

describe("composeProfileBackgroundStyle with a GIF background", () => {
    const themeWithGradient = {
        background: {
            type: "gradient",
            angle: 135,
            from: "#000000",
            to: "#ffffff",
            opacity: 0.5,
        },
    };

    it("overlays the theme gradient on top of the GIF", () => {
        const clean = resolveLegacyBackgroundForMotion(gifBackground, false);
        const composed = composeProfileBackgroundStyle(themeWithGradient, clean);
        // Gradient is listed FIRST (renders on top), GIF underneath.
        expect(composed.backgroundImage).toMatch(/^linear-gradient/);
        expect(composed.backgroundImage).toContain("url(https://cdn.test/anim.gif)");
        // No metadata leaked into the CSS style.
        expect(composed.mediaType).toBeUndefined();
        expect(composed.backgroundPosterImage).toBeUndefined();
    });

    it("keeps the GIF alone when the theme has no gradient", () => {
        const clean = resolveLegacyBackgroundForMotion(gifBackground, false);
        const composed = composeProfileBackgroundStyle({}, clean);
        expect(composed.backgroundImage).toBe("url(https://cdn.test/anim.gif)");
    });
});
