import { resolveCount, imageShapeClass, densityClass } from "./previewUtils";

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
 *
 * V3C content controls: count (4/6), imageShape (rounded/square/soft), density
 * (tile gap), and showMeta (a small title caption on each tile).
 */
const MediaPreview = ({
    items,
    variant = "grid",
    onItemClick,
    count,
    density = "comfortable",
    imageShape = "rounded",
    showMeta = false,
}) => {
    const shown = items.slice(0, resolveCount(count, "media", variant, 6));
    const shapeCls = imageShapeClass(imageShape);
    const densityCls = densityClass(density);

    return (
        <div className={`pl-media pl-media--${variant} ${densityCls}`}>
            {shown.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className={`pl-media-tile ${shapeCls}`}
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
                    {showMeta && item.title && <span className="pl-media-caption">{item.title}</span>}
                </button>
            ))}
        </div>
    );
};

export default MediaPreview;
