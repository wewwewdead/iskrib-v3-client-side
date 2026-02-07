const createProfileLayoutId = (prefix) =>
    `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const getDefaultWidgetPosition = (index = 0) => ({
    x: 24 + ((index % 2) * 240),
    y: 24 + Math.floor(index / 2) * 144,
});

export const createDefaultWidget = (index = 0) => {
    const defaultPosition = getDefaultWidgetPosition(index);

    return {
        id: createProfileLayoutId("widget"),
        type: "note",
        size: "md",
        title: "New widget",
        note: "",
        image_url: "",
        x: defaultPosition.x,
        y: defaultPosition.y,
        width: null,
        height: null,
        image_width: null,
        image_height: null,
        pinned_section: null,
        bg_color: null,
        blocks: [],
    };
};

export const createDefaultBlock = (type = "text", index = 0) => {
    const isTextBlock = type === "text";
    const resolvedType = isTextBlock ? "text" : "image";

    return {
        id: createProfileLayoutId("block"),
        type: resolvedType,
        content: isTextBlock ? "Text" : "",
        title: "",
        note: "",
        image_url: "",
        bg_color: null,
        x: 8 + ((index % 2) * 100),
        y: 8 + Math.floor(index / 2) * 60,
        width: isTextBlock ? 160 : 200,
        height: isTextBlock ? 40 : 140,
        image_width: null,
        image_height: null,
    };
};

export { createProfileLayoutId };
