// Design Delight Phase 1 — accessible dialog primitive.
// Portal + role="dialog" + aria-modal, focus trap, focus return on close,
// Escape + backdrop close (both no-op while `loading`), subtle motion.
import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { modalMotion } from "../motion";
import "./iskribUi.css";

const FOCUSABLE =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

const IskribModal = ({
    open,
    onClose,
    loading = false,
    labelledBy, // id of the title element
    describedBy,
    className = "",
    children,
}) => {
    const dialogRef = useRef(null);
    const restoreFocusRef = useRef(null);

    // Close unless a blocking operation (e.g. account deletion) is in progress.
    const safeClose = useCallback(() => {
        if (loading) return;
        onClose?.();
    }, [loading, onClose]);

    // Remember what was focused before open; restore it on close/unmount.
    useEffect(() => {
        if (!open) return undefined;
        restoreFocusRef.current = document.activeElement;
        // Focus the first focusable element (or the dialog itself).
        const raf = requestAnimationFrame(() => {
            const node = dialogRef.current;
            if (!node) return;
            const first = node.querySelector(FOCUSABLE);
            (first || node).focus();
        });
        return () => {
            cancelAnimationFrame(raf);
            const toRestore = restoreFocusRef.current;
            if (toRestore && typeof toRestore.focus === "function") toRestore.focus();
        };
    }, [open]);

    // Escape + focus trap.
    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                safeClose();
                return;
            }
            if (e.key !== "Tab") return;
            const node = dialogRef.current;
            if (!node) return;
            const items = node.querySelectorAll(FOCUSABLE);
            if (items.length === 0) {
                e.preventDefault();
                node.focus();
                return;
            }
            const first = items[0];
            const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, safeClose]);

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="iskrib-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) safeClose();
                    }}
                >
                    <motion.div
                        ref={dialogRef}
                        className={`iskrib-modal ${className}`.trim()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={labelledBy}
                        aria-describedby={describedBy}
                        tabIndex={-1}
                        initial={modalMotion.initial}
                        animate={modalMotion.animate}
                        exit={modalMotion.exit}
                        transition={modalMotion.transition}
                    >
                        {children}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default IskribModal;
