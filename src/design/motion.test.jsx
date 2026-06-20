import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useMotionSafe, pressableMotion } from "./motion";
import * as framer from "framer-motion";

vi.mock("framer-motion", async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, useReducedMotion: vi.fn() };
});

describe("useMotionSafe", () => {
    beforeEach(() => vi.clearAllMocks());

    it("passes the variant through when motion is allowed", () => {
        framer.useReducedMotion.mockReturnValue(false);
        const { result } = renderHook(() => useMotionSafe(pressableMotion));
        expect(result.current.whileHover).toEqual(pressableMotion.whileHover);
        expect(result.current.whileTap).toEqual(pressableMotion.whileTap);
    });

    it("strips transforms when the user prefers reduced motion", () => {
        framer.useReducedMotion.mockReturnValue(true);
        const { result } = renderHook(() => useMotionSafe(pressableMotion));
        expect(result.current.whileHover).toBeUndefined();
        expect(result.current.whileTap).toBeUndefined();
        expect(result.current.animate).toEqual({ opacity: 1 });
    });
});
