import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { profileThemeToCssVars } from "../ProfilePage/builder/profileThemeUtils";
import VerifiedBadge from "../Badge/VerifiedBadge";

const fmtCount = (n) => {
    const value = Number(n) || 0;
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
    return String(value);
};

const STAT_ICONS = {
    visits: (
        <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
    ),
    notes: (
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    ),
    remixes: (
        <path d="M9 9h11v11H9z M5 15V5a2 2 0 0 1 2-2h10" />
    ),
};

const StatChip = ({ value, label }) => {
    if (!value) return null;
    return (
        <span className="pdc-stat">
            <svg className="pdc-stat-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {STAT_ICONS[label]}
            </svg>
            <strong>{fmtCount(value)}</strong>
        </span>
    );
};

const ProfileDiscoverCard = ({ card, index = 0 }) => {
    const themeVars = useMemo(() => {
        if (!card?.profile_theme) return null;
        return profileThemeToCssVars(card.profile_theme, {
            profile_font_color: card.profile_font_color,
        });
    }, [card?.profile_theme, card?.profile_font_color]);

    // The room's own accent tints the bare-room wash so each card reads as its
    // own space even without a background photo.
    const accent =
        themeVars?.["--pt-accent"] || card?.profile_font_color || "var(--accent-amber)";

    if (!card?.username) return null;

    const profilePath = `/u/${encodeURIComponent(card.username)}`;
    const hasStats = card.visit_count || card.guestbook_count || card.remix_count;
    const isRoom = !!card.profile_theme;
    const ctaLabel = isRoom ? "Visit room" : "Visit profile";
    const backdrop =
        card.background && typeof card.background === "object" ? card.background : null;

    // Legend / OG keep their glowing avatar ring.
    const ringClass =
        card.badge === "legend"
            ? " pdc-avatar-ring--legend"
            : card.badge === "og"
            ? " pdc-avatar-ring--og"
            : "";

    return (
        <motion.article
            className="pdc-card"
            style={{ "--pdc-accent": accent }}
            initial={index < 12 ? { opacity: 0, y: 18 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={
                index < 12
                    ? { duration: 0.45, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }
                    : { duration: 0 }
            }
        >
            <Link
                to={profilePath}
                className={`pdc-card-link pressable ${backdrop ? "pdc-card-link--photo" : "pdc-card-link--bare"}`}
                aria-label={`${ctaLabel}: ${card.name || card.username}`}
            >
                <div
                    className={`pdc-bg${backdrop ? "" : " pdc-bg--bare"}`}
                    style={backdrop || undefined}
                    aria-hidden="true"
                />
                <div className="pdc-scrim" aria-hidden="true" />

                {isRoom && (
                    <span className="pdc-room-tag" style={{ color: accent, borderColor: accent }}>
                        themed
                    </span>
                )}

                <div className="pdc-content">
                    <span className={`pdc-avatar-ring${ringClass}`}>
                        <img
                            className="pdc-avatar"
                            src={card.avatar || "/assets/profile.jpg"}
                            alt=""
                            loading="lazy"
                        />
                    </span>

                    <div className="pdc-names">
                        <span className="pdc-name-row">
                            <h3 className="pdc-name">{card.name || card.username}</h3>
                            <VerifiedBadge badge={card.badge} size={16} />
                        </span>
                        <span className="pdc-handle">@{card.username}</span>
                    </div>

                    {card.bio && <p className="pdc-bio">{card.bio}</p>}

                    <div className="pdc-footer">
                        {hasStats ? (
                            <div className="pdc-stats">
                                <StatChip value={card.visit_count} label="visits" />
                                <StatChip value={card.guestbook_count} label="notes" />
                                <StatChip value={card.remix_count} label="remixes" />
                            </div>
                        ) : (
                            <span className="pdc-stat-empty">A quiet room, freshly furnished.</span>
                        )}

                        <span className="pdc-visit-cta">
                            {ctaLabel}
                            <svg className="pdc-cta-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </span>
                    </div>
                </div>
            </Link>
        </motion.article>
    );
};

export default ProfileDiscoverCard;
