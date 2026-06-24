import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import ProfileAnimatedBackground from "./ProfileAnimatedBackground";

const sources = {
    mp4Url: "https://cdn.test/clip.mp4",
    webmUrl: "https://cdn.test/clip.webm",
    poster: "https://cdn.test/poster.webp",
};

describe("ProfileAnimatedBackground — playback lifecycle + single-layer guard", () => {
    let playSpy;
    let pauseSpy;
    let pausedVal;
    let origPausedDesc;
    let origIO;
    let origVisibility;

    beforeEach(() => {
        pausedVal = true;
        playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(() => {
            pausedVal = false;
            return Promise.resolve();
        });
        pauseSpy = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {
            pausedVal = true;
        });
        origPausedDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "paused");
        Object.defineProperty(HTMLMediaElement.prototype, "paused", {
            configurable: true,
            get: () => pausedVal,
        });

        // Deterministic IntersectionObserver: reports the element as in view.
        origIO = global.IntersectionObserver;
        global.IntersectionObserver = class {
            constructor(cb) {
                this.cb = cb;
            }
            observe() {
                this.cb([{ isIntersecting: true }]);
            }
            disconnect() {}
        };

        origVisibility = Object.getOwnPropertyDescriptor(Document.prototype, "visibilityState");
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        if (origPausedDesc) Object.defineProperty(HTMLMediaElement.prototype, "paused", origPausedDesc);
        global.IntersectionObserver = origIO;
        if (origVisibility) Object.defineProperty(document, "visibilityState", origVisibility);
    });

    it("renders exactly one video element with the verification test hook", () => {
        const { getAllByTestId, container } = render(<ProfileAnimatedBackground {...sources} />);
        expect(getAllByTestId("profile-animated-bg-video")).toHaveLength(1);
        expect(container.querySelectorAll(".profile-animated-bg-video")).toHaveLength(1);
    });

    it("starts playing when mounted in view and visible", () => {
        render(<ProfileAnimatedBackground {...sources} />);
        expect(playSpy).toHaveBeenCalled();
    });

    it("warns (dev) when more than one animated video is mounted on the page", () => {
        const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
        render(
            <>
                <ProfileAnimatedBackground {...sources} />
                <ProfileAnimatedBackground {...sources} />
            </>
        );
        expect(warn).toHaveBeenCalledWith(
            expect.stringContaining("animated background videos are mounted")
        );
    });

    it("pauses the video when the document becomes hidden", () => {
        render(<ProfileAnimatedBackground {...sources} />);
        expect(playSpy).toHaveBeenCalled();
        Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
        act(() => {
            document.dispatchEvent(new Event("visibilitychange"));
        });
        expect(pauseSpy).toHaveBeenCalled();
    });

    it("renders nothing when there are no video sources", () => {
        const { container } = render(<ProfileAnimatedBackground poster="x.webp" />);
        expect(container.querySelector("video")).toBeNull();
    });
});
