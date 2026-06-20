// Design Delight Phase 1 — shared Framer Motion primitives.
//
// Personality: subtle lift, soft press, small Y. No bounce on functional UI
// (the spring easing is reserved for the Toast). Reduced motion is honored two
// ways: the global `@media (prefers-reduced-motion: reduce)` block in index.css
// is the CSS backstop, and `useMotionSafe()` strips transforms from any variant
// for components driven by Framer.

import { useReducedMotion } from "framer-motion";

// Durations mirror the --duration-* tokens in index.css (seconds for Framer).
export const DUR = { fast: 0.15, normal: 0.25, slow: 0.4 };
export const EASE_OUT = [0.22, 1, 0.36, 1];

export const pressableMotion = {
    whileHover: { y: -1 },
    whileTap: { scale: 0.985 },
};

export const cardMotion = {
    whileHover: { y: -3, boxShadow: "var(--shadow-hover-lift)" },
    whileTap: { scale: 0.99 },
};

export const modalMotion = {
    initial: { opacity: 0, scale: 0.97, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.98, y: 6 },
    transition: { duration: DUR.normal, ease: EASE_OUT },
};

export const sheetMotion = {
    initial: { y: 24, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 24, opacity: 0 },
    transition: { duration: DUR.normal, ease: EASE_OUT },
};

export const listItemMotion = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: DUR.fast, ease: EASE_OUT },
};

export const softReveal = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: DUR.slow, ease: EASE_OUT },
};

export const guestbookNoteMotion = {
    initial: { opacity: 0, y: 10, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: -6 },
    transition: { duration: DUR.normal, ease: EASE_OUT },
};

export const pageTransition = {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0 },
    transition: { duration: DUR.normal, ease: EASE_OUT },
};

// Reduced-motion-free version of a variant: keeps a gentle opacity fade so
// things don't pop, but removes transforms and hover/tap movement.
const REDUCED = {
    whileHover: undefined,
    whileTap: undefined,
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.01 },
};

// Returns the variant as-is, or a motion-free version when the user prefers
// reduced motion. Use for any Framer-driven component that takes a variant.
export function useMotionSafe(variant) {
    const reduce = useReducedMotion();
    if (!reduce) return variant;
    return { ...variant, ...REDUCED };
}
