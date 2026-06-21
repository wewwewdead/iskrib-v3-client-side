import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getProfileDiscover } from "../../../../API/Api";
import "./profileWanderPanel.css";

// Owner-only desktop right-rail panel: a few writers to wander off and visit.
// Shares the EXACT ["profile-discover"] React Query key the home Rooms shelf
// uses, so this is a cache hit when that data is already loaded — at most one
// extra (cached, 5-min) request, never per-render fetching.

const MAX_ROWS = 4;

// Round-robin one card per section so the picks feel varied, skipping the
// viewer's own room, anything without a username, and duplicates.
const pickWriters = (data, currentUserId) => {
    if (!data) return [];
    const order = ["mostVisited", "activeGuestbooks", "recentlyCustomized", "mostRemixed", "newWriters"];
    const seen = new Set();
    const picks = [];

    let added = true;
    let depth = 0;
    while (added && picks.length < MAX_ROWS) {
        added = false;
        for (const key of order) {
            const list = Array.isArray(data[key]) ? data[key] : [];
            const card = list[depth];
            if (!card || !card.username || card.id === currentUserId || seen.has(card.id)) continue;
            seen.add(card.id);
            picks.push(card);
            added = true;
            if (picks.length >= MAX_ROWS) break;
        }
        depth += 1;
        if (depth > 12) break; // safety
    }
    return picks;
};

// A small, human descriptor: prefer the writer's own words, fall back to a
// gentle signal of life in their room.
const describe = (card) => {
    if (card.bio) return card.bio;
    if (card.visit_count > 0) return `${card.visit_count} ${card.visit_count === 1 ? "visit" : "visits"} this week`;
    if (card.guestbook_count > 0) return `${card.guestbook_count} ${card.guestbook_count === 1 ? "note" : "notes"} left`;
    return `@${card.username}`;
};

const ProfileWanderPanel = ({ currentUserId }) => {
    const { data, isLoading } = useQuery({
        queryKey: ["profile-discover"],
        queryFn: getProfileDiscover,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const writers = useMemo(() => pickWriters(data, currentUserId), [data, currentUserId]);

    // Never render a broken shell — stay invisible until there's something real.
    if (isLoading || writers.length === 0) return null;

    return (
        <motion.aside
            className="pwd-card"
            aria-label="Writers to visit"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
            <span className="pwd-glow" aria-hidden="true" />
            <div className="pwd-head">
                <span className="pwd-eyebrow">Wander</span>
                <p className="pwd-sub">Rooms worth stepping into.</p>
            </div>

            <ul className="pwd-list">
                {writers.map((card) => (
                    <li key={card.id}>
                        <Link
                            to={`/u/${encodeURIComponent(card.username)}`}
                            className="pwd-row"
                            aria-label={`Visit ${card.name || card.username}'s room`}
                        >
                            <span
                                className={`pwd-avatar-ring${
                                    card.badge === "legend"
                                        ? " pwd-avatar-ring--legend"
                                        : card.badge === "og"
                                        ? " pwd-avatar-ring--og"
                                        : ""
                                }`}
                            >
                                <img
                                    className="pwd-avatar"
                                    src={card.avatar || "/assets/profile.jpg"}
                                    alt=""
                                    loading="lazy"
                                    decoding="async"
                                />
                            </span>
                            <span className="pwd-row-body">
                                <span className="pwd-name">{card.name || card.username}</span>
                                <span className="pwd-desc">{describe(card)}</span>
                            </span>
                        </Link>
                    </li>
                ))}
            </ul>

            <Link to="/home/explore/profiles" className="pwd-more">
                See more
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </Link>
        </motion.aside>
    );
};

export default ProfileWanderPanel;
