import { describe, it, expect } from "vitest";
import {
    isAnimatedBackground,
    hasVideoSources,
    getAnimatedBackgroundSources,
    getBackgroundPoster,
    getLegacyGifUrl,
    getBackgroundPosition,
    getStaticBackgroundStyle,
    normalizeBackgroundUrl,
} from "./backgroundUtils";

const videoManifest = {
    type: "animated_background",
    version: 1,
    mediaType: "video",
    sourceMediaType: "gif",
    originalUrl: "https://cdn.test/u/orig.gif",
    posterUrl: "https://cdn.test/u/poster.webp",
    mp4Url: "https://cdn.test/u/clip.mp4",
    webmUrl: "https://cdn.test/u/clip.webm",
    playback: { loop: true, muted: true, objectFit: "cover", position: "center" },
    processing: { status: "ready", error: null },
};

const legacyGif = {
    mediaType: "gif",
    backgroundImage: "url(https://cdn.test/anim.gif)",
    backgroundPosterImage: "url(https://cdn.test/poster.webp)",
    backgroundSize: "cover",
};

const staticImage = {
    backgroundImage: "url(https://cdn.test/photo.webp)",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
};

const gradient = { backgroundImage: "linear-gradient(135deg, #000 0%, #fff 100%)" };

describe("isAnimatedBackground", () => {
    it("detects the video manifest, GIF fallback manifest, and legacy GIF", () => {
        expect(isAnimatedBackground(videoManifest)).toBe(true);
        expect(isAnimatedBackground({ type: "animated_background", mediaType: "gif" })).toBe(true);
        expect(isAnimatedBackground(legacyGif)).toBe(true);
    });
    it("is false for static images, gradients, and empty/null", () => {
        expect(isAnimatedBackground(staticImage)).toBe(false);
        expect(isAnimatedBackground(gradient)).toBe(false);
        expect(isAnimatedBackground({})).toBe(false);
        expect(isAnimatedBackground(null)).toBe(false);
    });
});

describe("source / poster / gif accessors", () => {
    it("reads video sources and poster from the manifest", () => {
        expect(hasVideoSources(videoManifest)).toBe(true);
        expect(getAnimatedBackgroundSources(videoManifest)).toEqual({
            mp4Url: "https://cdn.test/u/clip.mp4",
            webmUrl: "https://cdn.test/u/clip.webm",
        });
        expect(getBackgroundPoster(videoManifest)).toBe("https://cdn.test/u/poster.webp");
    });
    it("reads poster / gif url from a legacy GIF style", () => {
        expect(getBackgroundPoster(legacyGif)).toBe("https://cdn.test/poster.webp");
        expect(getLegacyGifUrl(legacyGif)).toBe("https://cdn.test/anim.gif");
        expect(hasVideoSources(legacyGif)).toBe(false);
    });
    it("returns a safe object-position, defaulting to center", () => {
        expect(getBackgroundPosition(videoManifest)).toBe("center");
        expect(getBackgroundPosition({ backgroundPosition: "top left" })).toBe("top left");
        expect(getBackgroundPosition({ backgroundPosition: "url(evil)" })).toBe("center");
    });
});

describe("normalizeBackgroundUrl", () => {
    it("extracts urls from url(...) and bare http/blob/data", () => {
        expect(normalizeBackgroundUrl("url(https://a.test/x.png)")).toBe("https://a.test/x.png");
        expect(normalizeBackgroundUrl('url("https://a.test/y.png")')).toBe("https://a.test/y.png");
        expect(normalizeBackgroundUrl("https://a.test/z.png")).toBe("https://a.test/z.png");
        expect(normalizeBackgroundUrl("linear-gradient(#000,#fff)")).toBeNull();
    });
});

describe("getStaticBackgroundStyle", () => {
    it("resolves an animated manifest to its POSTER and strips non-CSS fields", () => {
        const style = getStaticBackgroundStyle(videoManifest);
        expect(style.backgroundImage).toBe('url("https://cdn.test/u/poster.webp")');
        expect(style.backgroundSize).toBe("cover");
        // No manifest leakage into the style object.
        expect(style.mp4Url).toBeUndefined();
        expect(style.webmUrl).toBeUndefined();
        expect(style.mediaType).toBeUndefined();
        expect(style.processing).toBeUndefined();
        expect(style.type).toBeUndefined();
    });
    it("returns null for an animated background with no poster", () => {
        expect(getStaticBackgroundStyle({ mp4Url: "https://cdn.test/x.mp4" })).toBeNull();
        expect(getStaticBackgroundStyle({ mediaType: "gif", backgroundImage: "url(https://cdn.test/a.gif)" })).toBeNull();
    });
    it("passes a static image / gradient through with only CSS keys", () => {
        expect(getStaticBackgroundStyle(staticImage)).toEqual(staticImage);
        expect(getStaticBackgroundStyle(gradient)).toEqual(gradient);
    });
    it("returns null for null / non-object", () => {
        expect(getStaticBackgroundStyle(null)).toBeNull();
        expect(getStaticBackgroundStyle("nope")).toBeNull();
    });
});
