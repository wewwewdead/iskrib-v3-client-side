/**
 * Canonical profile route helpers.
 *
 * The one public profile route is `/u/:username`. Own profile is `/profile`.
 * The legacy `/visitProfile?userId=...` route only exists now as a redirect
 * target and should never be constructed by new code.
 */

/**
 * Public profile path for a user object, or null if no username is available.
 * Accepts either `username` or `user_name` for flexibility across payloads.
 */
export const getPublicProfilePath = (user) => {
    if (!user) return null;
    const username = user.username || user.user_name;
    return username ? `/u/${encodeURIComponent(username)}` : null;
};

/**
 * Own profile (`/profile`) when the target is the current user, otherwise the
 * public profile path. Returns null when no usable path can be built.
 */
export const getOwnOrPublicProfilePath = ({ currentUserId, targetUser }) => {
    if (!targetUser) return null;
    if (currentUserId && targetUser.id === currentUserId) return "/profile";
    return getPublicProfilePath(targetUser);
};

/**
 * Last-resort legacy path used only when a username is genuinely unavailable at
 * click time. It resolves server-side and redirects to `/u/:username`, so the
 * user still lands on the canonical profile.
 */
export const getLegacyProfileFallbackPath = (userId) =>
    userId ? `/visitProfile?userId=${encodeURIComponent(userId)}` : null;
