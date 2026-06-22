import { useEffect, useState } from "react";
import { resolveCount, imageShapeClass, densityClass } from "./previewUtils";

const hideOnError = (e) => {
    const tile = e.currentTarget.closest(".pl-media-tile-wrap") || e.currentTarget.closest(".pl-media-tile");
    if (tile) tile.style.display = "none";
};

const KebabIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="5" r="1.8" />
        <circle cx="12" cy="12" r="1.8" />
        <circle cx="12" cy="19" r="1.8" />
    </svg>
);

const TrashIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 11V17M14 11V17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M6 7V18C6 19.657 7.343 21 9 21H15C16.657 21 18 19.657 18 18V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 5C9 3.895 9.895 3 11 3H13C14.105 3 15 3.895 15 5V7H9V5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const MediaTileButton = ({ item, shapeCls, onItemClick, showMeta }) => (
    <button
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
);

/**
 * Real media preview — thumbnails pulled from the user's recent public posts.
 * Clicking a thumbnail opens its source post in the content viewer.
 *   - grid:    even thumbnail grid
 *   - collage: one large lead + smaller thumbs
 *   - strip:   horizontal scroll row
 *
 * V3C content controls: count (4/6), imageShape (rounded/square/soft), density
 * (tile gap), and showMeta (a small title caption on each tile).
 *
 * When `onDeleteItem` is supplied (owner viewing their own media in the full
 * modal), each tile gets a settings (kebab) menu with a Delete action.
 */
const MediaPreview = ({
    items,
    variant = "grid",
    onItemClick,
    count,
    density = "comfortable",
    imageShape = "rounded",
    showMeta = false,
    onDeleteItem,
}) => {
    const shown = items.slice(0, resolveCount(count, "media", variant, 6));
    const shapeCls = imageShapeClass(imageShape);
    const densityCls = densityClass(density);

    // Which tile's settings menu is open (by item id). One menu at a time; any
    // outside click closes it.
    const [menuFor, setMenuFor] = useState(null);
    useEffect(() => {
        if (!menuFor) return undefined;
        const close = () => setMenuFor(null);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, [menuFor]);
    const toggleMenu = (it) => setMenuFor((cur) => (it && cur !== it.id ? it.id : null));

    return (
        <div className={`pl-media pl-media--${variant} ${densityCls}`}>
            {shown.map((item) =>
                onDeleteItem ? (
                    <div key={item.id} className="pl-media-tile-wrap">
                        <MediaTileButton item={item} shapeCls={shapeCls} onItemClick={onItemClick} showMeta={showMeta} />
                        <div className="pl-media-menu-wrap">
                            <button
                                type="button"
                                className="pl-media-menu-btn"
                                aria-label="Image settings"
                                aria-haspopup="menu"
                                aria-expanded={menuFor === item.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMenu(item);
                                }}
                            >
                                <KebabIcon />
                            </button>
                            {menuFor === item.id && (
                                <div className="pl-media-menu" role="menu">
                                    <button
                                        type="button"
                                        role="menuitem"
                                        className="pl-media-menu-item pl-media-menu-item--danger"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleMenu(null);
                                            onDeleteItem(item);
                                        }}
                                    >
                                        <TrashIcon />
                                        Delete image
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <MediaTileButton key={item.id} item={item} shapeCls={shapeCls} onItemClick={onItemClick} showMeta={showMeta} />
                )
            )}
        </div>
    );
};

export default MediaPreview;
