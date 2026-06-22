/**
 * Client-side helpers for the server's pre-generated image variants.
 *
 * Every uploaded image (avatars, backgrounds, story covers, journal images) is
 * stored as a set of WebP variants by the server (see server/utils/mediaVariants.js):
 *   <base>__thumb.webp   <base>__card.webp   <base>__detail.webp   <base>__original.webp
 *
 * Stored URLs point at the `__detail` variant. When we only need a tiny preview
 * (e.g. a profile background behind a small chip), we rewrite the URL to the
 * already-generated `__thumb` variant so the browser downloads ~480px instead of
 * a full 1920px image — far less bandwidth and decode memory, no jank on scroll.
 *
 * If a URL carries no managed variant suffix (legacy/non-variant images), it's
 * returned untouched so nothing breaks.
 */

// Matches a managed variant suffix + extension at the end of the path
// (before any query string / hash).
const MANAGED_VARIANT_RE = /__(?:thumb|card|detail|original)(\.[^./?#]+)(?=$|[?#])/i;

/**
 * Rewrite an image URL to its pre-generated `__thumb` variant.
 * @param {string} url
 * @returns {string} the thumbnail URL, or the original url if not variant-managed
 */
export const toThumbnailUrl = (url) => {
    if (typeof url !== "string" || !url) return url;
    return MANAGED_VARIANT_RE.test(url) ? url.replace(MANAGED_VARIANT_RE, "__thumb$1") : url;
};

/**
 * Extract a STATIC image URL from a profile `background` object, if it holds one.
 * Profile backgrounds may be: an image style (`{ backgroundImage:"url(...)" }`),
 * a CSS gradient (`{ background:"linear-gradient(...)" }`), a legacy GIF style
 * (`{ backgroundImage:"url(...gif)", backgroundPosterImage:"url(...)" }`), or the
 * production animated manifest (`{ posterUrl, mp4Url, ... }`). Animated backgrounds
 * resolve to their POSTER so thumbnails are always static (never an animated GIF).
 * @param {object|null|undefined} background
 * @returns {string|null} the image URL, or null when there's no image (e.g. a gradient)
 */
export const getBackgroundImageUrl = (background) => {
    if (!background || typeof background !== "object") return null;
    // Prefer the static poster for animated backgrounds (video manifest / GIF).
    if (typeof background.posterUrl === "string" && background.posterUrl) return background.posterUrl;
    const raw =
        background.backgroundPosterImage || background.backgroundImage || background.background || "";
    if (typeof raw !== "string") return null;
    const match = /url\(\s*(['"]?)([^'")]+)\1\s*\)/i.exec(raw);
    return match ? match[2] : null;
};
