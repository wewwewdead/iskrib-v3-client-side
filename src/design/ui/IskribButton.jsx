// Design Delight Phase 1 — tactile, accessible button primitive.
// Real <button>, token-driven, reduced-motion-safe press feedback.
import { motion } from "framer-motion";
import { pressableMotion, useMotionSafe } from "../motion";
import "./iskribUi.css";

const IskribButton = ({
    children,
    variant = "primary", // primary | secondary | ghost | danger
    size = "md", // sm | md | lg
    loading = false,
    disabled = false,
    icon = null, // optional leading icon node
    iconRight = null, // optional trailing icon node
    type = "button",
    className = "",
    onClick,
    ...rest
}) => {
    const press = useMotionSafe(pressableMotion);
    // loading always implies disabled — never let a busy button re-submit.
    const isDisabled = disabled || loading;

    return (
        <motion.button
            type={type}
            className={`iskrib-btn iskrib-btn--${variant} iskrib-btn--${size}${loading ? " is-loading" : ""} ${className}`.trim()}
            disabled={isDisabled}
            aria-disabled={isDisabled || undefined}
            aria-busy={loading || undefined}
            onClick={isDisabled ? undefined : onClick}
            whileHover={isDisabled ? undefined : press.whileHover}
            whileTap={isDisabled ? undefined : press.whileTap}
            {...rest}
        >
            {icon && <span className="iskrib-btn-icon" aria-hidden="true">{icon}</span>}
            <span className="iskrib-btn-label">{children}</span>
            {iconRight && <span className="iskrib-btn-icon" aria-hidden="true">{iconRight}</span>}
            {loading && <span className="iskrib-btn-spinner" aria-hidden="true" />}
        </motion.button>
    );
};

export default IskribButton;
