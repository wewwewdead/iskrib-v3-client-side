import { formatPreviewDate, excerpt, resolveCount, densityClass } from "./previewUtils";

/**
 * Real opinions preview. Clicking an item opens the existing opinion viewer.
 *   - cards:   normal opinion cards
 *   - compact: tight rows
 *   - debate:  stronger, question-forward styling
 *
 * V3C content controls: count (2/3), density, showExcerpt (the opinion text),
 * showMeta (date + reply count). Items are pre-sorted by the block when the
 * source is "most_discussed".
 */
const OpinionsPreview = ({
    items,
    variant = "cards",
    onItemClick,
    count,
    density = "comfortable",
    showExcerpt = true,
    showMeta = true,
}) => {
    const shown = items.slice(0, resolveCount(count, "opinions", variant, 3));
    const densityCls = densityClass(density);
    const compactText = variant === "compact" || density === "compact";
    const max = compactText ? 120 : 200;

    return (
        <div className={`pl-opinions pl-opinions--${variant} ${densityCls}`}>
            {shown.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className="pl-opinion"
                    onClick={(e) => onItemClick(e, item)}
                >
                    {variant === "debate" && <span className="pl-opinion-mark" aria-hidden="true">“</span>}
                    {showExcerpt && <span className="pl-opinion-text">{excerpt(item.opinion, max)}</span>}
                    {showMeta && (
                        <span className="pl-opinion-meta">
                            <span className="pl-opinion-date">{formatPreviewDate(item.created_at)}</span>
                            {item.reply_count > 0 && (
                                <span className="pl-opinion-replies">
                                    {item.reply_count} {item.reply_count === 1 ? "reply" : "replies"}
                                </span>
                            )}
                        </span>
                    )}
                </button>
            ))}
        </div>
    );
};

export default OpinionsPreview;
