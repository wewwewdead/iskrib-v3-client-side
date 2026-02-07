export const DEFAULT_PROFILE_LAYOUT = {
    version: 1,
    preset: "classic",
    spacing: "md",
    radius: "lg",
    sections: [
        { id: "stats", visible: true, size: "md", x: 24, y: 16 },
        { id: "bio", visible: true, size: "md", x: 24, y: 108 },
        { id: "joined_date", visible: true, size: "md", x: 24, y: 196 },
    ],
};

export const PROFILE_SECTION_LABELS = {
    stats: "Stats",
    bio: "Bio",
    joined_date: "Joined date",
};

export const PROFILE_SECTION_CODES = {
    stats: "ST",
    bio: "BIO",
    joined_date: "JD",
};

export const PROFILE_SECTION_IDS = Object.keys(PROFILE_SECTION_LABELS);
export const PROFILE_SECTION_SIZES = ["sm", "md", "lg"];
export const PROFILE_WIDGET_TYPES = ["note", "photo-notes"];
export const PROFILE_WIDGET_BLOCK_TYPES = ["text", "image"];
export const PROFILE_WIDGET_SIZES = ["sm", "md", "lg"];
export const PROFILE_WIDGET_GRID_SIZE = 24;
export const PROFILE_SECTION_GRID_SIZE = 24;
export const PROFILE_HERO_SECTION_IDS = ["stats", "bio", "joined_date"];

export const normalizeProfileWidgetType = (type) => {
    if (type === "photo_note" || type === "photo_notes" || type === "photo-note") {
        return "photo-notes";
    }

    return type;
};

export const isPhotoNoteType = (type) =>
    normalizeProfileWidgetType(type) === "photo-notes";

export const getDefaultSectionPosition = (sectionId) => {
    if (sectionId === "stats") {
        return { x: 24, y: 16 };
    }

    if (sectionId === "bio") {
        return { x: 24, y: 108 };
    }

    return { x: 24, y: 196 };
};
