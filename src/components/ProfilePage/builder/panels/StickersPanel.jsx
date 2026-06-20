import { STICKER_REGISTRY } from "../stickerRegistry";
import { MAX_STICKERS } from "../profileThemeConstants";

const StickersPanel = ({ theme, onAddSticker }) => {
    const count = theme.stickers.length;
    const atLimit = count >= MAX_STICKERS;

    return (
        <div className="pt-panel">
            <p className="pt-panel-hint">
                Tap a sticker to add it, then drag it around the preview. Remove with the × on each sticker.
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
