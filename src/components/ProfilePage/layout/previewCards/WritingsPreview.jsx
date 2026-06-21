import { useEffect, useState } from "react";
import { formatPreviewDate, excerpt, resolveCount, imageShapeClass, densityClass } from "./previewUtils";

const hideOnError = (e) => {
    e.currentTarget.style.display = "none";
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

const WritingRow = ({
    item,
    onItemClick,
    showThumb = true,
    showExcerpt = true,
    showMeta = true,
    shapeCls,
    onDeleteItem,
    menuOpen,
    onToggleMenu,
}) => (
    <div className={`pl-writing-row-wrap${onDeleteItem ? " pl-writing-row-wrap--has-menu" : ""}`}>
        <button type="button" className="pl-writing-row" onClick={(e) => onItemClick(e, item)}>
            {showThumb && item.thumbnail_url && (
                <img
                    className={`pl-writing-thumb ${shapeCls}`}
                    src={item.thumbnail_url}
                    alt=""
                    loading="lazy"
                    onError={hideOnError}
                />
            )}
            <span className="pl-writing-body">
                <span className="pl-writing-title">{item.title || "Untitled"}</span>
                {showExcerpt && item.preview_text && (
                    <span className="pl-writing-excerpt">{excerpt(item.preview_text, 110)}</span>
                )}
                {showMeta && <span className="pl-writing-date">{formatPreviewDate(item.created_at)}</span>}
            </span>
        </button>

        {onDeleteItem && (
            <div className="pl-writing-menu-wrap">
                <button
                    type="button"
                    className="pl-writing-menu-btn"
                    aria-label="Post settings"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleMenu(item);
                    }}
                >
                    <KebabIcon />
                </button>
                {menuOpen && (
                    <div className="pl-writing-menu" role="menu">
                        <button
                            type="button"
                            role="menuitem"
                            className="pl-writing-menu-item pl-writing-menu-item--danger"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleMenu(null);
                                onDeleteItem(item);
                            }}
                        >
                            <TrashIcon />
                            Delete post
                        </button>
                    </div>
                )}
            </div>
        )}
    </div>
);

/**
 * Real writings preview. Used for both the `writings` and `pinned_writings`
 * blocks (the block maps its variant to one of editorial/list/compact).
 *   - editorial: a larger lead item (serif excerpt) + smaller rows beneath
 *   - list:      stacked rows with thumb + one-line excerpt
 *   - compact:   tight title + date rows
 *
 * V3C content controls (count / density / imageShape / showExcerpt / showMeta)
 * tune how many items, how dense, how visual, and whether excerpt/meta show.
 *
 * When `onDeleteItem` is supplied (owner viewing their own writings in the full
 * modal), each row gets a settings (kebab) menu with a Delete action.
 */
const WritingsPreview = ({
    items,
    variant = "editorial",
    onItemClick,
    count,
    density = "comfortable",
    imageShape = "rounded",
    showExcerpt = true,
    showMeta = true,
    onDeleteItem,
}) => {
    const shown = items.slice(0, resolveCount(count, "writings", variant, 3));
    const shapeCls = imageShapeClass(imageShape);
    const densityCls = densityClass(density);

    // Which row's settings menu is open (by item id). Single menu open at a time;
    // any outside click closes it.
    const [menuFor, setMenuFor] = useState(null);
    useEffect(() => {
        if (!menuFor) return undefined;
        const close = () => setMenuFor(null);
        window.addEventListener("click", close);
        return () => window.removeEventListener("click", close);
    }, [menuFor]);
    const toggleMenu = (it) => setMenuFor((cur) => (it && cur !== it.id ? it.id : null));

    if (variant === "editorial" && shown.length > 0) {
        const [lead, ...rest] = shown;
        return (
            <div className={`pl-writings pl-writings--editorial ${densityCls}`}>
                <button type="button" className="pl-writing-lead" onClick={(e) => onItemClick(e, lead)}>
                    {lead.thumbnail_url && (
                        <img
                            className={`pl-writing-lead-thumb ${shapeCls}`}
                            src={lead.thumbnail_url}
                            alt=""
                            loading="lazy"
                            onError={hideOnError}
                        />
                    )}
                    <span className="pl-writing-lead-title">{lead.title || "Untitled"}</span>
                    {showExcerpt && lead.preview_text && (
                        <span className="pl-writing-lead-excerpt">{excerpt(lead.preview_text, 180)}</span>
                    )}
                    {showMeta && <span className="pl-writing-date">{formatPreviewDate(lead.created_at)}</span>}
                </button>
                {rest.length > 0 && (
                    <div className="pl-writing-rest">
                        {rest.map((item) => (
                            <WritingRow
                                key={item.id}
                                item={item}
                                onItemClick={onItemClick}
                                showThumb={false}
                                showExcerpt={false}
                                showMeta={showMeta}
                                shapeCls={shapeCls}
                                onDeleteItem={onDeleteItem}
                                menuOpen={menuFor === item.id}
                                onToggleMenu={toggleMenu}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const compact = variant === "compact";
    return (
        <div className={`pl-writings pl-writings--${compact ? "compact" : "list"} ${densityCls}`}>
            {shown.map((item) => (
                <WritingRow
                    key={item.id}
                    item={item}
                    onItemClick={onItemClick}
                    showThumb={!compact}
                    showExcerpt={!compact && showExcerpt}
                    showMeta={showMeta}
                    shapeCls={shapeCls}
                    onDeleteItem={onDeleteItem}
                    menuOpen={menuFor === item.id}
                    onToggleMenu={toggleMenu}
                />
            ))}
        </div>
    );
};

export default WritingsPreview;
