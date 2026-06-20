import { useRef } from "react";
import { STICKER_BY_ID } from "./stickerRegistry";

/**
 * Renders the decorative sticker layer over a profile surface.
 *
 * Read-only on live profiles; editable (drag to move, button to remove) inside
 * the builder preview. Positions are percentages of the surface so they scale
 * with the container.
 */
const StickerLayer = ({ stickers, editable = false, onChange, accentColor }) => {
    const layerRef = useRef(null);
    const dragState = useRef(null);

    if (!Array.isArray(stickers) || stickers.length === 0) {
        return null;
    }

    const handlePointerDown = (event, index) => {
        if (!editable) return;
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.setPointerCapture?.(event.pointerId);
        dragState.current = { index, pointerId: event.pointerId };
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

    const handleRemove = (event, index) => {
        event.preventDefault();
        event.stopPropagation();
        onChange?.(stickers.filter((_, i) => i !== index));
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
                return (
                    <div
                        key={`${sticker.id}-${index}`}
                        className={`pt-sticker${editable ? " is-editable" : ""}`}
                        style={{
                            left: `${sticker.x}%`,
                            top: `${sticker.y}%`,
                            "--pt-rot": `${sticker.rotation}deg`,
                            "--pt-scl": sticker.scale,
                        }}
                        onPointerDown={editable ? (e) => handlePointerDown(e, index) : undefined}
                        title={editable ? `${entry.label} — drag to move` : undefined}
                    >
                        <Glyph />
                        {editable && (
                            <button
                                type="button"
                                className="pt-sticker-remove"
                                onClick={(e) => handleRemove(e, index)}
                                onPointerDown={(e) => e.stopPropagation()}
                                aria-label={`Remove ${entry.label} sticker`}
                            >
                                ×
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default StickerLayer;
