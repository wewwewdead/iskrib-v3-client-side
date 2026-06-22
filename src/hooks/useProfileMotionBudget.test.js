import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useProfileMotionBudget from "./useProfileMotionBudget";

const setMatchMedia = (matches) => {
    window.matchMedia = (query) => ({
        matches: matches(query),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    });
};

beforeEach(() => {
    setMatchMedia(() => false);
});

describe("useProfileMotionBudget", () => {
    it("allows animation by default (desktop, no reduced motion, not hidden)", () => {
        const { result } = renderHook(() => useProfileMotionBudget());
        expect(result.current.shouldAnimateProfileBackground).toBe(true);
        expect(result.current.shouldUsePosterOnly).toBe(false);
        expect(result.current.shouldDisableBackdropBlur).toBe(false);
        expect(result.current.shouldRenderAmbientPoster).toBe(true);
    });

    it("forces poster-only when the builder is open", () => {
        const { result } = renderHook(() => useProfileMotionBudget({ builderOpen: true }));
        expect(result.current.shouldUsePosterOnly).toBe(true);
        expect(result.current.shouldAnimateProfileBackground).toBe(false);
    });

    it("forces poster-only under reduced motion", () => {
        setMatchMedia((q) => q.includes("reduced-motion"));
        const { result } = renderHook(() => useProfileMotionBudget());
        expect(result.current.prefersReducedMotion).toBe(true);
        expect(result.current.shouldUsePosterOnly).toBe(true);
    });

    it("flags mobile to disable backdrop blur but STILL allows the video to animate", () => {
        setMatchMedia((q) => q.includes("max-width"));
        const { result } = renderHook(() => useProfileMotionBudget());
        expect(result.current.isMobileViewport).toBe(true);
        expect(result.current.shouldDisableBackdropBlur).toBe(true);
        // Mobile is NOT a reason to freeze the optimized video.
        expect(result.current.shouldAnimateProfileBackground).toBe(true);
    });
});
