import {
    STICKER_REGISTRY,
    STICKER_BY_ID,
    STICKER_COLORS,
    STICKER_SCALE_MIN,
    STICKER_SCALE_MAX,
} from "../stickerRegistry";
import { MAX_STICKERS } from "../profileThemeConstants";
import { isHexColor } from "../profileThemeUtils";

/**
 * Editor for the currently-selected sticker: color, size and rotation. Shown
 * when a sticker is clicked on the canvas. Writes go to that sticker only.
 */
const SelectedStickerEditor = ({ index, sticker, onUpdate, onRemove, onDeselect }) => {
    const entry = STICKER_BY_ID[sticker.id];
    const label = entry?.label || "Sticker";

    return (
        <div className="pt-sticker-editor">
            <div className="pt-cards-scope">
                <span className="pt-cards-scope-label">
                    Editing <strong>{label}</strong>
                </span>
                <button type="button" className="pt-cards-scope-btn" onClick={onDeselect}>
                    Done
                </button>
            </div>

            <div className="pt-field">
                <span className="pt-field-label">Color</span>
                <div className="pt-sticker-color-row" role="group" aria-label="Sticker color">
                    {STICKER_COLORS.map((c) => {
                        const active = (sticker.color || null) === c.value;
                        return (
                            <button
                                key={c.label}
                                type="button"
                                className={`pt-sticker-color${active ? " is-active" : ""}${c.value === null ? " pt-sticker-color--accent" : ""}`}
                                style={c.value ? { background: c.value } : undefined}
                                aria-label={c.label}
                                aria-pressed={active}
                                title={c.label}
                                onClick={() => onUpdate(index, c.value ? { color: c.value } : { color: undefined })}
                            />
                        );
                    })}
                    <label className="pt-sticker-color pt-sticker-color--custom" title="Custom color">
                        <input
                            type="color"
                            value={isHexColor(sticker.color) ? sticker.color : "#d4a853"}
                            onChange={(e) => onUpdate(index, { color: e.target.value })}
                            aria-label="Custom sticker color"
                        />
                    </label>
                </div>
            </div>

            <div className="pt-field">
                <span className="pt-field-label">
                    Size <span className="pt-sticker-val">{Math.round(sticker.scale * 100)}%</span>
                </span>
                <input
                    type="range"
                    min={STICKER_SCALE_MIN}
                    max={STICKER_SCALE_MAX}
                    step="0.1"
                    value={sticker.scale}
                    onChange={(e) => onUpdate(index, { scale: Number(e.target.value) })}
                    aria-label="Sticker size"
                />
            </div>

            <div className="pt-field">
                <span className="pt-field-label">
                    Rotation <span className="pt-sticker-val">{Math.round(sticker.rotation)}°</span>
                </span>
                <input
                    type="range"
                    min={-180}
                    max={180}
                    step="5"
                    value={sticker.rotation}
                    onChange={(e) => onUpdate(index, { rotation: Number(e.target.value) })}
                    aria-label="Sticker rotation"
                />
            </div>

            <button type="button" className="pt-sticker-delete" onClick={() => onRemove(index)}>
                Remove sticker
            </button>
        </div>
    );
};

const StickersPanel = ({
    theme,
    onAddSticker,
    selectedIndex = -1,
    selectedSticker,
    onUpdateSticker,
    onRemoveSticker,
    onDeselect,
}) => {
    const count = theme.stickers.length;
    const atLimit = count >= MAX_STICKERS;

    return (
        <div className="pt-panel">
            {selectedSticker && (
                <SelectedStickerEditor
                    index={selectedIndex}
                    sticker={selectedSticker}
                    onUpdate={onUpdateSticker}
                    onRemove={onRemoveSticker}
                    onDeselect={onDeselect}
                />
            )}

            <p className="pt-panel-hint">
                Tap a sticker to add it. Click one on the preview to move, resize (corner handle)
                or recolor it.
            </p>
            <div className="pt-sticker-count">
                {count} / {MAX_STICKERS} stickers
            </div>
            <div className="pt-sticker-palette">
                {STICKER_REGISTRY.map((sticker) => {
                    const Glyph = sticker.Glyph;
                    return (
                        <button
                            key={sticker.id}
                            type="button"
                            className="pt-sticker-swatch"
                            disabled={atLimit}
                            onClick={() => onAddSticker(sticker.id)}
                            aria-label={`Add ${sticker.label} sticker`}
                            title={sticker.label}
                        >
                            <Glyph />
                        </button>
                    );
                })}
            </div>
            {atLimit && <p className="pt-panel-hint pt-warn">You've reached the maximum of {MAX_STICKERS} stickers.</p>}
        </div>
    );
};

export default StickersPanel;
