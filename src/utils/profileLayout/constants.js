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
export const PROFILE_SECTION_GRID_SIZE = 24;
export const PROFILE_HERO_SECTION_IDS = ["stats", "bio", "joined_date"];

export const MAX_NOTES_COUNT = 10;

export const DEFAULT_NOTE_CONTAINER_STYLE = {
    bgColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "#888888",
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: 8,
};

export const ALLOWED_BORDER_STYLES = ["solid", "dashed", "dotted", "double", "none"];
export const ALLOWED_FONT_FAMILIES = [
    "inherit", "Arial", "Helvetica", "Times New Roman",
    "Georgia", "Courier New", "Verdana", "Lora", "Inter",
];

export const getDefaultSectionPosition = (sectionId) => {
    if (sectionId === "stats") {
        return { x: 24, y: 16 };
    }

    if (sectionId === "bio") {
        return { x: 24, y: 108 };
    }

    return { x: 24, y: 196 };
};
