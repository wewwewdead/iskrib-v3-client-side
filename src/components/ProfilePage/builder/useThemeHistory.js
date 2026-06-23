import { useCallback, useRef, useState } from "react";

// Rapid edits closer together than this (slider/colour/edge-resize drags) collapse
// into a SINGLE undo entry; deliberate edits, which are always further apart, each
// get their own. Idle-based: the burst stays open until this long passes with no
// further `set`, so a continuous drag of any length is still one entry.
const COALESCE_MS = 300;

/**
 * Undo/redo history for the profile-theme draft.
 *
 * Returns `set` with the SAME signature as a React state setter (value or
 * functional updater), so existing `setDraft(...)` call sites work unchanged —
 * just alias `set` to `setDraft`. Selection/UI state is intentionally NOT tracked
 * here; only the persisted theme draft is.
 */
export default function useThemeHistory(initial) {
    const [state, setState] = useState({ past: [], present: initial, future: [] });
    // True while a coalescing burst is open (mid-drag); the next `set` then
    // REPLACES the present instead of pushing a new history entry.
    const burstRef = useRef(false);
    const timerRef = useRef(null);

    const endBurst = useCallback(() => {
        burstRef.current = false;
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const set = useCallback((updater) => {
        // Decide push-vs-replace synchronously, at call time — not inside the
        // state updater (which can run later / twice under StrictMode).
        const startsEntry = !burstRef.current;
        burstRef.current = true;
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            burstRef.current = false;
            timerRef.current = null;
        }, COALESCE_MS);

        setState((s) => {
            const next = typeof updater === "function" ? updater(s.present) : updater;
            if (next === s.present) return s; // no-op edit, keep history clean
            return startsEntry
                ? { past: [...s.past, s.present], present: next, future: [] }
                : { ...s, present: next };
        });
    }, []);

    const undo = useCallback(() => {
        endBurst();
        setState((s) => {
            if (!s.past.length) return s;
            const prev = s.past[s.past.length - 1];
            return { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future] };
        });
    }, [endBurst]);

    const redo = useCallback(() => {
        endBurst();
        setState((s) => {
            if (!s.future.length) return s;
            const next = s.future[0];
            return { past: [...s.past, s.present], present: next, future: s.future.slice(1) };
        });
    }, [endBurst]);

    // Replace the whole history with a fresh baseline (e.g. when the builder opens).
    const reset = useCallback(
        (theme) => {
            endBurst();
            setState({ past: [], present: theme, future: [] });
        },
        [endBurst]
    );

    return {
        draft: state.present,
        set,
        undo,
        redo,
        canUndo: state.past.length > 0,
        canRedo: state.future.length > 0,
        reset,
    };
}
