import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { profileThemeToCssVars } from "../ProfilePage/builder/profileThemeUtils";

const fmtCount = (n) => {
    const value = Number(n) || 0;
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
    return String(value);
};

// A small "window into the room": the user's own background + theme accent,
// so every card feels like a distinct space rather than a uniform list item.
const RoomPreview = ({ card }) => {
    const themeVars = useMemo(() => {
        if (!card.profile_theme) return null;
        return profileThemeToCssVars(card.profile_theme, {
            profile_font_color: card.profile_font_color,
        });
    }, [card.profile_theme, card.profile_font_color]);

    const accent = themeVars?.["--pt-accent"] || card.profile_font_color || "#c98a3a";
    const backdrop =
        card.background && typeof card.background === "object" ? card.background : null;

    return (
        <div className="pdc-room" aria-hidden="true">
            <div
                className={`pdc-room-backdrop${backdrop ? "" : " pdc-room-backdrop--bare"}`}
                style={backdrop || undefined}
            />
            <div className="pdc-room-veil" />
            <div className="pdc-room-lines">
                <span className="pdc-room-line" style={{ background: accent }} />
                <span className="pdc-room-line pdc-room-line--short" />
                <span className="pdc-room-line pdc-room-line--shorter" />
            </div>
            {card.profile_theme && (
                <span className="pdc-room-tag" style={{ color: accent, borderColor: accent }}>
                    themed
                </span>
            )}
        </div>
    );
};

const StatChip = ({ value, label }) => {
    if (!value) return null;
    return (
        <span className="pdc-stat">
            <strong>{fmtCount(value)}</strong>
            <span>{label}</span>
        </span>
    );
};

const ProfileDiscoverCard = ({ card, index = 0 }) => {
    if (!card?.username) return null;

    const profilePath = `/u/${encodeURIComponent(card.username)}`;
    const hasStats = card.visit_count || card.guestbook_count || card.remix_count;

    return (
        <motion.article
            className="pdc-card"
            initial={index < 12 ? { opacity: 0, y: 14 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={
                index < 12
                    ? { duration: 0.4, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }
                    : { duration: 0 }
            }
        >
            <Link to={profilePath} className="pdc-card-link" aria-label={`Visit ${card.name || card.username}'s room`}>
                <RoomPreview card={card} />

                <div className="pdc-body">
                    <div className="pdc-identity">
                        <span
                            className={`pdc-avatar-ring${
                                card.profile_theme ? " pdc-avatar-ring--themed" : ""
                            }`}
                        >
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
                            </span>
                            <span className="pdc-handle">@{card.username}</span>
                        </div>
                    </div>

                    {card.bio && <p className="pdc-bio">{card.bio}</p>}

                    {hasStats ? (
                        <div className="pdc-stats">
                            <StatChip value={card.visit_count} label="visits" />
                            <StatChip value={card.guestbook_count} label="notes" />
                            <StatChip value={card.remix_count} label="remixes" />
                        </div>
                    ) : (
                        <div className="pdc-stats pdc-stats--quiet">
                            <span className="pdc-stat-empty">A quiet room, freshly furnished.</span>
                        </div>
                    )}
                </div>

                <span className="pdc-visit-cta">
                    Visit room
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </Link>
        </motion.article>
    );
};

export default ProfileDiscoverCard;
