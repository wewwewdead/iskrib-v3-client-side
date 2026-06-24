import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProfileDiscoverCard from "./ProfileDiscoverCard";

const animatedCard = {
    username: "alice",
    name: "Alice",
    badge: null,
    background: {
        type: "animated_background",
        mediaType: "video",
        posterUrl: "https://cdn.test/poster.webp",
        mp4Url: "https://cdn.test/clip.mp4",
        webmUrl: "https://cdn.test/clip.webm",
    },
};

const gifCard = {
    username: "bob",
    name: "Bob",
    badge: null,
    background: {
        mediaType: "gif",
        backgroundImage: "url(https://cdn.test/anim.gif)",
        backgroundPosterImage: "url(https://cdn.test/poster.webp)",
    },
};

const renderCard = (card) =>
    render(
        <MemoryRouter>
            <ProfileDiscoverCard card={card} />
        </MemoryRouter>
    );

describe("ProfileDiscoverCard — never animates (poster only)", () => {
    it("uses the static poster (never a <video>) for a video-manifest background", () => {
        const { container } = renderCard(animatedCard);
        expect(container.querySelector("video")).toBeNull();
        const bg = container.querySelector(".pdc-bg");
        const style = bg.getAttribute("style") || "";
        expect(style).toContain("poster.webp");
        expect(style).not.toContain("clip.mp4");
    });

    it("uses the poster (never the GIF) for a legacy GIF background", () => {
        const { container } = renderCard(gifCard);
        expect(container.querySelector("video")).toBeNull();
        const bg = container.querySelector(".pdc-bg");
        const style = bg.getAttribute("style") || "";
        expect(style).toContain("poster.webp");
        expect(style).not.toContain("anim.gif");
    });
});
