import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getProfileDiscover } from "../../../API/Api";
import ProfileDiscoverCard from "./ProfileDiscoverCard";
import "./profileDiscover.css";

// Section order + editorial copy. A section only renders if it has cards.
const SECTIONS = [
    {
        key: "recentlyCustomized",
        eyebrow: "Just redecorated",
        title: "Recently Customized",
        blurb: "Rooms that were rearranged this week.",
    },
    {
        key: "mostVisited",
        eyebrow: "Drawing a crowd",
        title: "Most Visited This Week",
        blurb: "Where people keep wandering back.",
    },
    {
        key: "mostRemixed",
        eyebrow: "Worth borrowing",
        title: "Most Remixed",
        blurb: "Themes others made their own.",
    },
    {
        key: "activeGuestbooks",
        eyebrow: "Lively walls",
        title: "Active Guestbooks",
        blurb: "Rooms with notes worth reading.",
    },
    {
        key: "newWriters",
        eyebrow: "Just moved in",
        title: "New Writers",
        blurb: "Fresh spaces still finding their shape.",
    },
];

const SectionSkeleton = () => (
    <div className="pd-section">
        <div className="pd-section-head">
            <span className="pd-skeleton pd-skeleton-eyebrow" />
            <span className="pd-skeleton pd-skeleton-title" />
        </div>
        <div className="pd-grid">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="pdc-card pdc-card--skeleton">
                    <div className="pd-skeleton pdc-room" />
                    <div className="pdc-body">
                        <div className="pd-skeleton pd-skeleton-line" style={{ width: "60%" }} />
                        <div className="pd-skeleton pd-skeleton-line" style={{ width: "85%" }} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const ProfileDiscoverPage = () => {
    const { data, isLoading, isError } = useQuery({
        queryKey: ["profile-discover"],
        queryFn: getProfileDiscover,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    const populatedSections = useMemo(() => {
        if (!data) return [];
        return SECTIONS.map((section) => ({
            ...section,
            cards: Array.isArray(data[section.key]) ? data[section.key] : [],
        })).filter((section) => section.cards.length > 0);
    }, [data]);

    return (
        <div className="pd-page">
            <motion.header
                className="pd-hero"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
                <span className="pd-hero-eyebrow">Explore</span>
                <h1 className="pd-hero-title">Rooms worth visiting</h1>
                <p className="pd-hero-sub">
                    Every profile on Iskrib is a small room someone built by hand. Wander in,
                    leave a note, borrow a vibe.
                </p>
            </motion.header>

            {isLoading && (
                <>
                    <SectionSkeleton />
                    <SectionSkeleton />
                </>
            )}

            {!isLoading && isError && (
                <div className="pd-empty">
                    <p className="pd-empty-title">The hallway is quiet right now.</p>
                    <p className="pd-empty-sub">We couldn't load rooms — try again in a moment.</p>
                </div>
            )}

            {!isLoading && !isError && populatedSections.length === 0 && (
                <div className="pd-empty">
                    <p className="pd-empty-title">No rooms to show yet.</p>
                    <p className="pd-empty-sub">
                        As people customize their profiles, they'll start appearing here.
                    </p>
                </div>
            )}

            {!isLoading &&
                !isError &&
                populatedSections.map((section) => (
                    <section className="pd-section" key={section.key} aria-label={section.title}>
                        <div className="pd-section-head">
                            <span className="pd-section-eyebrow">{section.eyebrow}</span>
                            <h2 className="pd-section-title">{section.title}</h2>
                            <p className="pd-section-blurb">{section.blurb}</p>
                        </div>
                        <div className="pd-grid">
                            {section.cards.map((card, index) => (
                                <ProfileDiscoverCard key={`${section.key}-${card.id}`} card={card} index={index} />
                            ))}
                        </div>
                    </section>
                ))}
        </div>
    );
};

export default ProfileDiscoverPage;
