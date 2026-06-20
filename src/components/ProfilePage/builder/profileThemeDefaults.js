import {
    PROFILE_THEME_VERSION,
    PROFILE_SECTIONS,
    DEFAULT_LAYOUT_BLOCK_TYPES,
    DEFAULT_LAYOUT_TITLE_BY_TYPE,
    DEFAULT_LAYOUT_WIDTH_BY_TYPE,
    ALLOWED_LAYOUT_VARIANTS_BY_TYPE,
} from "./profileThemeConstants";

/** Build the default ordered layout (content blocks below the hero). */
export const getDefaultLayout = () => ({
    mode: "stack",
    blocks: DEFAULT_LAYOUT_BLOCK_TYPES.map((type, index) => ({
        id: type,
        type,
        visible: true,
        order: index,
        width: DEFAULT_LAYOUT_WIDTH_BY_TYPE[type] || "full",
        style: "inherit",
        variant: ALLOWED_LAYOUT_VARIANTS_BY_TYPE[type][0],
        title: DEFAULT_LAYOUT_TITLE_BY_TYPE[type],
    })),
});

/**
 * Build a sensible default theme for a user. Existing legacy fields
 * (profile_font_color) are used as a fallback so a brand-new builder session
 * starts from the look they already have.
 */
export const getDefaultProfileTheme = (userData) => {
    const legacyFontColor =
        userData?.profile_font_color && typeof userData.profile_font_color === "string"
            ? userData.profile_font_color
            : "#ffffff";

    return {
        version: PROFILE_THEME_VERSION,
        presetId: "custom",
        colors: {
            text: legacyFontColor,
            accent: "#D4A853",
            cardBackground: "rgba(255,255,255,0.55)",
            cardBorder: "rgba(255,255,255,0.22)",
        },
        typography: {
            font: "outfit",
            scale: "normal",
        },
        cards: {
            style: "glass",
            radius: "round",
            border: "soft",
            shadow: "soft",
        },
        sections: PROFILE_SECTIONS.map((section, index) => ({
            id: section.id,
            visible: true,
            order: index,
        })),
        stickers: [],
        layout: getDefaultLayout(),
    };
};
