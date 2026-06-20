// Design Delight Phase 1.5 — subtle page-reveal wrapper.
// A calm opacity/y reveal on mount, driven by `pageTransition` from motion.js.
// Intentionally enter-only (no exit) so it can be dropped onto a route element
// without an AnimatePresence parent and without interfering with nested
// <Outlet> routes. Reduced-motion collapses it to a near-instant opacity fade.
import { motion, useReducedMotion } from "framer-motion";
import { pageTransition } from "../motion";

const PageTransition = ({ children, className = "", as: As = "div", ...rest }) => {
    const reduce = useReducedMotion();
    const MotionTag = motion[As] || motion.div;

    // Honor reduced motion: keep a gentle fade so the page doesn't pop, but drop
    // the translate so nothing slides for motion-sensitive users.
    const initial = reduce ? { opacity: 0 } : pageTransition.initial;
    const animate = reduce ? { opacity: 1 } : pageTransition.animate;
    const transition = reduce ? { duration: 0.01 } : pageTransition.transition;

    return (
        <MotionTag
            className={className}
            initial={initial}
            animate={animate}
            transition={transition}
            {...rest}
        >
            {children}
        </MotionTag>
    );
};

export default PageTransition;
