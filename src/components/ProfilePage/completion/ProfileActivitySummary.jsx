import React from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { getProfileActivitySummary } from "../../../../API/Api";
import "./profileCompletion.css";

// Emotional, non-analytical lines. Only lines with a non-zero count are shown.
const buildLines = ({ visitsThisWeek, guestbookEntriesThisWeek, remixesThisWeek }) => {
    const lines = [];
    if (visitsThisWeek > 0) {
        lines.push(
            `Your room had ${visitsThisWeek} ${visitsThisWeek === 1 ? "visitor" : "visitors"} this week.`
        );
    }
    if (guestbookEntriesThisWeek > 0) {
        lines.push(
            `${guestbookEntriesThisWeek} ${
                guestbookEntriesThisWeek === 1 ? "person" : "people"
            } signed your guestbook.`
        );
    }
    if (remixesThisWeek > 0) {
        lines.push(
            `${remixesThisWeek} ${remixesThisWeek === 1 ? "person" : "people"} used your theme.`
        );
    }
    return lines;
};

const ProfileActivitySummary = ({ token }) => {
    const { data } = useQuery({
        queryKey: ["profile-activity-summary"],
        queryFn: () => getProfileActivitySummary(token),
        enabled: !!token,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    if (!data) return null;
    const lines = buildLines(data);

    // Quiet week — say nothing rather than show a row of zeros.
    if (lines.length === 0) return null;

    return (
        <motion.section
            className="pas"
            aria-label="This week in your room"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
            <span className="pas-eyebrow">This week in your room</span>
            <ul className="pas-lines">
                {lines.map((line, i) => (
                    <li className="pas-line" key={i}>
                        {line}
                    </li>
                ))}
            </ul>
        </motion.section>
    );
};

export default ProfileActivitySummary;
