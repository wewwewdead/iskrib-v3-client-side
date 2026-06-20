import { displayCount } from "./previewUtils";

const hideOnError = (e) => {
    const tile = e.currentTarget.closest(".pl-media-tile");
    if (tile) tile.style.display = "none";
};

/**
 * Real media preview — thumbnails pulled from the user's recent public posts.
 * Clicking a thumbnail opens its source post in the content viewer.
 *   - grid:    even thumbnail grid
 *   - collage: one large lead + smaller thumbs
 *   - strip:   horizontal scroll row
 */
const MediaPreview = ({ items, variant = "grid", onItemClick }) => {
    const shown = items.slice(0, displayCount("media", variant, 6));

    return (
        <div className={`pl-media pl-media--${variant}`}>
            {shown.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className="pl-media-tile"
                    onClick={(e) => onItemClick(e, item)}
                    title={item.title || "View post"}
                    aria-label={item.title ? `View "${item.title}"` : "View post"}
                >
                    <img
                        className="pl-media-img"
                        src={item.thumbnail_url}
                        alt={item.title || ""}
                        loading="lazy"
                        onError={hideOnError}
                    />
                </button>
            ))}
        </div>
    );
};

export default MediaPreview;
