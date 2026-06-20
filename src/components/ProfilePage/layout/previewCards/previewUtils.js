/**
 * Profile Builder V3B — preview card helpers (pure, no side effects).
 */

export const formatPreviewDate = (iso) => {
    if (!iso) return "";
    try {
        return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return "";
    }
};

/** Trim a string to `max` chars on a word boundary, adding an ellipsis. */
export const excerpt = (text, max = 140) => {
    if (typeof text !== "string") return "";
    const clean = text.replace(/\s+/g, " ").trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max);
    const lastSpace = cut.lastIndexOf(" ");
    return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
};

/** How many items each variant should show (data is already capped server-side). */
const DISPLAY_COUNT = {
    writings: { editorial: 3, list: 3, compact: 3 },
    pinned_writings: { featured: 3, compact: 3 },
    media: { grid: 6, collage: 5, strip: 6 },
    opinions: { cards: 3, compact: 3, debate: 2 },
    stories: { shelf: 4, covers: 3, compact: 4 },
};

export const displayCount = (type, variant, fallback = 3) =>
    DISPLAY_COUNT[type]?.[variant] ?? fallback;

const STORY_STATUS_LABEL = {
    ongoing: "Ongoing",
    completed: "Completed",
    hiatus: "On hiatus",
};

export const storyStatusLabel = (status) => STORY_STATUS_LABEL[status] || "";

/** Calm empty-state copy + (owner-only) creation CTA label per block type. */
export const EMPTY_STATE_COPY = {
    writings: { message: "No writings yet.", ownerCta: "Write something" },
    media: { message: "No media shared yet.", ownerCta: "Share a post with a photo" },
    opinions: { message: "No opinions yet.", ownerCta: "Share an opinion" },
    stories: { message: "No stories yet.", ownerCta: "Add a story" },
    pinned_writings: {
        message: "No pinned writings yet.",
        ownerHint: "Pin a writing from your posts to feature it here.",
    },
};
