import { isPhotoNoteType } from "./constants";

export const estimateWidgetHeight = (widget) => {
    if (Number.isFinite(widget?.height)) {
        return widget.height;
    }

    if (Array.isArray(widget?.blocks) && widget.blocks.length > 0) {
        const blockBottom = widget.blocks.reduce(
            (maxBottom, block) =>
                Math.max(
                    maxBottom,
                    (Number.isFinite(block?.y) ? block.y : 0) +
                        (Number.isFinite(block?.height) ? block.height : 40)
                ),
            0
        );
        return Math.max(170, blockBottom + 12);
    }

    let height = widget.size === "lg" ? 220 : widget.size === "sm" ? 130 : 170;

    if (isPhotoNoteType(widget?.type) && widget.image_url) {
        const resolvedImageHeight = Number.isFinite(widget?.image_height)
            ? widget.image_height
            : 120;
        height += resolvedImageHeight;
    }

    if (widget.note) {
        height += Math.min(120, Math.ceil(widget.note.length / 60) * 20);
    }

    return height;
};

export const getWidgetBlockCanvasStyle = (widget) => {
    const blocks = Array.isArray(widget?.blocks) ? widget.blocks : [];
    const maxBottom = blocks.reduce(
        (bottom, block) =>
            Math.max(
                bottom,
                (Number.isFinite(block?.y) ? block.y : 0) +
                    (Number.isFinite(block?.height) ? block.height : 40)
            ),
        0
    );
    const baseStyle = {
        minHeight: `${Math.max(60, maxBottom + 8)}px`,
    };

    if (widget?.pinned_section) {
        return baseStyle;
    }

    const maxRight = blocks.reduce(
        (right, block) =>
            Math.max(
                right,
                (Number.isFinite(block?.x) ? block.x : 0) +
                    (Number.isFinite(block?.width) ? block.width : 160)
            ),
        0
    );
    const minWidthBySize = widget?.size === "sm" ? 220 : widget?.size === "lg" ? 420 : 300;

    return {
        ...baseStyle,
        minWidth: `${Math.min(520, Math.max(minWidthBySize, maxRight + 8))}px`,
    };
};

export const estimateSectionHeight = (sectionId, size) => {
    if (sectionId === "stats") {
        return size === "lg" ? 120 : size === "sm" ? 78 : 96;
    }

    if (sectionId === "bio") {
        return size === "lg" ? 118 : size === "sm" ? 74 : 96;
    }

    return size === "lg" ? 72 : size === "sm" ? 52 : 62;
};
