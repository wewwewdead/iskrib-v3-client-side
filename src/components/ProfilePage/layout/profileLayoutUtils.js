/**
 * Profile Builder V3A — layout rendering helpers.
 *
 * Pure functions used by the layout renderer: canonical "View all" routes,
 * width/style CSS class maps, and per-type preview copy. No raw CSS or class
 * names ever come from user input — only whitelisted enums map to fixed classes.
 */

// Block types the renderer draws below the hero. bio/stats/joined_date are valid
// block types but stay in the hero for V3A, so they are not rendered here.
export const RENDERABLE_LAYOUT_BLOCK_TYPES = [
    "guestbook",
    "writings",
    "media",
    "opinions",
    "stories",
    "pinned_writings",
];

const OWN_ROUTES = {
    writings: "/profile",
    media: "/profile/media",
    opinions: "/profile/myOpinions",
    stories: "/profile/stories",
    pinned_writings: "/profile",
};

const visitedRoutes = (username) => ({
    writings: `/u/${username}`,
    media: `/u/${username}/media`,
    opinions: `/u/${username}/opinions`,
    stories: `/u/${username}/stories`,
    pinned_writings: `/u/${username}`,
});

/**
 * Canonical "View all" destination for a content block. Own profile keeps the
 * legacy /profile/* routes; visited profiles always use /u/:username. Returns
 * null for blocks with no full-page route (e.g. guestbook renders inline).
 */
export const getBlockRoute = (type, { isOwn, username } = {}) => {
    if (isOwn) return OWN_ROUTES[type] || null;
    if (!username) return null;
    return visitedRoutes(username)[type] || null;
};

const WIDTH_CLASS = {
    full: "pl-block--full",
    half: "pl-block--half",
    compact: "pl-block--compact",
};

const STYLE_CLASS = {
    inherit: "pl-block--inherit",
    glass: "pl-block--glass",
    paper: "pl-block--paper",
    minimal: "pl-block--minimal",
    framed: "pl-block--framed",
};

export const blockWidthClass = (width) => WIDTH_CLASS[width] || WIDTH_CLASS.full;
export const blockStyleClass = (style) => STYLE_CLASS[style] || STYLE_CLASS.inherit;

// Variant → a fixed, safe class suffix (e.g. pl-variant-media-grid). The pieces
// come from validated enums, so no arbitrary class names can be injected.
export const blockVariantClass = (type, variant) =>
    typeof type === "string" && typeof variant === "string"
        ? `pl-variant-${type}-${variant}`
        : "";

// Short descriptive copy + count-of-placeholder bars per content block type.
export const BLOCK_PREVIEW_META = {
    writings: { description: "Essays, journals and notes" },
    media: { description: "Photos and visual posts" },
    opinions: { description: "Hot takes and short thoughts" },
    stories: { description: "Serialized chapters" },
    pinned_writings: { description: "Highlighted writing" },
};
