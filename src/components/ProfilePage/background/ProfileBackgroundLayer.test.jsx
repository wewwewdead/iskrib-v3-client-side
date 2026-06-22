import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import ProfileBackgroundLayer from "./ProfileBackgroundLayer";

// matchMedia helper: control which queries "match" for a given test.
const setMatchMedia = (matches) => {
    window.matchMedia = (query) => ({
        matches: matches(query),
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
    });
};

const videoManifest = {
    type: "animated_background",
    mediaType: "video",
    posterUrl: "https://cdn.test/poster.webp",
    mp4Url: "https://cdn.test/clip.mp4",
    webmUrl: "https://cdn.test/clip.webm",
};

const legacyGifWithPoster = {
    mediaType: "gif",
    backgroundImage: "url(https://cdn.test/anim.gif)",
    backgroundPosterImage: "url(https://cdn.test/poster.webp)",
};

const legacyGifNoPoster = {
    mediaType: "gif",
    backgroundImage: "url(https://cdn.test/anim.gif)",
};

const staticImage = {
    backgroundImage: "url(https://cdn.test/photo.webp)",
    backgroundSize: "cover",
};

const gradientTheme = {
    background: { type: "gradient", angle: 135, from: "#000000", to: "#ffffff", opacity: 0.5 },
};

beforeEach(() => {
    setMatchMedia(() => false); // not reduced-motion, not mobile
});

afterEach(() => {
    setMatchMedia(() => false);
});

describe("ProfileBackgroundLayer — main mode", () => {
    it("renders the optimized <video> with the right attributes for a video manifest", () => {
        const { container } = render(
            <ProfileBackgroundLayer mode="main" background={videoManifest} profileTheme={{}} />
        );
        const video = container.querySelector("video.profile-animated-bg-video");
        expect(video).toBeTruthy();
        expect(video).toHaveAttribute("loop");
        expect(video).toHaveAttribute("autoplay");
        expect(video).toHaveAttribute("playsinline");
        expect(video).toHaveAttribute("poster", "https://cdn.test/poster.webp");
        const sources = video.querySelectorAll("source");
        const types = Array.from(sources).map((s) => s.getAttribute("type"));
        expect(types).toContain("video/mp4");
        expect(types).toContain("video/webm");
    });

    it("renders poster only (no video) when the builder is open", () => {
        const { container } = render(
            <ProfileBackgroundLayer mode="main" background={videoManifest} profileTheme={{}} builderOpen />
        );
        expect(container.querySelector("video")).toBeNull();
        expect(container.querySelector("img.profile-animated-bg-poster")).toBeTruthy();
    });

    it("renders poster only (no video) under reduced motion", () => {
        setMatchMedia((q) => q.includes("reduced-motion"));
        const { container } = render(
            <ProfileBackgroundLayer mode="main" background={videoManifest} profileTheme={{}} />
        );
        expect(container.querySelector("video")).toBeNull();
        expect(container.querySelector("img.profile-animated-bg-poster")).toBeTruthy();
    });

    it("composites the theme gradient overlay over the media", () => {
        const { container } = render(
            <ProfileBackgroundLayer mode="main" background={videoManifest} profileTheme={gradientTheme} />
        );
        const overlay = container.querySelector(".profile-bg-gradient-overlay");
        expect(overlay).toBeTruthy();
        expect(overlay.getAttribute("style")).toMatch(/linear-gradient/);
    });

    it("renders a single non-blurred GIF <img> for a legacy GIF with no video sources", () => {
        const { container } = render(
            <ProfileBackgroundLayer mode="main" background={legacyGifNoPoster} profileTheme={{}} />
        );
        const gif = container.querySelector("img.profile-animated-bg-gif");
        expect(gif).toBeTruthy();
        expect(gif).toHaveAttribute("src", "https://cdn.test/anim.gif");
        // It is NOT inside the ambient blur layer.
        expect(container.querySelector(".blurred-img-bg")).toBeNull();
    });

    it("renders nothing for a static image (handled by the column CSS)", () => {
        const { container } = render(
            <ProfileBackgroundLayer mode="main" background={staticImage} profileTheme={{}} />
        );
        expect(container.firstChild).toBeNull();
    });
});

describe("ProfileBackgroundLayer — ambient mode", () => {
    it("blurs the POSTER (never the GIF/video) for an animated background", () => {
        const { container } = render(
            <ProfileBackgroundLayer mode="ambient" background={videoManifest} profileTheme={{}} />
        );
        expect(container.querySelector("video")).toBeNull();
        const ambient = container.querySelector(".blurred-img-bg");
        expect(ambient).toBeTruthy();
        const style = ambient.getAttribute("style") || "";
        expect(style).toContain("poster.webp");
        expect(style).not.toContain("anim.gif");
    });

    it("uses the poster for a legacy GIF (does not animate the ambient)", () => {
        const { container } = render(
            <ProfileBackgroundLayer mode="ambient" background={legacyGifWithPoster} profileTheme={{}} />
        );
        const ambient = container.querySelector(".blurred-img-bg");
        expect(ambient.getAttribute("style")).toContain("poster.webp");
        expect(ambient.getAttribute("style")).not.toContain("anim.gif");
    });

    it("renders nothing for a legacy GIF with no poster (no crash)", () => {
        const { container } = render(
            <ProfileBackgroundLayer mode="ambient" background={legacyGifNoPoster} profileTheme={{}} />
        );
        expect(container.firstChild).toBeNull();
    });

    it("blurs a static image as before", () => {
        const { container } = render(
            <ProfileBackgroundLayer mode="ambient" background={staticImage} profileTheme={{}} />
        );
        const ambient = container.querySelector(".blurred-img-bg");
        expect(ambient.getAttribute("style")).toContain("photo.webp");
    });
});
