import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import "./profileGuestbook.css";
import { useAuth } from "../../../Context/useAuth";
import { getProfileGuestbook, createGuestbookEntry, deleteGuestbookEntry } from "../../../../API/Api";
import VerifiedBadge from "../../Badge/VerifiedBadge";
import { useToast } from "../../Toast/ToastContext";
import IskribButton from "../../../design/ui/IskribButton";

const MAX_LENGTH = 280;
const COMPACT_VISIBLE_COUNT = 3;

const formatDate = (iso) => {
    if (!iso) return "";
    try {
        return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return "";
    }
};

const ProfileGuestbook = ({
    username,
    profileUserId,
    compact = false,
    focusGuestbook = false,
    highlightEntryId = null,
    highlightFromUserId = null,
}) => {
    const { session, user, openAuthModal } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [message, setMessage] = useState("");

    const sectionRef = useRef(null);
    const [highlightedId, setHighlightedId] = useState(null);
    const [expanded, setExpanded] = useState(false);
    const focusHandledRef = useRef(null);
    const focusExpandedRef = useRef(null);

    const me = user?.userData?.[0];
    const currentUserId = me?.id;
    const token = session?.access_token;
    const isLoggedIn = !!session;

    const { data, isLoading } = useQuery({
        queryKey: ["guestbook", username],
        queryFn: () => getProfileGuestbook(username),
        enabled: !!username,
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: false,
    });

    const entries = data?.entries || [];

    // In compact mode (near the hero) show only the latest few notes until the
    // visitor expands. Full list otherwise.
    const isCondensed = compact && !expanded;
    const visibleEntries = isCondensed ? entries.slice(0, COMPACT_VISIBLE_COUNT) : entries;
    const hiddenCount = entries.length - visibleEntries.length;

    // Deep-link from a guestbook notification: scroll the section into view and
    // briefly highlight the relevant note (exact entry if given, else the most
    // recent note from the signer). Runs once per focus target.
    useEffect(() => {
        if (!focusGuestbook || isLoading) return undefined;

        let targetId = null;
        if (highlightEntryId) {
            targetId = entries.find((entry) => entry.id === highlightEntryId)?.id || null;
        }
        if (!targetId && highlightFromUserId) {
            // entries are newest-first, so the first match is the signer's latest note
            targetId = entries.find((entry) => entry.author_user_id === highlightFromUserId)?.id || null;
        }

        const key = `${highlightEntryId || ""}:${highlightFromUserId || ""}`;

        // If the target note is collapsed in compact mode, expand it once so it
        // can render; the effect re-runs after `expanded` changes and scrolls.
        // Tracked per-key so a later manual collapse isn't fought.
        if (targetId && compact && !expanded && focusExpandedRef.current !== key) {
            const idx = entries.findIndex((entry) => entry.id === targetId);
            if (idx >= COMPACT_VISIBLE_COUNT) {
                focusExpandedRef.current = key;
                setExpanded(true);
                return undefined;
            }
        }

        if (focusHandledRef.current === key) return undefined;
        focusHandledRef.current = key;

        const prefersReduced =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        const behavior = prefersReduced ? "auto" : "smooth";

        const raf = requestAnimationFrame(() => {
            const node = targetId
                ? document.getElementById(`guestbook-entry-${targetId}`)
                : sectionRef.current;
            node?.scrollIntoView({ behavior, block: "center" });
        });

        if (!targetId) {
            return () => cancelAnimationFrame(raf);
        }

        setHighlightedId(targetId);
        const timer = setTimeout(() => setHighlightedId(null), 2600);
        return () => {
            cancelAnimationFrame(raf);
            clearTimeout(timer);
        };
    }, [focusGuestbook, highlightEntryId, highlightFromUserId, isLoading, entries, compact, expanded]);

    // Optimistic signing: the note appears instantly, then reconciles with the
    // server on settle. The query holds { entries, hasMore, profileUserId } —
    // we MUST spread that object and prepend to .entries (a bare array would
    // break the count + empty-state). Author is shaped from `me` (the userData
    // row, which carries username/name/image_url/badge) — NOT session.user.
    const createMutation = useMutation({
        mutationFn: (text) => createGuestbookEntry(token, username, text),
        onMutate: async (text) => {
            await queryClient.cancelQueries({ queryKey: ["guestbook", username] });
            const previous = queryClient.getQueryData(["guestbook", username]);
            const tempId =
                typeof crypto !== "undefined" && crypto.randomUUID
                    ? crypto.randomUUID()
                    : `temp-${Date.now()}`;
            const optimistic = {
                id: tempId,
                message: text,
                created_at: new Date().toISOString(),
                author_user_id: currentUserId,
                author: {
                    id: me?.id,
                    username: me?.username,
                    name: me?.name,
                    image_url: me?.image_url,
                    badge: me?.badge,
                },
            };
            queryClient.setQueryData(["guestbook", username], (old) => ({
                ...old,
                entries: [optimistic, ...(old?.entries || [])],
            }));
            setMessage(""); // clear the composer now
            return { previous, draft: text };
        },
        onError: (_err, _text, ctx) => {
            // Roll the cache back to its pre-insert snapshot and restore the draft.
            if (ctx?.previous !== undefined) {
                queryClient.setQueryData(["guestbook", username], ctx.previous);
            }
            if (ctx?.draft) setMessage(ctx.draft);
            toast.error("Couldn't leave your note. Please try again.");
        },
        onSuccess: () => {
            toast.success("Note left in the room");
        },
        onSettled: () => {
            // Reconcile temp id → real server id.
            queryClient.invalidateQueries({ queryKey: ["guestbook", username] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (entryId) => deleteGuestbookEntry(token, entryId),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["guestbook", username] }),
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = message.trim();
        if (!trimmed || createMutation.isPending) return;
        createMutation.mutate(trimmed);
    };

    const canDeleteEntry = (entry) =>
        !!currentUserId && (currentUserId === profileUserId || currentUserId === entry.author_user_id);

    const goToAuthor = (authorUsername) => {
        if (authorUsername) navigate(`/u/${authorUsername}`);
    };

    return (
        <section
            className={`pt-guestbook${compact ? " pt-guestbook--compact" : ""}`}
            id="profile-guestbook"
            ref={sectionRef}
            aria-label="Guestbook"
        >
            <div className="pt-guestbook-header">
                <div className="pt-guestbook-heading">
                    <h3 className="pt-guestbook-title">Guestbook</h3>
                    <p className="pt-guestbook-subtitle">Leave a note in this room.</p>
                </div>
                <span className="pt-guestbook-count">{entries.length > 0 ? `${entries.length}${data?.hasMore ? "+" : ""} signed` : ""}</span>
            </div>

            {isLoggedIn ? (
                <form className="pt-guestbook-composer" onSubmit={handleSubmit}>
                    <textarea
                        className="pt-guestbook-input"
                        value={message}
                        maxLength={MAX_LENGTH}
                        placeholder="Leave a message…"
                        aria-label="Guestbook message"
                        onChange={(e) => setMessage(e.target.value)}
                        rows={2}
                    />
                    <div className="pt-guestbook-composer-footer">
                        <span className={`pt-guestbook-charcount${message.length > MAX_LENGTH - 20 ? " is-near-limit" : ""}`}>
                            {message.length}/{MAX_LENGTH}
                        </span>
                        <IskribButton
                            type="submit"
                            variant="primary"
                            size="sm"
                            className="pt-guestbook-sign-btn"
                            loading={createMutation.isPending}
                            disabled={!message.trim()}
                        >
                            Sign
                        </IskribButton>
                    </div>
                </form>
            ) : (
                <button type="button" className="pt-guestbook-cta" onClick={() => openAuthModal?.()}>
                    Log in to sign this guestbook
                </button>
            )}

            <div className="pt-guestbook-entries">
                {isLoading && <p className="pt-guestbook-empty">Loading…</p>}
                {!isLoading && entries.length === 0 && (
                    <p className="pt-guestbook-empty">No messages yet. Be the first to sign!</p>
                )}
                <AnimatePresence initial={false}>
                    {visibleEntries.map((entry) => (
                        <Motion.div
                            key={entry.id}
                            id={`guestbook-entry-${entry.id}`}
                            className={`pt-guestbook-entry${highlightedId === entry.id ? " is-highlighted" : ""}`}
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            <button
                                type="button"
                                className="pt-guestbook-avatar-btn"
                                onClick={() => goToAuthor(entry.author?.username)}
                                aria-label={`View ${entry.author?.name || "user"}'s profile`}
                            >
                                <img
                                    className="pt-guestbook-avatar"
                                    src={entry.author?.image_url || "/assets/profile.jpg"}
                                    alt=""
                                    loading="lazy"
                                />
                            </button>
                            <div className="pt-guestbook-entry-body">
                                <div className="pt-guestbook-entry-meta">
                                    <button
                                        type="button"
                                        className="pt-guestbook-author"
                                        onClick={() => goToAuthor(entry.author?.username)}
                                    >
                                        {entry.author?.name || "Unknown"}
                                    </button>
                                    <VerifiedBadge badge={entry.author?.badge} size={13} />
                                    {entry.author?.username && (
                                        <span className="pt-guestbook-handle">@{entry.author.username}</span>
                                    )}
                                    <span className="pt-guestbook-date">· {formatDate(entry.created_at)}</span>
                                    {canDeleteEntry(entry) && (
                                        <button
                                            type="button"
                                            className="pt-guestbook-delete"
                                            aria-label="Delete this entry"
                                            disabled={deleteMutation.isPending}
                                            onClick={() => deleteMutation.mutate(entry.id)}
                                        >
                                            ×
                                        </button>
                                    )}
                                </div>
                                <p className="pt-guestbook-message">{entry.message}</p>
                            </div>
                        </Motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {compact && (hiddenCount > 0 || expanded) && entries.length > COMPACT_VISIBLE_COUNT && (
                <button
                    type="button"
                    className="pt-guestbook-toggle"
                    onClick={() => setExpanded((v) => !v)}
                >
                    {isCondensed ? `View all notes (${entries.length})` : "Show less"}
                </button>
            )}
        </section>
    );
};

export default ProfileGuestbook;
