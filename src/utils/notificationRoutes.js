import { getPublicProfilePath, getLegacyProfileFallbackPath } from "./profileRoutes";

/**
 * Type-aware navigation target for a notification's MAIN click.
 *
 * Prefers the robust target model (`target_type` + `target_*` columns). Returns
 * a path string, or `null` when the notification needs the card's richer
 * (state-carrying) navigation — journal posts and opinions — which the card
 * handles itself.
 *
 * Notifications created before the target migration have no `target_type`; they
 * fall back to `legacyNotificationTargetPath`, preserving prior behavior.
 */

const buildGuestbookPath = (notification) => {
    const params = new URLSearchParams({ focus: "guestbook" });
    const entryId = notification.target_id;
    if (entryId) {
        params.set("entryId", entryId); // exact note
    } else {
        const actorId =
            notification.target_metadata?.fallbackActorId ||
            notification.target_metadata?.actorUserId ||
            notification.sender_id;
        if (actorId) params.set("from", actorId); // highlight actor's latest loaded note
    }
    return `/profile?${params.toString()}`;
};

const buildUserProfilePath = (notification) => {
    // In every user_profile case the target user is the actor (sender), so the
    // existing sender embed (`notification.users`) gives us the username.
    const targetUserId = notification.target_user_id || notification.sender_id;
    return getPublicProfilePath(notification.users) || getLegacyProfileFallbackPath(targetUserId);
};

// Behavior for notifications without a target_type (pre-migration rows).
const legacyNotificationTargetPath = (notification) => {
    switch (notification?.type) {
        case "guestbook": {
            const params = new URLSearchParams({ focus: "guestbook" });
            if (notification.sender_id) params.set("from", notification.sender_id);
            return `/profile?${params.toString()}`;
        }
        case "follow":
        case "theme_remix":
            return (
                getPublicProfilePath(notification.users) ||
                getLegacyProfileFallbackPath(notification.sender_id)
            );
        default:
            return null; // journal/opinion/etc — card handles with content state
    }
};

export const getNotificationTargetPath = (notification) => {
    if (!notification) return null;

    switch (notification.target_type) {
        case "profile_guestbook":
            return buildGuestbookPath(notification);

        case "own_profile":
            return "/profile";

        case "user_profile":
            return buildUserProfilePath(notification);

        // Content targets: let the card navigate with its content state.
        case "journal":
        case "opinion":
        case "comment_thread":
        case "constellation":
            return null;

        case "unknown":
            return legacyNotificationTargetPath(notification);

        default:
            // No target_type (pre-migration) → infer from the notification type.
            return legacyNotificationTargetPath(notification);
    }
};
