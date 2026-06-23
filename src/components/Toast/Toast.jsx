import { motion } from 'framer-motion';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';

const ICONS = {
    success: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    error: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    warning: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
    ),
    info: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
    ),
};

const Toast = ({ id, type, message, duration, onDismiss, index = 0, total = 1 }) => {
    const reduceMotion = usePrefersReducedMotion();
    // The newest toast (last in the list) sits in front at full size; older ones
    // recede a touch so a stack reads as layered cards (Sonner-style depth).
    const depth = Math.max(0, total - 1 - index);
    const scale = reduceMotion ? 1 : Math.max(0.9, 1 - depth * 0.025);
    const restOpacity = Math.max(0.8, 1 - depth * 0.06);

    return (
        <motion.div
            layout
            className={`toast-item toast-${type}`}
            role="alert"
            aria-live="polite"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={reduceMotion ? { opacity: restOpacity } : { opacity: restOpacity, y: 0, scale }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        >
            <span className="toast-icon" aria-hidden="true">{ICONS[type]}</span>
            <span className="toast-message">{message}</span>
            <button className="toast-close" onClick={() => onDismiss(id)} aria-label="Dismiss notification">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
            </button>
            <div
                className="toast-progress"
                style={{ '--toast-duration': `${duration}ms` }}
            />
        </motion.div>
    );
};

export default Toast;
