import { useRef } from "react";
import { STICKER_BY_ID, STICKER_SCALE_MIN, STICKER_SCALE_MAX } from "./stickerRegistry";

// At scale 1 a 34px sticker's corner sits ~24px from its center; the resize
// handle maps the pointer's distance-from-center to scale around that radius.
const BASE_CORNER_RADIUS = 24;
const clampScale = (s) => Math.min(STICKER_SCALE_MAX, Math.max(STICKER_SCALE_MIN, s));

/**
 * Renders the decorative sticker layer over a profile surface.
 *
 * Read-only on live profiles. In the builder it's fully editable: click to
 * select, drag to move, drag the corner handle to resize, × to remove, and the
 * Stickers panel edits the selected sticker's color/size/rotation. Positions are
 * percentages of the surface so they scale with the container.
 */
const StickerLayer = ({
    stickers,
    editable = false,
    onChange,
    accentColor,
    selectedIndex = -1,
    onSelectSticker,
}) => {
    const layerRef = useRef(null);
    const dragState = useRef(null);
    const resizeState = useRef(null);
    const rotateState = useRef(null);

    if (!Array.isArray(stickers) || stickers.length === 0) {
        return null;
    }

    const handlePointerDown = (event, index) => {
        if (!editable) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragState.current = { index, pointerId: event.pointerId };
        onSelectSticker?.(index);
    };

    const handlePointerMove = (event) => {
        if (!editable || !dragState.current) return;
        const layer = layerRef.current;
        if (!layer) return;
        const rect = layer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
        const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));

        const { index } = dragState.current;
        const next = stickers.map((sticker, i) =>
            i === index ? { ...sticker, x: Math.round(x), y: Math.round(y) } : sticker
        );
        onChange?.(next);
    };

    const endDrag = (event) => {
        if (dragState.current) {
            event.currentTarget.releasePointerCapture?.(dragState.current.pointerId);
            dragState.current = null;
        }
    };

    // ── Resize (drag the corner handle) ──
    const handleResizeDown = (event, index) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        resizeState.current = { index, pointerId: event.pointerId };
        onSelectSticker?.(index);
    };

    const handleResizeMove = (event) => {
        const st = resizeState.current;
        if (!st) return;
        const layer = layerRef.current;
        if (!layer) return;
        const rect = layer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const sticker = stickers[st.index];
        if (!sticker) return;
        const cx = rect.left + (sticker.x / 100) * rect.width;
        const cy = rect.top + (sticker.y / 100) * rect.height;
        const dist = Math.hypot(event.clientX - cx, event.clientY - cy);
        const scale = clampScale(dist / BASE_CORNER_RADIUS);

        const next = stickers.map((s, i) =>
            i === st.index ? { ...s, scale: Math.round(scale * 100) / 100 } : s
        );
        onChange?.(next);
    };

    const endResize = (event) => {
        if (resizeState.current) {
            event.currentTarget.releasePointerCapture?.(resizeState.current.pointerId);
            resizeState.current = null;
        }
    };

    // ── Rotate (drag the top knob) ──
    const handleRotateDown = (event, index) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        rotateState.current = { index, pointerId: event.pointerId };
        onSelectSticker?.(index);
    };

    const handleRotateMove = (event) => {
        const st = rotateState.current;
        if (!st) return;
        const layer = layerRef.current;
        if (!layer) return;
        const rect = layer.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const sticker = stickers[st.index];
        if (!sticker) return;
        const cx = rect.left + (sticker.x / 100) * rect.width;
        const cy = rect.top + (sticker.y / 100) * rect.height;
        // The knob sits at the sticker's top (12 o'clock) when rotation is 0, so
        // offset the pointer angle by 90° to get the rotation it represents.
        let deg = (Math.atan2(event.clientY - cy, event.clientX - cx) * 180) / Math.PI + 90;
        if (deg > 180) deg -= 360;
        if (deg < -180) deg += 360;

        const next = stickers.map((s, i) =>
            i === st.index ? { ...s, rotation: Math.round(deg) } : s
        );
        onChange?.(next);
    };

    const endRotate = (event) => {
        if (rotateState.current) {
            event.currentTarget.releasePointerCapture?.(rotateState.current.pointerId);
            rotateState.current = null;
        }
    };

    const handleRemove = (event, index) => {
        event.preventDefault();
        event.stopPropagation();
        onChange?.(stickers.filter((_, i) => i !== index));
        onSelectSticker?.(-1);
    };

    return (
        <div
            className="pt-sticker-layer"
            ref={layerRef}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            style={accentColor ? { "--pt-accent": accentColor } : undefined}
            aria-hidden="true"
        >
            {stickers.map((sticker, index) => {
                const entry = STICKER_BY_ID[sticker.id];
                if (!entry) return null;
                const Glyph = entry.Glyph;
                const selected = editable && index === selectedIndex;
                return (
                    <div
                        key={`${sticker.id}-${index}`}
                        className={`pt-sticker${editable ? " is-editable" : ""}${selected ? " is-selected" : ""}`}
                        style={{
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            "--pt-rot": `${sticker.rotation}deg`,
                            "--pt-scl": sticker.scale,
                            ...(sticker.color ? { color: sticker.color } : {}),
                        }}
                        onPointerDown={editable ? (e) => handlePointerDown(e, index) : undefined}
                        title={editable ? `${entry.label} — drag to move, click to edit` : undefined}
                    >
                        <Glyph />
                        {selected && (
                            <>
                                <button
                                    type="button"
                                    className="pt-sticker-remove"
                                    onClick={(e) => handleRemove(e, index)}
                                    onPointerDown={(e) => e.stopPropagation()}
                                    aria-label={`Remove ${entry.label} sticker`}
                                >
                                    ×
                                </button>
                                <span
                                    className="pt-sticker-resize"
                                    role="button"
                                    aria-label={`Resize ${entry.label} sticker`}
                                    title="Drag to resize"
                                    onPointerDown={(e) => handleResizeDown(e, index)}
                                    onPointerMove={handleResizeMove}
                                    onPointerUp={endResize}
                                    onPointerCancel={endResize}
                                />
                                <span
                                    className="pt-sticker-rotate"
                                    role="button"
                                    aria-label={`Rotate ${entry.label} sticker`}
                                    title="Drag to rotate"
                                    onPointerDown={(e) => handleRotateDown(e, index)}
                                    onPointerMove={handleRotateMove}
                                    onPointerUp={endRotate}
                                    onPointerCancel={endRotate}
                                />
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StickerLayer;
