import { PROFILE_THEME_VERSION, PROFILE_SECTIONS } from "./profileThemeConstants";

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
    };
};
