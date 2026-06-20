import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import "./profileGuestbook.css";
import { useAuth } from "../../../Context/useAuth";
import { getProfileGuestbook, createGuestbookEntry, deleteGuestbookEntry } from "../../../../API/Api";
import VerifiedBadge from "../../Badge/VerifiedBadge";

const MAX_LENGTH = 280;

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
    focusGuestbook = false,
    highlightEntryId = null,
    highlightFromUserId = null,
}) => {
    const { session, user, openAuthModal } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const sectionRef = useRef(null);
    const [highlightedId, setHighlightedId] = useState(null);
    const focusHandledRef = useRef(null);

    const currentUserId = user?.userData?.[0]?.id;
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

    // Deep-link from a guestbook notification: scroll the section into view and
    // briefly highlight the relevant note (exact entry if given, else the most
    // recent note from the signer). Runs once per focus target.
    useEffect(() => {
        if (!focusGuestbook || isLoading) return undefined;

        const key = `${highlightEntryId || ""}:${highlightFromUserId || ""}`;
        if (focusHandledRef.current === key) return undefined;
        focusHandledRef.current = key;

        const prefersReduced =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
        const behavior = prefersReduced ? "auto" : "smooth";

        let targetId = null;
        if (highlightEntryId) {
            targetId = entries.find((entry) => entry.id === highlightEntryId)?.id || null;
        }
        if (!targetId && highlightFromUserId) {
            // entries are newest-first, so the first match is the signer's latest note
            targetId = entries.find((entry) => entry.author_user_id === highlightFromUserId)?.id || null;
        }

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
    }, [focusGuestbook, highlightEntryId, highlightFromUserId, isLoading, entries]);

    const createMutation = useMutation({
        mutationFn: (text) => createGuestbookEntry(token, username, text),
        onSuccess: () => {
            setMessage("");
            setError("");
            queryClient.invalidateQueries({ queryKey: ["guestbook", username] });
        },
        onError: () => setError("Couldn't sign the guestbook. Please try again."),
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
        <section className="pt-guestbook" id="profile-guestbook" ref={sectionRef} aria-label="Guestbook">
            <div className="pt-guestbook-header">
                <h3 className="pt-guestbook-title">Guestbook</h3>
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
                        <button
                            type="submit"
                            className="pt-guestbook-sign-btn"
                            disabled={!message.trim() || createMutation.isPending}
                        >
                            {createMutation.isPending ? "Signing…" : "Sign"}
                        </button>
                    </div>
                    {error && <p className="pt-guestbook-error" role="alert">{error}</p>}
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
                    {entries.map((entry) => (
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
        </section>
    );
};

export default ProfileGuestbook;
