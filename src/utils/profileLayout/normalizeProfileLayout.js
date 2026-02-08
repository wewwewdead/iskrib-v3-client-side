import {
    DEFAULT_PROFILE_LAYOUT,
    PROFILE_SECTION_IDS,
    PROFILE_SECTION_SIZES,
    MAX_NOTES_COUNT,
    DEFAULT_NOTE_CONTAINER_STYLE,
    ALLOWED_BORDER_STYLES,
    ALLOWED_FONT_FAMILIES,
    getDefaultSectionPosition,
} from "./constants";

export const normalizeProfileLayout = (layout) => {
    const normalized = {
        version: layout?.version || DEFAULT_PROFILE_LAYOUT.version,
        preset: layout?.preset || DEFAULT_PROFILE_LAYOUT.preset,
        spacing: layout?.spacing || DEFAULT_PROFILE_LAYOUT.spacing,
        radius: layout?.radius || DEFAULT_PROFILE_LAYOUT.radius,
        sections: DEFAULT_PROFILE_LAYOUT.sections.map((section) => ({ ...section })),
    };

    const incomingSections = Array.isArray(layout?.sections) ? layout.sections : [];
    const normalizedSections = [];

    incomingSections.forEach((section) => {
        if (!PROFILE_SECTION_IDS.includes(section?.id)) {
            return;
        }

        if (normalizedSections.find((item) => item.id === section.id)) {
            return;
        }

        normalizedSections.push({
            id: section.id,
            visible: section.visible !== false,
            size: PROFILE_SECTION_SIZES.includes(section?.size) ? section.size : "md",
            x: Number.isFinite(section?.x)
                ? Math.max(0, section.x)
                : getDefaultSectionPosition(section.id).x,
            y: Number.isFinite(section?.y)
                ? Math.max(0, section.y)
                : getDefaultSectionPosition(section.id).y,
            height: Number.isFinite(section?.height) ? Math.max(72, section.height) : null,
            content_width: Number.isFinite(section?.content_width)
                ? Math.max(120, section.content_width)
                : null,
            content_height: Number.isFinite(section?.content_height)
                ? Math.max(40, section.content_height)
                : null,
        });
    });

    PROFILE_SECTION_IDS.forEach((sectionId) => {
        if (normalizedSections.find((section) => section.id === sectionId)) {
            return;
        }

        const defaultSection = DEFAULT_PROFILE_LAYOUT.sections.find(
            (section) => section.id === sectionId
        );
        normalizedSections.push({ ...defaultSection });
    });

    normalized.sections = normalizedSections;

    // Normalize notes
    const incomingNotes = Array.isArray(layout?.notes) ? layout.notes : [];
    const normalizedNotes = [];

    incomingNotes.forEach((note) => {
        if (!note?.id || typeof note.id !== "string" || !note.id.startsWith("note_")) return;
        if (normalizedNotes.length >= MAX_NOTES_COUNT) return;

        const style = note.containerStyle || {};
        normalizedNotes.push({
            id: note.id,
            order: Number.isFinite(note?.order) ? note.order : normalizedNotes.length,
            content: typeof note.content === "string" ? note.content : null,
            containerStyle: {
                bgColor: typeof style.bgColor === "string" ? style.bgColor : DEFAULT_NOTE_CONTAINER_STYLE.bgColor,
                borderColor: typeof style.borderColor === "string" ? style.borderColor : DEFAULT_NOTE_CONTAINER_STYLE.borderColor,
                borderWidth: Number.isFinite(style?.borderWidth)
                    ? Math.min(10, Math.max(0, style.borderWidth))
                    : DEFAULT_NOTE_CONTAINER_STYLE.borderWidth,
                borderStyle: ALLOWED_BORDER_STYLES.includes(style?.borderStyle)
                    ? style.borderStyle
                    : DEFAULT_NOTE_CONTAINER_STYLE.borderStyle,
                borderRadius: Number.isFinite(style?.borderRadius)
                    ? Math.min(50, Math.max(0, style.borderRadius))
                    : DEFAULT_NOTE_CONTAINER_STYLE.borderRadius,
            },
            fontColor: typeof note.fontColor === "string" ? note.fontColor : "#000000",
            fontFamily: ALLOWED_FONT_FAMILIES.includes(note?.fontFamily) ? note.fontFamily : "inherit",
        });
    });

    normalized.notes = normalizedNotes;

    return normalized;
};
