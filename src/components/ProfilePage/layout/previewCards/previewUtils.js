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

/**
 * How many items to show: prefer the block's explicit content `count` (V3C),
 * else fall back to the variant's default. Always a sane positive integer.
 */
export const resolveCount = (count, type, variant, fallback = 3) => {
    const n = typeof count === "number" ? count : Number(count);
    if (Number.isFinite(n) && n > 0) return n;
    return displayCount(type, variant, fallback);
};

// ── V3C content-control presentation helpers (fixed, safe class suffixes) ─────
const IMAGE_SHAPE_CLASS = {
    rounded: "pl-shape-rounded",
    square: "pl-shape-square",
    soft: "pl-shape-soft",
};

/** Map a whitelisted image-shape value → a fixed CSS class (never user input). */
export const imageShapeClass = (shape) => IMAGE_SHAPE_CLASS[shape] || IMAGE_SHAPE_CLASS.rounded;

/** Map a whitelisted density value → a fixed CSS class. */
export const densityClass = (density) => (density === "compact" ? "pl-density-compact" : "pl-density-comfortable");

/**
 * Sort a small opinions preview array by reply_count desc (most_discussed).
 * Pure + non-mutating; only used over the already-bounded preview array.
 */
export const sortOpinions = (items, source) => {
    if (source !== "most_discussed") return items;
    return [...items].sort((a, b) => (b.reply_count || 0) - (a.reply_count || 0));
};

/**
 * Sort a small stories preview array by popularity (vote_count, then read_count)
 * desc. Pure + non-mutating; only used over the already-bounded preview array.
 */
export const sortStories = (items, source) => {
    if (source !== "popular") return items;
    return [...items].sort(
        (a, b) =>
            (b.vote_count || 0) - (a.vote_count || 0) ||
            (b.read_count || 0) - (a.read_count || 0)
    );
};

/** Merge pinned writings ahead of latest writings, deduped by id (pinned_first). */
export const mergePinnedFirst = (pinned, latest) => {
    const seen = new Set();
    const out = [];
    for (const item of [...(pinned || []), ...(latest || [])]) {
        if (!item || seen.has(item.id)) continue;
        seen.add(item.id);
        out.push(item);
    }
    return out;
};

/**
 * Resolve the items for a layout block from the fetched profile preview, applying
 * the block's V3C `source` control (pinned_first / most_discussed / popular).
 * Shared by the live profile (ProfileLayoutBlock) and the builder's live preview
 * so the two never drift. Pure + non-mutating.
 */
export const resolveBlockItems = (type, source, preview) => {
    switch (type) {
        case "writings":
            return source === "pinned_first"
                ? mergePinnedFirst(preview?.pinnedWritings, preview?.writings)
                : preview?.writings || [];
        case "media":
            return preview?.media || [];
        case "opinions":
            return sortOpinions(preview?.opinions || [], source);
        case "stories":
            return sortStories(preview?.stories || [], source);
        case "pinned_writings":
            return preview?.pinnedWritings || [];
        default:
            return [];
    }
};

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
