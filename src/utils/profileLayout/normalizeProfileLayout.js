import {
    DEFAULT_PROFILE_LAYOUT,
    PROFILE_SECTION_IDS,
    PROFILE_SECTION_SIZES,
    PROFILE_WIDGET_BLOCK_TYPES,
    PROFILE_WIDGET_SIZES,
    PROFILE_WIDGET_TYPES,
    getDefaultSectionPosition,
    normalizeProfileWidgetType,
} from "./constants";
import { createProfileLayoutId } from "./widgetFactories";

export const normalizeProfileLayout = (layout) => {
    const normalized = {
        version: layout?.version || DEFAULT_PROFILE_LAYOUT.version,
        preset: layout?.preset || DEFAULT_PROFILE_LAYOUT.preset,
        spacing: layout?.spacing || DEFAULT_PROFILE_LAYOUT.spacing,
        radius: layout?.radius || DEFAULT_PROFILE_LAYOUT.radius,
        sections: DEFAULT_PROFILE_LAYOUT.sections.map((section) => ({ ...section })),
        widgets: [],
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
            visible: true,
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

    const incomingWidgets = Array.isArray(layout?.widgets) ? layout.widgets : [];
    normalized.widgets = incomingWidgets
        .filter((widget) => (
            widget
            && typeof widget === "object"
            && typeof widget?.parent_block_id !== "string"
            && typeof widget?.parent_widget_id !== "string"
        ))
        .map((widget) => {
            const normalizedWidgetType = normalizeProfileWidgetType(widget.type);

            return {
            id: widget.id || createProfileLayoutId("widget"),
            type: PROFILE_WIDGET_TYPES.includes(normalizedWidgetType)
                ? normalizedWidgetType
                : "note",
            size: PROFILE_WIDGET_SIZES.includes(widget.size) ? widget.size : "md",
            title: typeof widget.title === "string" ? widget.title : "",
            note: typeof widget.note === "string" ? widget.note : "",
            image_url: typeof widget.image_url === "string" ? widget.image_url : "",
            x: Number.isFinite(widget?.x) ? Math.max(0, widget.x) : 24,
            y: Number.isFinite(widget?.y) ? Math.max(0, widget.y) : 24,
            width: Number.isFinite(widget?.width) ? Math.max(180, widget.width) : null,
            height: Number.isFinite(widget?.height) ? Math.max(96, widget.height) : null,
            image_width: Number.isFinite(widget?.image_width)
                ? Math.max(60, widget.image_width)
                : null,
            image_height: Number.isFinite(widget?.image_height)
                ? Math.max(40, widget.image_height)
                : null,
            pinned_section: PROFILE_SECTION_IDS.includes(widget?.pinned_section)
                ? widget.pinned_section
                : null,
            bg_color: typeof widget.bg_color === "string" ? widget.bg_color : null,
            blocks: Array.isArray(widget.blocks)
                ? widget.blocks
                      .filter((block) => block && typeof block === "object")
                      .map((block) => {
                          const isLegacyWidgetCard = block.type === "widget_card";
                          const normalizedBlockType = PROFILE_WIDGET_BLOCK_TYPES.includes(block.type)
                              ? block.type
                              : "text";
                          const fallbackLegacyContent = [
                              typeof block.title === "string" ? block.title : "",
                              typeof block.note === "string" ? block.note : "",
                          ].filter(Boolean).join("\n");

                          return {
                              id: block.id || createProfileLayoutId("block"),
                              type: normalizedBlockType,
                              content: normalizedBlockType === "text"
                                  ? (
                                      typeof block.content === "string" && block.content.trim().length > 0
                                          ? block.content
                                          : (isLegacyWidgetCard ? fallbackLegacyContent : "")
                                  )
                                  : "",
                              title: normalizedBlockType === "image" && typeof block.title === "string"
                                  ? block.title
                                  : "",
                              note: normalizedBlockType === "image" && typeof block.note === "string"
                                  ? block.note
                                  : "",
                              image_url: typeof block.image_url === "string" ? block.image_url : "",
                              bg_color: typeof block.bg_color === "string" ? block.bg_color : null,
                              x: Number.isFinite(block.x) ? Math.max(0, block.x) : 0,
                              y: Number.isFinite(block.y) ? Math.max(0, block.y) : 0,
                              width: Number.isFinite(block.width) ? Math.max(40, block.width) : 160,
                              height: Number.isFinite(block.height) ? Math.max(24, block.height) : 40,
                              image_width: Number.isFinite(block.image_width)
                                  ? block.image_width
                                  : null,
                              image_height: Number.isFinite(block.image_height)
                                  ? block.image_height
                                  : null,
                          };
                      })
                : [],
        };
        });

    return normalized;
};
