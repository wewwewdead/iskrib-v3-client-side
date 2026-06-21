import "./profileLayout.css";
import { useQuery } from "@tanstack/react-query";
import { getVisibleOrderedLayoutBlocks } from "../builder/profileThemeUtils";
import { RENDERABLE_LAYOUT_BLOCK_TYPES } from "./profileLayoutUtils";
import { getProfilePreview } from "../../../../API/Api";
import ProfileLayoutBlock from "./ProfileLayoutBlock";

/**
 * Profile Builder V3A/V3B — Layout Composer renderer.
 *
 * Draws the user's configured content blocks (guestbook, writings, media,
 * opinions, stories, pinned) below the hero, in their chosen order/width/style,
 * with REAL lightweight content previews (V3B). Used by BOTH MyProfile and
 * Visitprofile. The full tabs/routes still live below this as "View all".
 *
 * Preview data is fetched ONCE per profile, cached by username (React Query,
 * 60s stale), and only when the layout actually contains a content block — so a
 * guestbook-only layout makes no preview request. Guestbook still renders exactly
 * once; deep-link props are forwarded only to it via `guestbookProps`.
 */
const ProfileLayoutRenderer = ({
    theme,
    isOwn = false,
    username,
    profileUserId,
    navigate,
    guestbookProps,
    onWriteJournal,
}) => {
    const blocks = getVisibleOrderedLayoutBlocks(theme).filter((b) =>
        RENDERABLE_LAYOUT_BLOCK_TYPES.includes(b.type)
    );

    const hasContentBlocks = blocks.some((b) => b.type !== "guestbook");

    const { data: preview, isLoading } = useQuery({
        queryKey: ["profilePreview", username],
        queryFn: () => getProfilePreview(username),
        enabled: !!username && hasContentBlocks,
        staleTime: 1000 * 60, // 60s — previews don't need to be real-time
        refetchOnWindowFocus: false,
    });

    if (blocks.length === 0) return null;

    return (
        <div className="profile-layout-grid" aria-label="Profile sections">
            {blocks.map((block) => (
                <ProfileLayoutBlock
                    key={block.id || block.type}
                    block={block}
                    theme={theme}
                    isOwn={isOwn}
                    username={username}
                    profileUserId={profileUserId}
                    navigate={navigate}
                    guestbookProps={block.type === "guestbook" ? guestbookProps : undefined}
                    preview={preview}
                    isPreviewLoading={isLoading && hasContentBlocks}
                    onWriteJournal={onWriteJournal}
                />
            ))}
        </div>
    );
};

export default ProfileLayoutRenderer;
