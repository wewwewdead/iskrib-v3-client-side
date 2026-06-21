import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../Context/useAuth";
import { handleCLickContent, handleClickOpinion } from "../../../../helpers/handleClicks";
import {
    getUserJournals,
    getVisitedUserJournals,
    getPinnedJournals,
    getVisitedPinnedJournals,
    getProfileMedia,
    getVisitedProfileMedia,
    getUserOpinions,
    deleteJournal,
    deleteJournalImage,
} from "../../../../API/Api";
import { getUserStories } from "../../../../API/StoryApi";
import WritingsPreview from "./previewCards/WritingsPreview";
import MediaPreview from "./previewCards/MediaPreview";
import OpinionsPreview from "./previewCards/OpinionsPreview";
import StoriesPreview from "./previewCards/StoriesPreview";
import PreviewSkeleton from "./previewCards/PreviewSkeleton";
import PreviewEmptyState from "./previewCards/PreviewEmptyState";
import "./blockContentModal.css";

const PAGE = 12;

const TITLES = {
    writings: "Writings",
    pinned_writings: "Pinned writings",
    media: "Media",
    opinions: "Opinions",
    stories: "Stories",
};

const EMPTY_COPY = {
    writings: "No writings yet.",
    pinned_writings: "No pinned writings yet.",
    media: "No media shared yet.",
    opinions: "No opinions yet.",
    stories: "No stories yet.",
};

// Each list endpoint returns its items under a slightly different key (and
// pinned endpoints return a bare array).
const pageItems = (page) =>
    Array.isArray(page) ? page : page?.data || page?.stories || page?.opinions || [];

/**
 * Opens when a content block is clicked and shows ALL of that block's content
 * (writings / media / opinions / stories) in a scrollable modal — paginated via
 * the same public endpoints the full pages use. Clicking an item opens it.
 */
