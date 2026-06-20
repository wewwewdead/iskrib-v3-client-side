import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isSectionVisible } from "../builder/profileThemeUtils";
import "./profileCompletion.css";

const DISMISS_KEY = "iskrib:profileCompletionDismissed";

const isDismissed = (userId) => {
    if (!userId) return false;
    try {
        return localStorage.getItem(`${DISMISS_KEY}:${userId}`) === "1";
    } catch {
        return false;
    }
};

const rememberDismissed = (userId) => {
    if (!userId) return;
    try {
        localStorage.setItem(`${DISMISS_KEY}:${userId}`, "1");
    } catch {
        /* non-fatal — dismissal just won't persist */
    }
};

/**
 * Build the completion checklist from cheaply-available userData. Each item is
 * scored; `hint` + `cta` drive the "next thing to do" nudges.
 */
const buildChecklist = (userData, profileTheme) => {
    const hasAvatar = !!userData?.image_url;
    const hasBio = !!(userData?.bio && String(userData.bio).trim().length > 0);
    const hasTheme = !!profileTheme;
    const guestbookOn = hasTheme ? isSectionVisible(profileTheme, "guestbook") : true;
    const usedBuilder = !!userData?.profile_theme_updated_at || hasTheme;

    return [
        {
            id: "avatar",
            label: "Add a profile photo",
            done: hasAvatar,
            hint: "A face makes your room feel lived-in.",
            cta: { kind: "edit", label: "Add photo" },
        },
        {
            id: "bio",
            label: "Write a short bio",
            done: hasBio,
            hint: "Tell visitors who's behind the door.",
            cta: { kind: "edit", label: "Add bio" },
        },
        {
            id: "theme",
            label: "Choose a theme",
            done: hasTheme,
            hint: "Add a theme so people remember your space.",
            cta: { kind: "customize", label: "Customize" },
        },
        {
            id: "guestbook",
            label: "Enable your guestbook",
            done: guestbookOn,
            hint: "Enable Guestbook so visitors can leave a note.",
            cta: { kind: "customize", label: "Enable Guestbook" },
        },
        {
            id: "builder",
            label: "Open the profile builder",
            done: usedBuilder,
            hint: "Make the room yours — it only takes a minute.",
            cta: { kind: "customize", label: "Open builder" },
        },
    ];
};

const ProfileCompletionCard = ({ userData, profileTheme, onCustomize, onEdit }) => {
    const userId = userData?.id;
    const [dismissed, setDismissed] = useState(() => isDismissed(userId));

    const { percent, nextSteps, allDone } = useMemo(() => {
        const items = buildChecklist(userData, profileTheme);
        const doneCount = items.filter((i) => i.done).length;
        const pct = Math.round((doneCount / items.length) * 100);
        const remaining = items.filter((i) => !i.done).slice(0, 3);
        return { percent: pct, nextSteps: remaining, allDone: remaining.length === 0 };
    }, [userData, profileTheme]);

    // Nothing to nudge, or the owner closed it — stay out of the way.
    if (allDone || dismissed) return null;

    const handleDismiss = () => {
        rememberDismissed(userId);
        setDismissed(true);
    };

    const runCta = (cta) => {
        if (!cta) return;
        if (cta.kind === "customize") onCustomize?.();
        else if (cta.kind === "edit") onEdit?.();
    };

    return (
        <AnimatePresence>
            <motion.section
                className="pcc-card"
                aria-label="Profile completion"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
                <button
                    type="button"
                    className="pcc-dismiss"
                    onClick={handleDismiss}
                    aria-label="Dismiss profile completion card"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </button>

                <div className="pcc-head">
                    <div className="pcc-ring" style={{ "--pcc-pct": `${percent}` }}>
                        <span className="pcc-ring-value">{percent}%</span>
                    </div>
                    <div className="pcc-head-text">
                        <span className="pcc-eyebrow">Your room</span>
                        <h3 className="pcc-title">
                            {percent < 100 ? `is ${percent}% complete` : "is all set"}
                        </h3>
                        <p className="pcc-sub">A few small touches make a space feel alive.</p>
                    </div>
                </div>

                <ul className="pcc-steps">
                    {nextSteps.map((step) => (
                        <li className="pcc-step" key={step.id}>
                            <span className="pcc-step-dot" aria-hidden="true" />
                            <span className="pcc-step-text">{step.hint}</span>
                            <button
                                type="button"
                                className="pcc-step-cta"
                                onClick={() => runCta(step.cta)}
                            >
                                {step.cta.label}
                            </button>
                        </li>
                    ))}
                </ul>
            </motion.section>
        </AnimatePresence>
    );
};

export default ProfileCompletionCard;
