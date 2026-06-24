import "./profileBackground.css";
import useProfileMotionBudget from "../../../hooks/useProfileMotionBudget";
import { profileBackgroundToStyle } from "../builder/profileThemeUtils";
import ProfileAnimatedBackground from "./ProfileAnimatedBackground";
import {
    isAnimatedBackground,
    getAnimatedBackgroundSources,
    getBackgroundPoster,
    getLegacyGifUrl,
    getBackgroundPosition,
    getStaticBackgroundStyle,
} from "./backgroundUtils";

/**
 * The profile background renderer.
 *
 * `mode="main"`   — the one place an animated background may actually animate.
 *                   Renders a <video> (or a single non-blurred <img> for legacy
 *                   GIFs without optimized sources), with the theme gradient
 *                   composited on top. Returns null for static image/gradient
 *                   backgrounds (those stay on the column's CSS background).
 * `mode="ambient"`— the decorative full-screen blur behind the column. NEVER
 *                   animates: animated backgrounds resolve to their poster, so a
 *                   GIF/video is never blurred or re-decoded per frame.
 *
 * Only ONE main layer (and thus one <video>) should be mounted per page.
 */
const ProfileBackgroundLayer = ({ background, profileTheme, builderOpen = false, mode = "main" }) => {
    const budget = useProfileMotionBudget({ builderOpen });
    const animated = isAnimatedBackground(background);

    if (mode === "ambient") {
        // Static images blur as-is; animated backgrounds blur their static POSTER —
        // the ambient layer NEVER mounts a <video>/GIF, so a profile visit only ever
        // has the one animating layer (the main mode below).
        const style = getStaticBackgroundStyle(background, { posterForAnimated: true });
        if (!style) return null;
        return (
            <div
                className={`blurred-img-bg${animated ? " profile-ambient-poster" : ""}`}
                style={style}
                data-testid="profile-bg-ambient"
                aria-hidden="true"
            />
        );
    }

    // Main layer is only for animated backgrounds. Static image/gradient stays on
    // the column's own CSS background (handled by the page), so render nothing.
    if (!animated) return null;

    const poster = getBackgroundPoster(background);
    const sources = getAnimatedBackgroundSources(background);
    const hasVideo = sources.mp4Url || sources.webmUrl;
    const gifUrl = getLegacyGifUrl(background);
    const objectPosition = getBackgroundPosition(background);
    const gradientStyle = profileBackgroundToStyle(profileTheme);

    let media = null;
    if (budget.shouldUsePosterOnly) {
        // Reduced motion OR builder open → poster only. No <video> is mounted at
        // all (so nothing decodes behind the builder); a still <img> is rendered.
        media = poster ? (
            <img className="profile-animated-bg-poster" src={poster} alt="" aria-hidden="true" />
        ) : null;
    } else if (hasVideo) {
        media = (
            <ProfileAnimatedBackground
                mp4Url={sources.mp4Url}
                webmUrl={sources.webmUrl}
                poster={poster}
                objectPosition={objectPosition}
                paused={budget.isDocumentHidden}
            />
        );
    } else if (gifUrl && !budget.prefersReducedMotion) {
        // Legacy / no-ffmpeg fallback: a SINGLE, non-blurred GIF <img>. Never
        // blurred, never duplicated, never under a backdrop-filter on mobile.
        media = (
            <img
                className="profile-animated-bg-gif"
                src={gifUrl}
                alt=""
                aria-hidden="true"
                style={{ objectPosition }}
            />
        );
    } else if (poster) {
        media = <img className="profile-animated-bg-poster" src={poster} alt="" aria-hidden="true" />;
    }

    if (!media && !gradientStyle) return null;

    return (
        <div className="profile-bg-media-layer" data-testid="profile-bg-media-layer" aria-hidden="true">
            {media}
            {gradientStyle && <div className="profile-bg-gradient-overlay" style={gradientStyle} />}
        </div>
    );
};

export default ProfileBackgroundLayer;