const BlockContentModal = ({ type, title, username, profileUserId, isOwn, onClose }) => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const token = session?.access_token;
    const loggedInUserId = session?.user?.id || null;
    const [lightbox, setLightbox] = useState(null);

    // Owner-only delete (writings / pinned writings). pendingDelete holds the item
    // awaiting confirmation; isDeleting/justDeleted drive the confirm UI.
    const canDelete = isOwn && (type === "writings" || type === "pinned_writings");
    const [pendingDelete, setPendingDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [justDeleted, setJustDeleted] = useState(false);

    const { ref: sentinelRef, inView } = useInView({ threshold: 0.1 });

    const queryFn = ({ pageParam }) => {
        switch (type) {
            case "writings":
                // user-scoped endpoints (NOT /journals, which is the global feed)
                return isOwn
                    ? getUserJournals(pageParam, PAGE, profileUserId, token)
                    : getVisitedUserJournals(pageParam, PAGE, profileUserId, loggedInUserId);
            case "pinned_writings":
                // pinned endpoints return ALL pins at once (no pagination)
                return isOwn
                    ? getPinnedJournals(token)
                    : getVisitedPinnedJournals(profileUserId, loggedInUserId);
            case "media":
                return isOwn
                    ? getProfileMedia(token, pageParam, PAGE)
                    : getVisitedProfileMedia(token, profileUserId, pageParam, PAGE);
            case "opinions":
                return getUserOpinions(pageParam, PAGE, profileUserId);
            case "stories":
                return getUserStories(profileUserId, token, PAGE, pageParam);
            default:
                return Promise.resolve({ data: [] });
        }
    };

    const getNextPageParam = (lastPage) => {
        if (type === "pinned_writings") return undefined; // returns everything at once
        if (type === "media") return lastPage?.hasMore ? (lastPage?.nextCursor ?? undefined) : undefined;
        if (!lastPage?.hasMore) return undefined;
        const arr = pageItems(lastPage);
        const last = arr[arr.length - 1];
        if (!last) return undefined;
        if (type === "opinions") return last.id ?? undefined;
        // writings / stories use a date cursor — emit ISO/Z so the "+00:00" in a
        // raw timestamptz can't be mangled into a space in the query string.
        return last.created_at ? new Date(last.created_at).toISOString() : last.id ?? undefined;
    };

    const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
        queryKey: ["blockContent", type, profileUserId],
        queryFn,
        initialPageParam: null,
        getNextPageParam,
        enabled: !!profileUserId,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && (lightbox ? setLightbox(null) : onClose());
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onClose, lightbox]);

    const rawItems = (data?.pages || []).flatMap(pageItems);
    const items =
        type === "media"
            ? rawItems.map((m) => ({
                  id: m.id,
                  title: "",
                  thumbnail_url: m.cardUrl || m.thumbnailUrl || m.url,
                  fullUrl: m.originalUrl || m.detailUrl || m.url,
              }))
            : rawItems;

    // ── Item click handlers (open the specific item) ──
    const openJournal = (e, item) => {
        handleCLickContent(navigate)(
            e, null, "", item.title,
            item.users?.id || profileUserId, item.users?.name, item.users?.image_url,
            item.created_at, item.id,
            item.has_liked, item.comment_count?.[0]?.count, item.has_bookmarked,
            item.like_count?.[0]?.count, item.bookmark_count?.[0]?.count,
            item.users?.badge, item.post_type
        );
        onClose();
    };
    const openOpinion = (e, item) => {
        handleClickOpinion(navigate)(e, item.id, profileUserId);
        onClose();
    };
    const openStory = (id) => {
        navigate(`/home/stories/${id}`);
        onClose();
    };
    const openMedia = (e, item) => setLightbox(item);

    // ── Owner delete ──
    // Remove a journal id from this block's cached pages (handles both the
    // {pages:[{data:[]}]} writings shape and the bare-array pinned shape).
    const removeFromCache = (queryKey, id) =>
        queryClient.setQueryData(queryKey, (old) => {
            if (!old || !Array.isArray(old.pages)) return old;
            return {
                ...old,
                pages: old.pages.map((page) =>
                    Array.isArray(page)
                        ? page.filter((j) => j?.id !== id)
                        : {
                              ...page,
                              data: Array.isArray(page?.data)
                                  ? page.data.filter((j) => j?.id !== id)
                                  : page?.data,
                          }
                ),
            };
        });

    const confirmDelete = async () => {
        if (!pendingDelete || isDeleting) return;
        const item = pendingDelete;
        const queryKey = ["blockContent", type, profileUserId];
        const previous = queryClient.getQueryData(queryKey);
        try {
            setIsDeleting(true);
            removeFromCache(queryKey, item.id); // optimistic

            const imgs = item.thumbnail_url ? [item.thumbnail_url] : null;
            const [deleteRes] = await Promise.allSettled([
                deleteJournal(item.id, token),
                imgs ? deleteJournalImage(token, imgs) : Promise.resolve(null),
            ]);
            if (deleteRes.status !== "fulfilled") {
                queryClient.setQueryData(queryKey, previous); // revert
                throw deleteRes.reason || new Error("failed to delete journal");
            }

            setJustDeleted(true);
            // Refresh this list + every other surface that shows the post.
            queryClient.invalidateQueries({ queryKey: ["blockContent", "writings", profileUserId] });
            queryClient.invalidateQueries({ queryKey: ["blockContent", "pinned_writings", profileUserId] });
            queryClient.invalidateQueries({ queryKey: ["profilePreview", username] });
            queryClient.invalidateQueries({ queryKey: ["userJournals"] });
            queryClient.invalidateQueries({ queryKey: ["journals"], refetchType: "none" });
            queryClient.invalidateQueries({ queryKey: ["visitedProfileJournals"], refetchType: "none" });
            queryClient.invalidateQueries({ queryKey: ["pinnedJournals"] });
            queryClient.invalidateQueries({ queryKey: ["userPinnedIds"] });

            setTimeout(() => {
                setIsDeleting(false);
                setJustDeleted(false);
                setPendingDelete(null);
            }, 1200);
        } catch (err) {
            console.error("Error deleting writing:", err);
            setIsDeleting(false);
        }
    };

    const renderBody = () => {
        if (isLoading) return <PreviewSkeleton type={type} />;
        if (isError) return <p className="pl-modal-msg">Couldn&apos;t load this right now.</p>;
        if (items.length === 0) return <PreviewEmptyState message={EMPTY_COPY[type] || "Nothing here yet."} />;

        const count = items.length;
        switch (type) {
            case "writings":
            case "pinned_writings":
                return (
                    <WritingsPreview
                        items={items}
                        variant="list"
                        onItemClick={openJournal}
                        count={count}
                        showExcerpt
                        showMeta
                        onDeleteItem={canDelete ? setPendingDelete : undefined}
                    />
                );
            case "media":
                return <MediaPreview items={items} variant="grid" onItemClick={openMedia} count={count} />;
            case "opinions":
                return <OpinionsPreview items={items} variant="cards" onItemClick={openOpinion} count={count} showExcerpt showMeta />;
            case "stories":
                return <StoriesPreview items={items} variant="shelf" onStoryClick={openStory} count={count} showMeta showExcerpt />;
            default:
                return null;
        }
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="pl-modal-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={onClose}
            >
                <motion.div
                    className="pl-modal pt-scope"
                    initial={{ opacity: 0, scale: 0.96, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 8 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <header className="pl-modal-head">
                        <h2 className="pl-modal-title">{title || TITLES[type] || "All content"}</h2>
                        <button type="button" className="pl-modal-close" onClick={onClose} aria-label="Close">
                            ×
                        </button>
                    </header>

                    <div className="pl-modal-body">
                        {renderBody()}
                        {items.length > 0 && hasNextPage && (
                            <div ref={sentinelRef} className="pl-modal-sentinel">
                                {isFetchingNextPage && <span className="pl-modal-loading">Loading…</span>}
                            </div>
                        )}
                    </div>
                </motion.div>

                {lightbox && (
                    <div className="pl-modal-lightbox" onClick={(e) => { e.stopPropagation(); setLightbox(null); }}>
                        <img src={lightbox.fullUrl || lightbox.thumbnail_url} alt="" className="pl-modal-lightbox-img" />
                    </div>
                )}

                {pendingDelete && (
                    <div
                        className="pl-modal-confirm-overlay"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isDeleting && !justDeleted) setPendingDelete(null);
                        }}
                    >
                        <div className="pl-modal-confirm" onClick={(e) => e.stopPropagation()}>
                            {justDeleted ? (
                                <p className="pl-modal-confirm-done">Post deleted</p>
                            ) : (
                                <>
                                    <h3 className="pl-modal-confirm-title">Delete this post?</h3>
                                    <p className="pl-modal-confirm-text">
                                        “{pendingDelete.title || "Untitled"}” will be permanently removed. This can&apos;t be undone.
                                    </p>
                                    <div className="pl-modal-confirm-actions">
                                        <button
                                            type="button"
                                            className="pl-modal-confirm-cancel"
                                            onClick={() => setPendingDelete(null)}
                                            disabled={isDeleting}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            className="pl-modal-confirm-delete"
                                            onClick={confirmDelete}
                                            disabled={isDeleting}
                                        >
                                            {isDeleting ? "Deleting…" : "Delete"}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default BlockContentModal;
