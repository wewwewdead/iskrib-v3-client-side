import { describe, it, expect, beforeEach } from "vitest";
import {
    APP_THEMES,
    DEFAULT_APP_THEME,
    APP_THEME_STORAGE_KEY,
    LEGACY_THEME_STORAGE_KEY,
    getThemeBase,
    isValidAppTheme,
    resolveAppTheme,
    readStoredAppTheme,
} from "./appThemes.js";

describe("appThemes", () => {
    it("includes all 8 documented themes", () => {
        expect(APP_THEMES.map((t) => t.id)).toEqual([
            "system",
            "light",
            "dark",
            "midnight",
            "sepia",
            "forest",
            "rose",
            "ocean",
        ]);
    });

    it("maps each non-system theme to a light or dark base", () => {
        const bases = {
            light: "light",
            dark: "dark",
            midnight: "dark",
            sepia: "light",
            forest: "dark",
            rose: "light",
            ocean: "dark",
        };
        for (const [id, base] of Object.entries(bases)) {
            expect(getThemeBase(id)).toBe(base);
        }
    });

    it("validates theme ids", () => {
        expect(isValidAppTheme("midnight")).toBe(true);
        expect(isValidAppTheme("system")).toBe(true);
        expect(isValidAppTheme("neon")).toBe(false);
    });

    it("resolves system to the OS preference", () => {
        expect(resolveAppTheme("system", true)).toBe("dark");
        expect(resolveAppTheme("system", false)).toBe("light");
    });

    it("resolves a concrete theme to itself", () => {
        expect(resolveAppTheme("midnight", false)).toBe("midnight");
        expect(resolveAppTheme("sepia", true)).toBe("sepia");
    });

    it("falls back to OS preference for unknown selections", () => {
        expect(resolveAppTheme("bogus", true)).toBe("dark");
        expect(resolveAppTheme("bogus", false)).toBe("light");
    });

    describe("readStoredAppTheme", () => {
        beforeEach(() => localStorage.clear());

        it("defaults to system when nothing is stored", () => {
            expect(readStoredAppTheme()).toBe(DEFAULT_APP_THEME);
        });

        it("returns a valid stored selection", () => {
            localStorage.setItem(APP_THEME_STORAGE_KEY, "forest");
            expect(readStoredAppTheme()).toBe("forest");
        });

        it("migrates from the legacy binary toggle key", () => {
            localStorage.setItem(LEGACY_THEME_STORAGE_KEY, "dark");
            expect(readStoredAppTheme()).toBe("dark");
        });

        it("ignores an invalid stored selection", () => {
            localStorage.setItem(APP_THEME_STORAGE_KEY, "neon");
            expect(readStoredAppTheme()).toBe(DEFAULT_APP_THEME);
        });
    });
});
