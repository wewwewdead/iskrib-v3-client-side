import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getProfileDiscover } from "../../../API/Api";
import "./profileDiscover.css";

const MAX_ROOMS = 8;

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

            <div className="rooms-shelf-track">
                {rooms.map((card) => (
                    <Link
                        key={card.id}
                        to={`/u/${encodeURIComponent(card.username)}`}
                        className="rooms-chip"
                        aria-label={`Visit ${card.name || card.username}'s room`}
                    >
                        <span
                            className={`rooms-chip-avatar-ring${
                                card.profile_theme ? " rooms-chip-avatar-ring--themed" : ""
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
                ))}
            </div>
        </motion.section>
    );
};

export default HomeRoomsShelf;
