import ProfileGuestbook from "../guestbook/ProfileGuestbook";
import { handleCLickContent, handleClickOpinion } from "../../../../helpers/handleClicks";
import { getBlockRoute, blockWidthClass, blockStyleClass } from "./profileLayoutUtils";
import WritingsPreview from "./previewCards/WritingsPreview";
import MediaPreview from "./previewCards/MediaPreview";
import OpinionsPreview from "./previewCards/OpinionsPreview";
import StoriesPreview from "./previewCards/StoriesPreview";
import PreviewEmptyState from "./previewCards/PreviewEmptyState";
import PreviewSkeleton from "./previewCards/PreviewSkeleton";
import { EMPTY_STATE_COPY } from "./previewCards/previewUtils";

/**
 * Renders a single configured layout block with REAL lightweight content (V3B).
 * Guestbook renders the real ProfileGuestbook; the other blocks render a small
 * preview of the user's public writings/media/opinions/stories and link to the
 * full route. Loading shows a skeleton; empty shows a calm state (owner gets a
 * gentle creation CTA); a failed fetch degrades to the empty state — never a crash.
 */
const ProfileLayoutBlock = ({
    block,
    isOwn,
    username,
    profileUserId,
    navigate,
    guestbookProps,
    preview,
    isPreviewLoading,
    onWriteJournal,
}) => {
    const widthCls = blockWidthClass(block.width);

    if (block.type === "guestbook") {
        // variant "wall" = full list; "compact" = condensed near-hero view.
        return (
            <div className={`pl-block pl-block--guestbook ${widthCls}`}>
                <ProfileGuestbook
                    username={username}
                    profileUserId={profileUserId}
                    compact={block.variant !== "wall"}
                    {...(guestbookProps || {})}
                />
            </div>
        );
    }

    const route = getBlockRoute(block.type, { isOwn, username });
    const author = preview?.user || { id: profileUserId };

    // Reuse the app's existing navigation helpers so previews open the exact same
    // content viewer / opinion viewer / story reader the rest of the app uses.
    const clickContent = handleCLickContent(navigate);
    const clickOpinion = handleClickOpinion(navigate);

    const openJournal = (e, item) =>
        clickContent(
            e,
            null, // content fetched on demand by the viewer when state lacks it
            "",
            item.title,
            author.id,
            author.name,
            author.image_url,
            item.created_at,
            item.id,
            false,
            0,
            false,
            0,
            0,
            author.badge,
            item.post_type || null
        );
    const openOpinion = (e, item) => clickOpinion(e, item.id, author.id);
    const openStory = (id) => navigate?.(`/home/stories/${id}`);

    const dataByType = {
        writings: preview?.writings,
        media: preview?.media,
        opinions: preview?.opinions,
        stories: preview?.stories,
        pinned_writings: preview?.pinnedWritings,
    };
    const items = dataByType[block.type] || [];

    const ownerAction = () => {
        switch (block.type) {
            case "writings":
            case "media":
                return onWriteJournal?.();
            case "opinions":
                return navigate?.("/home/opinions");
            case "stories":
                return navigate?.("/home/stories/new");
            default:
                return undefined;
        }
    };

    const renderBody = () => {
        if (isPreviewLoading) return <PreviewSkeleton type={block.type} />;

        if (items.length === 0) {
            const copy = EMPTY_STATE_COPY[block.type] || { message: "Nothing here yet." };
            const showCta = isOwn && !!copy.ownerCta;
            return (
                <PreviewEmptyState
                    message={copy.message}
                    hint={isOwn ? copy.ownerHint : undefined}
                    actionLabel={showCta ? copy.ownerCta : undefined}
                    onAction={showCta ? ownerAction : undefined}
                />
            );
        }

        switch (block.type) {
            case "writings":
                return <WritingsPreview items={items} variant={block.variant} onItemClick={openJournal} />;
            case "pinned_writings":
                // pinned variants (featured/compact) → writings layouts (editorial/compact)
                return (
                    <WritingsPreview
                        items={items}
                        variant={block.variant === "compact" ? "compact" : "editorial"}
                        onItemClick={openJournal}
                    />
                );
            case "media":
                return <MediaPreview items={items} variant={block.variant} onItemClick={openJournal} />;
            case "opinions":
                return <OpinionsPreview items={items} variant={block.variant} onItemClick={openOpinion} />;
            case "stories":
                return <StoriesPreview items={items} variant={block.variant} onStoryClick={openStory} />;
            default:
                return null;
        }
    };

    return (
        <section
            className={`pl-block pl-block--content ${widthCls} ${blockStyleClass(block.style)}`}
            aria-label={block.title}
        >
            <div className="pl-block-head">
                <h3 className="pl-block-title">{block.title}</h3>
                {route && (
                    <button type="button" className="pl-block-viewall" onClick={() => navigate?.(route)}>
                        View all
                        <span aria-hidden="true"> →</span>
                    </button>
                )}
            </div>
            {renderBody()}
        </section>
    );
};

export default ProfileLayoutBlock;
