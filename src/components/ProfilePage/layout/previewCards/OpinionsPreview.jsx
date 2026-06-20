import { formatPreviewDate, excerpt, displayCount } from "./previewUtils";

/**
 * Real opinions preview. Clicking an item opens the existing opinion viewer.
 *   - cards:   normal opinion cards
 *   - compact: tight rows
 *   - debate:  stronger, question-forward styling
 */
const OpinionsPreview = ({ items, variant = "cards", onItemClick }) => {
    const shown = items.slice(0, displayCount("opinions", variant, 3));
    const max = variant === "compact" ? 120 : 200;

    return (
        <div className={`pl-opinions pl-opinions--${variant}`}>
            {shown.map((item) => (
                <button
                    key={item.id}
                    type="button"
                    className="pl-opinion"
                    onClick={(e) => onItemClick(e, item)}
                >
                    {variant === "debate" && <span className="pl-opinion-mark" aria-hidden="true">“</span>}
                    <span className="pl-opinion-text">{excerpt(item.opinion, max)}</span>
                    <span className="pl-opinion-meta">
                        <span className="pl-opinion-date">{formatPreviewDate(item.created_at)}</span>
                        {item.reply_count > 0 && (
                            <span className="pl-opinion-replies">
                                {item.reply_count} {item.reply_count === 1 ? "reply" : "replies"}
                            </span>
                        )}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default OpinionsPreview;
