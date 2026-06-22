/**
 * Background manifest helpers.
 *
 * `users.background` can hold several shapes, all handled here:
 *   1. A static image style:   { backgroundImage:"url(...)", backgroundSize, ... }
 *   2. A gradient style:       { backgroundImage:"linear-gradient(...)" }
 *   3. A legacy GIF style:     { mediaType:"gif", backgroundImage:"url(...gif)",
 *                                backgroundPosterImage:"url(...)" }
 *   4. The production manifest: { type:"animated_background", mediaType:"video",
 *                                mp4Url, webmUrl, posterUrl, originalUrl, playback, ... }
 *
 * The renderer uses these helpers to decide WHAT to render (video vs poster vs
 * CSS) and to produce CSS-safe style objects that never leak non-CSS manifest
 * fields (mp4Url, mediaType, processing, …) into React `style`.
 */

// CSS background properties that are safe to spread into a React style object.
const CSS_BACKGROUND_KEYS = [
    "background",
    "backgroundImage",
    "backgroundColor",
    "backgroundSize",
    "backgroundPosition",
    "backgroundRepeat",
    "backgroundAttachment",
    "backgroundBlendMode",
    "backgroundClip",
    "backgroundOrigin",
];

// Conservative whitelist for a single object-position / background-position token
// (keyword, percentage, or length). A value is at most two such tokens; anything
// else falls back to "center".
const SAFE_POSITION_TOKEN = /^(?:center|top|bottom|left|right|-?\d+(?:\.\d+)?(?:px|%|em|rem)?)$/i;

/** Extract the inner URL from a CSS `url(...)` wrapper, or return a bare string. */
export const normalizeBackgroundUrl = (value) => {
    if (typeof value !== "string") return null;
    const v = value.trim();
    if (!v) return null;
    const match = /url\(\s*['"]?([^'")]+)['"]?\s*\)/i.exec(v);
    if (match) return match[1];
    // A plain http(s)/blob/data URL with no url() wrapper.
    if (/^(https?:|blob:|data:)/i.test(v)) return v;
    return null;
};

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

/**
 * Is this background animated (a video manifest, the legacy GIF style, or the
 * GIF fallback manifest)? Static images and gradients are not.
 */
export const isAnimatedBackground = (bg) => {
    if (!isObject(bg)) return false;
    if (bg.mp4Url || bg.webmUrl) return true;
    if (bg.type === "animated_background") return true;
    if (bg.mediaType === "gif") return true;
    return false;
};

/** Does this background carry optimized <video> sources? */
export const hasVideoSources = (bg) => Boolean(isObject(bg) && (bg.mp4Url || bg.webmUrl));

/** The optimized video sources ({ mp4Url, webmUrl }) — either may be null. */
export const getAnimatedBackgroundSources = (bg) => ({
    mp4Url: (isObject(bg) && typeof bg.mp4Url === "string" && bg.mp4Url) || null,
    webmUrl: (isObject(bg) && typeof bg.webmUrl === "string" && bg.webmUrl) || null,
});

/** The static poster image URL (manifest posterUrl or legacy backgroundPosterImage). */
export const getBackgroundPoster = (bg) => {
    if (!isObject(bg)) return null;
    if (typeof bg.posterUrl === "string" && bg.posterUrl) return bg.posterUrl;
    return normalizeBackgroundUrl(bg.backgroundPosterImage);
};

/**
 * The raw animated GIF URL — only meaningful as a compatibility fallback when
 * there are no optimized video sources (old GIFs, or the no-ffmpeg fallback).
 */
export const getLegacyGifUrl = (bg) => {
    if (!isObject(bg)) return null;
    if (typeof bg.originalUrl === "string" && bg.originalUrl) return bg.originalUrl;
    if (bg.mediaType === "gif") return normalizeBackgroundUrl(bg.backgroundImage);
    return null;
};

/** A CSS-safe object-position / background-position for the media. */
export const getBackgroundPosition = (bg) => {
    const raw = (isObject(bg) && (bg?.playback?.position || bg.backgroundPosition)) || "";
    if (typeof raw !== "string") return "center";
    const tokens = raw.trim().split(/\s+/).filter(Boolean);
    if (tokens.length < 1 || tokens.length > 2) return "center";
    return tokens.every((t) => SAFE_POSITION_TOKEN.test(t)) ? tokens.join(" ") : "center";
};

/**
 * Produce a CSS-only background style object, stripping every non-CSS field.
 *
 * - Animated backgrounds resolve to their POSTER (never the GIF/video), so this
 *   is safe for static contexts (ambient blur, builder preview, reduced motion).
 *   Returns null when an animated background has no poster — callers must not
 *   render the animated media as a CSS background.
 * - Static image / gradient backgrounds pass through with only whitelisted CSS
 *   keys retained.
 */
export const getStaticBackgroundStyle = (bg, { posterForAnimated = true } = {}) => {
    if (!isObject(bg)) return null;

    if (isAnimatedBackground(bg)) {
        const poster = getBackgroundPoster(bg);
        if (poster && posterForAnimated) {
            return {
                backgroundImage: `url("${poster}")`,
                backgroundSize: "cover",
                backgroundPosition: getBackgroundPosition(bg),
                backgroundRepeat: "no-repeat",
            };
        }
        return null;
    }

    const out = {};
    for (const key of CSS_BACKGROUND_KEYS) {
        if (typeof bg[key] === "string" && bg[key]) out[key] = bg[key];
    }
    return Object.keys(out).length ? out : null;
};
