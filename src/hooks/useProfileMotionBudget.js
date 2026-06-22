import { useEffect, useState } from "react";
import usePrefersReducedMotion from "./usePrefersReducedMotion";

const MOBILE_QUERY = "(max-width: 768px)";

const getMobileInitial = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(MOBILE_QUERY).matches;
};

const getHiddenInitial = () => {
    if (typeof document === "undefined") return false;
    return document.visibilityState === "hidden";
};

/**
 * Central performance budget for the profile background.
 *
 * Decides when the animated background may play, when it must fall back to a
 * static poster, and when expensive blur/backdrop-filter effects should be
 * disabled. The point of the video pipeline is to KEEP animation safely — so
 * mobile is NOT a reason to freeze the optimized video; it's a reason to drop
 * the heavy frosted-glass effects layered over it.
 *
 * @param {{ builderOpen?: boolean }} [options]
 */
export default function useProfileMotionBudget({ builderOpen = false } = {}) {
    const prefersReducedMotion = usePrefersReducedMotion();
    const [isMobileViewport, setIsMobileViewport] = useState(getMobileInitial);
    const [isDocumentHidden, setIsDocumentHidden] = useState(getHiddenInitial);

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
        const mql = window.matchMedia(MOBILE_QUERY);
        const onChange = (e) => setIsMobileViewport(e.matches);
        if (typeof mql.addEventListener === "function") mql.addEventListener("change", onChange);
        else if (typeof mql.addListener === "function") mql.addListener(onChange);
        setIsMobileViewport(mql.matches);
        return () => {
            if (typeof mql.removeEventListener === "function") mql.removeEventListener("change", onChange);
            else if (typeof mql.removeListener === "function") mql.removeListener(onChange);
        };
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return undefined;
        const onVisibility = () => setIsDocumentHidden(document.visibilityState === "hidden");
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, []);

    // Builder open or reduced motion → no animation at all (render the poster).
    const shouldUsePosterOnly = prefersReducedMotion || builderOpen;
    // The main profile layer may animate via the optimized <video> (mobile too);
    // a hidden document just pauses the element, it doesn't swap to a poster.
    const shouldAnimateProfileBackground = !shouldUsePosterOnly;

    return {
        prefersReducedMotion,
        isMobileViewport,
        isDocumentHidden,
        shouldAnimateProfileBackground,
        shouldUsePosterOnly,
        // Drop expensive backdrop-filter/blur layered over an active video on mobile.
        shouldDisableBackdropBlur: isMobileViewport,
        // Decorative / ambient surfaces never animate — always a static poster.
        shouldRenderAmbientPoster: true,
    };
}
