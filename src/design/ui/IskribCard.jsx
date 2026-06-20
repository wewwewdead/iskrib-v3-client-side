// Design Delight Phase 1 — warm paper/glass surface primitive.
// Static <div> by default; `interactive` makes it a focusable, hover-lifting,
// reduced-motion-safe affordance.
import { motion } from "framer-motion";
import { cardMotion, useMotionSafe } from "../motion";
import "./iskribUi.css";

const IskribCard = ({
    children,
    interactive = false,
    as: As = "div",
    className = "",
    onClick,
    ...rest
}) => {
    const cls = `iskrib-card${interactive ? " iskrib-card--interactive" : ""} ${className}`.trim();
    // Hook must run unconditionally (rules-of-hooks); ignored on the static path.
    const motionProps = useMotionSafe(cardMotion);

    if (!interactive) {
        return (
            <As className={cls} {...rest}>
                {children}
            </As>
        );
    }

    return (
        <motion.div
            className={cls}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={
                onClick
                    ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onClick(e);
                          }
                      }
                    : undefined
            }
            whileHover={motionProps.whileHover}
            whileTap={motionProps.whileTap}
            {...rest}
        >
            {children}
        </motion.div>
    );
};

export default IskribCard;
