import { useState } from "react";
import ProfileGuestbook from "../guestbook/ProfileGuestbook";
import { blockWidthClass, blockStyleClass } from "./profileLayoutUtils";
import { getBlockContent, getBlockCardCssVars } from "../builder/profileThemeUtils";
import BlockContentModal from "./BlockContentModal";
import WritingsPreview from "./previewCards/WritingsPreview";
import MediaPreview from "./previewCards/MediaPreview";
import OpinionsPreview from "./previewCards/OpinionsPreview";
import StoriesPreview from "./previewCards/StoriesPreview";
import PreviewEmptyState from "./previewCards/PreviewEmptyState";
import PreviewSkeleton from "./previewCards/PreviewSkeleton";
import { EMPTY_STATE_COPY, resolveBlockItems } from "./previewCards/previewUtils";

/**
 * Renders a single configured layout block with REAL lightweight content (V3B).
 * Guestbook renders the real ProfileGuestbook; the other blocks render a small
 * preview of the user's public writings/media/opinions/stories and link to the
 * full route. Loading shows a skeleton; empty shows a calm state (owner gets a
 * gentle creation CTA); a failed fetch degrades to the empty state — never a crash.
 */
const ProfileLayoutBlock = ({
    block,
    theme,
    isOwn,
    username,
    profileUserId,
    navigate,
    guestbookProps,
    preview,
    isPreviewLoading,
    onWriteJournal,
}) => {
    const [showModal, setShowModal] = useState(false);
    const widthCls = blockWidthClass(block.width);
    const content = getBlockContent(block);
    // A per-block card override sets its own --pt-card-* vars and renders as the
    // inherit surface (so it reads them); otherwise the block uses its own style
    // preset and the page-wide vars from the profile scope.
    const cardVars = getBlockCardCssVars(theme, block);
    const styleCls = cardVars ? "pl-block--inherit" : blockStyleClass(block.style);

    if (block.type === "guestbook") {
        // variant "wall" = fuller list; "compact" = condensed near-hero view.
        // content.count controls how many notes show before "view all".
        return (
            <div className={`pl-block pl-block--guestbook ${widthCls}`} style={cardVars || undefined}>
                <ProfileGuestbook
                    username={username}
                    profileUserId={profileUserId}
                    compact={block.variant !== "wall"}
                    initialVisibleCount={content.count}
                    density={content.density}
                    showMeta={content.showMeta}
                    {...(guestbookProps || {})}
                />
            </div>
        );
    }

    // The whole content block is one click target: clicking it (a card, the
    // header, or "View all") opens a modal showing ALL of that block's content.
    const openModal = () => setShowModal(true);

    // Resolve the items for this block, applying V3C source controls (shared with
    // the builder preview via resolveBlockItems so the two never drift).
    const items = resolveBlockItems(block.type, content.source, preview);

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
                return (
                    <WritingsPreview
                        items={items}
                        variant={block.variant}
                        onItemClick={openModal}
                        count={content.count}
                        density={content.density}
                        imageShape={content.imageShape}
                        showExcerpt={content.showExcerpt}
                        showMeta={content.showMeta}
                    />
                );
            case "pinned_writings":
                // pinned variants (featured/compact) → writings layouts (editorial/compact)
                return (
                    <WritingsPreview
                        items={items}
                        variant={block.variant === "compact" ? "compact" : "editorial"}
                        onItemClick={openModal}
                        count={content.count}
                        density={content.density}
                        imageShape={content.imageShape}
                        showExcerpt={content.showExcerpt}
                        showMeta={content.showMeta}
                    />
                );
            case "media":
                return (
                    <MediaPreview
                        items={items}
                        variant={block.variant}
                        onItemClick={openModal}
                        count={content.count}
                        density={content.density}
                        imageShape={content.imageShape}
                        showMeta={content.showMeta}
                    />
                );
            case "opinions":
                return (
                    <OpinionsPreview
                        items={items}
                        variant={block.variant}
                        onItemClick={openModal}
                        count={content.count}
                        density={content.density}
                        showExcerpt={content.showExcerpt}
                        showMeta={content.showMeta}
                    />
                );
            case "stories":
                return (
                    <StoriesPreview
                        items={items}
                        variant={block.variant}
                        onStoryClick={openModal}
                        count={content.count}
                        density={content.density}
                        imageShape={content.imageShape}
                        showMeta={content.showMeta}
                        showExcerpt={content.showExcerpt}
                    />
                );
            default:
                return null;
        }
    };

    const hasContent = items.length > 0 && !isPreviewLoading;

    return (
        <>
            <section
                className={`pl-block pl-block--content ${widthCls} ${styleCls}`}
                aria-label={block.title}
                style={cardVars || undefined}
                onClick={hasContent ? openModal : undefined}
                role={hasContent ? "button" : undefined}
                tabIndex={hasContent ? 0 : undefined}
                onKeyDown={hasContent ? (e) => (e.key === "Enter" || e.key === " ") && openModal() : undefined}
            >
                <div className="pl-block-head">
                    <h3 className="pl-block-title">{block.title}</h3>
                    {hasContent && (
                        <button
                            type="button"
                            className="pl-block-viewall"
                            onClick={(e) => {
                                e.stopPropagation();
                                openModal();
                            }}
                        >
                            View all
                            <span aria-hidden="true"> →</span>
                        </button>
                    )}
                </div>
                {renderBody()}
            </section>

            {showModal && (
                <BlockContentModal
                    type={block.type}
                    title={block.title}
                    username={username}
                    profileUserId={profileUserId}
                    isOwn={isOwn}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    );
};

export default ProfileLayoutBlock;
