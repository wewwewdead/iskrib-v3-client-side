import { useEffect, useRef, useState } from "react";

/**
 * The single animated <video> background layer for a profile page.
 *
 * Renders an MP4 (H.264, required for Safari/iOS) with an optional WebM source,
 * and manages playback defensively:
 *   - autoplay only ever happens muted + playsInline (mobile requirement)
 *   - play() rejections are swallowed (autoplay can be blocked)
 *   - pauses when the document is hidden (visibilitychange)
 *   - pauses when scrolled out of view (IntersectionObserver)
 *   - pauses when the parent asks (`paused`, e.g. builder open / reduced motion)
 *   - never calls play() from render; only from effects keyed on the inputs
 *
 * There must only ever be ONE of these mounted per profile page.
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

    // Single place that starts/stops playback. Wrapped defensively: play() can
    // reject (blocked autoplay) and, in non-browser test envs (jsdom), the media
    // methods throw "not implemented".
    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        const shouldPlay = !paused && inView && !docHidden;
        try {
            if (shouldPlay) {
                const result = el.play();
                if (result && typeof result.catch === "function") result.catch(() => {});
            } else {
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
