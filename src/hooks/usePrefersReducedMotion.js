import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const getInitial = () => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
        return false;
    }
    return window.matchMedia(QUERY).matches;
};

/**
 * Tracks the user's OS-level "reduce motion" preference. Used to swap animated
 * GIF profile backgrounds for their static poster fallback. Returns false in
 * non-browser / no-matchMedia environments so animation is the safe default
 * only when the user hasn't asked to reduce it.
 */
export default function usePrefersReducedMotion() {
    const [prefersReduced, setPrefersReduced] = useState(getInitial);

    useEffect(() => {
        if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
            return undefined;
        }
        const mql = window.matchMedia(QUERY);
        const onChange = (event) => setPrefersReduced(event.matches);

        // Safari < 14 only supports the deprecated addListener API.
        if (typeof mql.addEventListener === "function") {
            mql.addEventListener("change", onChange);
        } else if (typeof mql.addListener === "function") {
            mql.addListener(onChange);
        }
        setPrefersReduced(mql.matches);

        return () => {
            if (typeof mql.removeEventListener === "function") {
                mql.removeEventListener("change", onChange);
            } else if (typeof mql.removeListener === "function") {
                mql.removeListener(onChange);
            }
        };
    }, []);

    return prefersReduced;
}
