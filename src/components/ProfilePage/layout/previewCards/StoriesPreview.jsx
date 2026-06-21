import { resolveCount, storyStatusLabel, imageShapeClass, densityClass, excerpt } from "./previewUtils";

const CoverPlaceholder = () => (
    <span className="pl-story-cover-placeholder" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M4 5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16l-6-3-7 3V5Z" />
        </svg>
    </span>
);

/**
 * Real stories preview. Clicking a story opens its detail/reader route.
 *   - shelf:  horizontal cards (cover + title + status)
 *   - covers: larger cover-forward cards
 *   - compact: list rows (small cover + title + status)
 *
 * V3C content controls: count (3/4), density, imageShape (cover radius),
 * showMeta (status), showExcerpt (a short description on compact rows). Items are
 * pre-sorted by the block when the source is "popular".
 */
const StoriesPreview = ({
    items,
    variant = "shelf",
    onStoryClick,
    count,
    density = "comfortable",
    imageShape = "rounded",
    showMeta = true,
    showExcerpt = true,
}) => {
    const shown = items.slice(0, resolveCount(count, "stories", variant, 4));
    const shapeCls = imageShapeClass(imageShape);
    const densityCls = densityClass(density);
    const isCompact = variant === "compact";

    return (
        <div className={`pl-stories pl-stories--${variant} ${densityCls}`}>
            {shown.map((story) => (
                <button
                    key={story.id}
                    type="button"
                    className="pl-story"
                    onClick={() => onStoryClick(story.id)}
                    title={story.title}
                >
                    <span className={`pl-story-cover ${shapeCls}`}>
                        {story.cover_url ? (
                            <img src={story.cover_url} alt="" loading="lazy" />
                        ) : (
                            <CoverPlaceholder />
                        )}
                    </span>
                    <span className="pl-story-body">
                        <span className="pl-story-title">{story.title || "Untitled story"}</span>
                        {showExcerpt && isCompact && story.description && (
                            <span className="pl-story-desc">{excerpt(story.description, 80)}</span>
                        )}
                        {showMeta && storyStatusLabel(story.status) && (
                            <span className="pl-story-status">{storyStatusLabel(story.status)}</span>
                        )}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default StoriesPreview;
