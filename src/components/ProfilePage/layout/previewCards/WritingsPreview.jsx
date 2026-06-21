import { formatPreviewDate, excerpt, resolveCount, imageShapeClass, densityClass } from "./previewUtils";

const hideOnError = (e) => {
    e.currentTarget.style.display = "none";
};

const WritingRow = ({ item, onItemClick, showThumb = true, showExcerpt = true, showMeta = true, shapeCls }) => (
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
}) => {
    const shown = items.slice(0, resolveCount(count, "writings", variant, 3));
    const shapeCls = imageShapeClass(imageShape);
    const densityCls = densityClass(density);

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
                />
            ))}
        </div>
    );
};

export default WritingsPreview;
