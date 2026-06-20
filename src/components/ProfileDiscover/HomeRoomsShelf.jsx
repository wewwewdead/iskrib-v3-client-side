import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { getProfileDiscover } from "../../../API/Api";
import { toThumbnailUrl, getBackgroundImageUrl } from "../../utils/imageVariants";
import "./profileDiscover.css";

const MAX_ROOMS = 8;
const SHELF_EASE = [0.22, 1, 0.36, 1];

// A circular, glassy scroll control — warm on hover, springy on press, and it
// fades/scales in only when there's actually somewhere to scroll.
const ShelfNavButton = ({ side, onClick, reduceMotion }) => (
    <motion.button
        type="button"
        className={`rooms-shelf-nav rooms-shelf-nav--${side}`}
        onClick={onClick}
        aria-label={side === "left" ? "Scroll to previous rooms" : "Scroll to more rooms"}
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.82 }}
        animate={reduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.82 }}
        transition={{ duration: 0.18, ease: SHELF_EASE }}
        whileHover={reduceMotion ? undefined : { scale: 1.09 }}
        whileTap={reduceMotion ? undefined : { scale: 0.9 }}
    >
        <svg className="rooms-shelf-nav-chevron" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d={side === "left" ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"}
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    </motion.button>
);

// Pull a small, deduped spread across sections so the shelf feels varied.
const pickRooms = (data) => {
    if (!data) return [];
    const order = ["mostVisited", "activeGuestbooks", "recentlyCustomized", "mostRemixed", "newWriters"];
    const seen = new Set();
    const rooms = [];

    // Round-robin one card per section per pass — keeps the shelf diverse.
    let added = true;
    let depth = 0;
    while (added && rooms.length < MAX_ROOMS) {
        added = false;
        for (const key of order) {
            const list = Array.isArray(data[key]) ? data[key] : [];
            const card = list[depth];
            if (!card || !card.username || seen.has(card.id)) continue;
            seen.add(card.id);
            rooms.push(card);
            added = true;
            if (rooms.length >= MAX_ROOMS) break;
        }
        depth += 1;
        if (depth > 12) break; // safety
    }
    return rooms;
};

const HomeRoomsShelf = () => {
    const { data, isLoading } = useQuery({
        queryKey: ["profile-discover"],
        queryFn: getProfileDiscover,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const rooms = useMemo(() => pickRooms(data), [data]);

    const trackRef = useRef(null);
    const reduceMotion = useReducedMotion();
    const [canLeft, setCanLeft] = useState(false);
    const [canRight, setCanRight] = useState(false);

    // Recompute which arrows are reachable from the current scroll position.
    const updateEdges = useCallback(() => {
        const el = trackRef.current;
        if (!el) return;
        const { scrollLeft, scrollWidth, clientWidth } = el;
        setCanLeft(scrollLeft > 2);
        setCanRight(scrollLeft + clientWidth < scrollWidth - 2);
    }, []);

    useEffect(() => {
        updateEdges();
        window.addEventListener("resize", updateEdges);
        return () => window.removeEventListener("resize", updateEdges);
    }, [updateEdges, rooms.length]);

    // Glide ~80% of the viewport so a couple of rooms always stay for context.
    const scrollByDir = useCallback((dir) => {
        const el = trackRef.current;
        if (!el) return;
        const amount = Math.max(el.clientWidth * 0.8, 220);
        el.scrollBy({ left: dir * amount, behavior: reduceMotion ? "auto" : "smooth" });
    }, [reduceMotion]);

    // Hide entirely while loading or when there's nothing — never a broken shell.
    if (isLoading || rooms.length === 0) return null;

    return (
        <motion.section
            className="rooms-shelf"
            aria-label="Rooms to visit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <div className="rooms-shelf-head">
                <div className="rooms-shelf-titles">
                    <span className="rooms-shelf-eyebrow">Spaces people are building</span>
                    <h3 className="rooms-shelf-title">Rooms to visit</h3>
                </div>
                <Link to="/home/explore/profiles" className="rooms-shelf-all">
                    Explore all
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </Link>
            </div>

            <div className="rooms-shelf-viewport">
                <span className={`rooms-shelf-fade rooms-shelf-fade--left${canLeft ? " is-visible" : ""}`} aria-hidden="true" />
                <span className={`rooms-shelf-fade rooms-shelf-fade--right${canRight ? " is-visible" : ""}`} aria-hidden="true" />

                <AnimatePresence>
                    {canLeft && (
                        <ShelfNavButton key="left" side="left" onClick={() => scrollByDir(-1)} reduceMotion={reduceMotion} />
                    )}
                </AnimatePresence>
                <AnimatePresence>
                    {canRight && (
                        <ShelfNavButton key="right" side="right" onClick={() => scrollByDir(1)} reduceMotion={reduceMotion} />
                    )}
                </AnimatePresence>

                <div className="rooms-shelf-track" ref={trackRef} onScroll={updateEdges}>
                {rooms.map((card) => {
                    // Reuse the server's pre-generated __thumb variant so we never
                    // pull a full-size 1920px background into a tiny chip.
                    const roomThumb = toThumbnailUrl(getBackgroundImageUrl(card.background));
                    return (
                    <Link
                        key={card.id}
                        to={`/u/${encodeURIComponent(card.username)}`}
                        className={`rooms-chip pressable${roomThumb ? " rooms-chip--has-image" : ""}`}
                        aria-label={`Visit ${card.name || card.username}'s room`}
                    >
                        {roomThumb && (
                            <>
                                <img
                                    className="rooms-chip-bg"
                                    src={roomThumb}
                                    alt=""
                                    aria-hidden="true"
                                    loading="lazy"
                                    decoding="async"
                                    fetchPriority="low"
                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                />
                                <span className="rooms-chip-veil" aria-hidden="true" />
                            </>
                        )}
                        <span
                            className={`rooms-chip-avatar-ring${
                                card.badge === "legend"
                                    ? " rooms-chip-avatar-ring--legend"
                                    : card.badge === "og"
                                    ? " rooms-chip-avatar-ring--og"
                                    : ""
                            }`}
                        >
                            <img
                                className="rooms-chip-avatar"
                                src={card.avatar || "/assets/profile.jpg"}
                                alt=""
                                loading="lazy"
                            />
                        </span>
                        <span className="rooms-chip-name">{card.name || card.username}</span>
                        <span className="rooms-chip-handle">@{card.username}</span>
                        {(card.visit_count > 0 || card.guestbook_count > 0) && (
                            <span className="rooms-chip-meta">
                                {card.visit_count > 0
                                    ? `${card.visit_count} ${card.visit_count === 1 ? "visit" : "visits"}`
                                    : `${card.guestbook_count} ${card.guestbook_count === 1 ? "note" : "notes"}`}
                            </span>
                        )}
                    </Link>
                    );
                })}
                </div>
            </div>
        </motion.section>
    );
};

export default HomeRoomsShelf;
