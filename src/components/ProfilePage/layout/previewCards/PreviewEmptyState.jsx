/**
 * Calm, compact empty state for a content block. Owners get a gentle creation
 * CTA (or a hint); visitors just see the calm text. Never large or loud.
 */
const PreviewEmptyState = ({ message, hint, actionLabel, onAction }) => (
    <div className="pl-empty">
        <p className="pl-empty-text">{message}</p>
        {hint && <p className="pl-empty-hint">{hint}</p>}
        {actionLabel && onAction && (
            <button type="button" className="pl-empty-cta" onClick={onAction}>
                {actionLabel}
            </button>
        )}
    </div>
);

export default PreviewEmptyState;
