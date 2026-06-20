/**
 * Lightweight loading skeleton while the profile preview is fetched. Mirrors the
 * rough shape of each block type so the layout doesn't jump when data lands.
 */
const PreviewSkeleton = ({ type }) => {
    if (type === "media") {
        return (
            <div className="pl-skeleton pl-skeleton-media" aria-hidden="true">
                {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="pl-skeleton-tile" />
                ))}
            </div>
        );
    }

    if (type === "stories") {
        return (
            <div className="pl-skeleton pl-skeleton-stories" aria-hidden="true">
                {Array.from({ length: 3 }).map((_, i) => (
                    <span key={i} className="pl-skeleton-cover" />
                ))}
            </div>
        );
    }

    return (
        <div className="pl-skeleton pl-skeleton-rows" aria-hidden="true">
            {Array.from({ length: 2 }).map((_, i) => (
                <span key={i} className="pl-skeleton-row" />
            ))}
        </div>
    );
};

export default PreviewSkeleton;
