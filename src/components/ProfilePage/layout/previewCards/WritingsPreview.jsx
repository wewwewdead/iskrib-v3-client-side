import { formatPreviewDate, excerpt, displayCount } from "./previewUtils";

const hideOnError = (e) => {
    e.currentTarget.style.display = "none";
};

const WritingRow = ({ item, onItemClick, showThumb = true, showExcerpt = true }) => (
    <button type="button" className="pl-writing-row" onClick={(e) => onItemClick(e, item)}>
        {showThumb && item.thumbnail_url && (
            <img
                className="pl-writing-thumb"
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
            <span className="pl-writing-date">{formatPreviewDate(item.created_at)}</span>
        </span>
    </button>
);

/**
 * Real writings preview. Used for both the `writings` and `pinned_writings`
 * blocks (the block maps its variant to one of editorial/list/compact).
 *   - editorial: a larger lead item (serif excerpt) + smaller rows beneath
 *   - list:      stacked rows with thumb + one-line excerpt
 *   - compact:   tight title + date rows
 */
const WritingsPreview = ({ items, variant = "editorial", onItemClick }) => {
    const shown = items.slice(0, displayCount("writings", variant, 3));

    if (variant === "editorial" && shown.length > 0) {
        const [lead, ...rest] = shown;
        return (
            <div className="pl-writings pl-writings--editorial">
                <button type="button" className="pl-writing-lead" onClick={(e) => onItemClick(e, lead)}>
                    {lead.thumbnail_url && (
                        <img
                            className="pl-writing-lead-thumb"
                            src={lead.thumbnail_url}
                            alt=""
                            loading="lazy"
                            onError={hideOnError}
                        />
                    )}
                    <span className="pl-writing-lead-title">{lead.title || "Untitled"}</span>
                    {lead.preview_text && (
                        <span className="pl-writing-lead-excerpt">{excerpt(lead.preview_text, 180)}</span>
                    )}
                    <span className="pl-writing-date">{formatPreviewDate(lead.created_at)}</span>
                </button>
                {rest.length > 0 && (
                    <div className="pl-writing-rest">
                        {rest.map((item) => (
                            <WritingRow key={item.id} item={item} onItemClick={onItemClick} showThumb={false} showExcerpt={false} />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const compact = variant === "compact";
    return (
        <div className={`pl-writings pl-writings--${compact ? "compact" : "list"}`}>
            {shown.map((item) => (
                <WritingRow
                    key={item.id}
                    item={item}
                    onItemClick={onItemClick}
                    showThumb={!compact}
                    showExcerpt={!compact}
                />
            ))}
        </div>
    );
};

export default WritingsPreview;
