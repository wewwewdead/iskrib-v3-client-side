import { useEffect, useRef, useState } from "react";

// Dev-only instrumentation. Gated so a production build never spams the console
// (Vite replaces import.meta.env.MODE; vitest/dev report a non-"production" mode).
const DEV =
    typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.MODE !== "production";
const devLog = (...args) => {
    if (DEV) console.debug("[ProfileBg]", ...args);
};

// Module-level count of mounted animated <video> layers. The thermal-safety
// invariant is "at most ONE animated background video per page" — if this ever
// exceeds 1 we warn in development so a duplicate main layer is caught early.
let mountedVideoCount = 0;

/**
 * The single animated <video> background layer for a profile page.
 *
 * Renders an MP4 (H.264, required for Safari/iOS) with an optional WebM source,
 * and manages playback defensively:
 *   - autoplay only ever happens muted + playsInline (mobile requirement)
 *   - play() rejections are swallowed (autoplay can be blocked)
 *   - play()/pause() are only called when the state actually needs to change
 *     (no repeated play loops, no redundant decode churn)
 *   - pauses when the document is hidden (visibilitychange)
 *   - pauses when scrolled out of view (IntersectionObserver)
 *   - pauses when the parent asks (`paused`, e.g. builder open / reduced motion)
 *   - never calls play() from render; only from effects keyed on the inputs
 *   - cleans up every listener/observer on unmount
 *
 * The CALLER guarantees this only mounts when animation is actually allowed
 * (ProfileBackgroundLayer renders a poster <img> instead when the builder is
 * open or reduced motion is on), so there is never a decoding <video> behind the
 * builder. There must only ever be ONE of these mounted per profile page.
 */
const ProfileAnimatedBackground = ({
    mp4Url,
    webmUrl,
    poster,
    objectPosition = "center",
    paused = false,
    className = "",
}) => {
    const videoRef = useRef(null);
    const [inView, setInView] = useState(true);
    const [docHidden, setDocHidden] = useState(
        typeof document !== "undefined" && document.visibilityState === "hidden"
    );

    // Keep the element muted at the property level — React's `muted` attribute is
    // not reliably reflected to the DOM, and unmuted autoplay is blocked.
    useEffect(() => {
        if (videoRef.current) videoRef.current.muted = true;
    }, []);

    // Mount/unmount lifecycle + the single-layer dev guard.
    useEffect(() => {
        mountedVideoCount += 1;
        devLog("animated background mounted", { mounted: mountedVideoCount });
        if (DEV && mountedVideoCount > 1) {
            console.warn(
                `[ProfileBg] ${mountedVideoCount} animated background videos are mounted at once — ` +
                    "exactly one is expected per profile page. Look for a duplicate " +
                    "ProfileBackgroundLayer main layer (ambient/preview/discovery must use a poster)."
            );
        }
        return () => {
            mountedVideoCount -= 1;
            devLog("animated background unmounted", { mounted: mountedVideoCount });
        };
    }, []);

    useEffect(() => {
        if (typeof document === "undefined") return undefined;
        const onVisibility = () => setDocHidden(document.visibilityState === "hidden");
        document.addEventListener("visibilitychange", onVisibility);
        return () => document.removeEventListener("visibilitychange", onVisibility);
    }, []);

    useEffect(() => {
        const el = videoRef.current;
        if (!el || typeof IntersectionObserver === "undefined") return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[entries.length - 1];
                setInView(entry.isIntersecting);
            },
            { threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Single place that starts/stops playback. Only acts when the element's actual
    // paused state disagrees with what we want, so we never re-issue play() in a
    // loop or call pause() on an already-paused (idle, non-decoding) element.
    // Wrapped defensively: play() can reject (blocked autoplay) and, in non-browser
    // test envs (jsdom), the media methods throw "not implemented".
    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        const shouldPlay = !paused && inView && !docHidden;
        try {
            if (shouldPlay && el.paused) {
                devLog("play", { paused, inView, docHidden });
                const result = el.play();
                if (result && typeof result.catch === "function") result.catch(() => {});
            } else if (!shouldPlay && !el.paused) {
                devLog("pause", { paused, inView, docHidden });
                el.pause();
            }
        } catch {
            /* media playback not supported in this environment */
        }
    }, [paused, inView, docHidden, mp4Url, webmUrl]);

    if (!mp4Url && !webmUrl) return null;

    return (
        <video
            ref={videoRef}
            className={`profile-animated-bg-video ${className}`.trim()}
            data-testid="profile-animated-bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={poster || undefined}
            aria-hidden="true"
            tabIndex={-1}
            disablePictureInPicture
            style={objectPosition ? { objectPosition } : undefined}
        >
            {webmUrl && <source src={webmUrl} type="video/webm" />}
            {mp4Url && <source src={mp4Url} type="video/mp4" />}
        </video>
    );
};

export default ProfileAnimatedBackground;
