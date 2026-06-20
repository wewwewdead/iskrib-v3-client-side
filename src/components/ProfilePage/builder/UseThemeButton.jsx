import { useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import "./useThemeButton.css";
import { useAuth } from "../../../Context/useAuth";
import { remixProfileTheme } from "../../../../API/Api";

/**
 * "Use this theme" — shown on another user's profile. Copies the viewed
 * profile's theme (colors, cards, typography, sections, stickers) onto the
 * current user. Personal data (avatar, name, bio, posts, background) is never
 * copied — that's enforced server-side.
 */
const UseThemeButton = ({ sourceUsername, iconColor }) => {
    const { session, user, openAuthModal } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const [open, setOpen] = useState(false);
    const [done, setDone] = useState(false);

    const token = session?.access_token;

    const mutation = useMutation({
        mutationFn: () => remixProfileTheme(token, sourceUsername),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userData", session?.user?.id] });
            setDone(true);
        },
    });

    const handleOpen = () => {
        if (!session) {
            openAuthModal?.();
            return;
        }
        setDone(false);
        mutation.reset();
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setDone(false);
        mutation.reset();
    };

    return (
        <>
            <button type="button" className="use-theme-btn" onClick={handleOpen} title="Use this profile style">
                <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill={iconColor || "currentColor"}>
                    <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-80q-17 0-28.5-11.5T440-360q0-17 11.5-28.5T480-400q17 0 28.5 11.5T520-360q0 17-11.5 28.5T480-320Zm-60-160q0-29 9-46t34-42q26-26 36.5-43t10.5-37q0-26-18-43t-46-17q-26 0-44 13t-26 33l-72-30q17-40 53-65t89-25q66 0 101 37t35 83q0 32-14 55t-41 48q-23 21-28.5 32T463-480h-43Z" />
                </svg>
                Use this theme
            </button>

            {createPortal(
            <AnimatePresence>
                {open && (
                    <Motion.div
                        className="use-theme-overlay"
                        onClick={handleClose}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                    >
                        <Motion.div
                            className="use-theme-modal"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Use this profile style"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.94, y: 14, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.96, y: 8, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 250, damping: 24 }}
                        >
                            {!done ? (
                                <>
                                    <h3 className="use-theme-title">Use this profile style?</h3>
                                    <p className="use-theme-body">
                                        This will copy the colors, cards, typography, sections, and stickers from
                                        {sourceUsername ? ` @${sourceUsername}` : " this profile"}. Your avatar, name,
                                        bio, posts, and background image stay yours.
                                    </p>
                                    {mutation.isError && (
                                        <p className="use-theme-error" role="alert">
                                            Couldn't apply the theme. Please try again.
                                        </p>
                                    )}
                                    <div className="use-theme-actions">
                                        <button type="button" className="use-theme-cancel" onClick={handleClose} disabled={mutation.isPending}>
                                            Cancel
                                        </button>
                                        <button type="button" className="use-theme-confirm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
                                            {mutation.isPending ? "Applying…" : "Use this style"}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="use-theme-title">Applied to your profile ✓</h3>
                                    <p className="use-theme-body">
                                        {user?.userData?.[0]?.username
                                            ? "Your profile now uses this style. You can tweak it anytime in Customize."
                                            : "Your profile now uses this style."}
                                    </p>
                                    <div className="use-theme-actions">
                                        <button type="button" className="use-theme-cancel" onClick={handleClose}>
                                            Keep browsing
                                        </button>
                                        <button
                                            type="button"
                                            className="use-theme-confirm"
                                            onClick={() => {
                                                handleClose();
                                                navigate("/profile");
                                            }}
                                        >
                                            View my profile
                                        </button>
                                    </div>
                                </>
                            )}
                        </Motion.div>
                    </Motion.div>
                )}
            </AnimatePresence>,
            document.body
            )}
        </>
    );
};

export default UseThemeButton;
