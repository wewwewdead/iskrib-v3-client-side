import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Force the mobile shell on: useMediaQuery always reports a match so the builder
// renders its bottom-sheet / canvas-first layout regardless of jsdom's viewport.
vi.mock("react-responsive", () => ({
    useMediaQuery: () => true,
}));

// No real save request; preview fetch resolves empty.
vi.mock("../../../../API/Api", () => ({
    updateProfileTheme: vi.fn(() => Promise.resolve({ profileTheme: null })),
    getProfilePreview: vi.fn(() =>
        Promise.resolve({ writings: [], media: [], opinions: [], stories: [], pinnedWritings: [] })
    ),
}));

import ProfileBuilder from "./ProfileBuilder";

const userData = {
    name: "Alice",
    username: "alice",
    image_url: null,
    bio: "hi",
    created_at: "2020-01-01",
    background: null,
};

const builderEl = (props = {}, overrides = {}) => (
    <ProfileBuilder
        open
        onClose={vi.fn()}
        onSaved={vi.fn()}
        userData={userData}
        initialTheme={null}
        token="t"
        followerCount={3}
        followingCount={5}
        {...props}
        {...overrides}
    />
);

const setup = (props = {}) => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const utils = render(
        <QueryClientProvider client={client}>{builderEl({ onClose, onSaved, ...props })}</QueryClientProvider>
    );
    const builder = () => utils.container.querySelector(".pt-builder");
    return { ...utils, onClose, onSaved, builder, client };
};

// Tap the sheet grabber: a pointer press/release with no vertical travel reads as
// a tap and cycles the sheet (swiping up/down steps between snap points instead).
const tapGrabber = (grabber) => {
    fireEvent.pointerDown(grabber, { clientY: 100 });
    fireEvent.pointerUp(grabber, { clientY: 100 });
};

describe("ProfileBuilder — mobile shell", () => {
    beforeEach(() => {
        document.body.style.overflow = "";
    });

    it("renders the mobile shell with a horizontal tab rail", () => {
        const { builder, container } = setup();
        expect(builder()).toHaveClass("is-mobile");
        // The tab rail exists and holds the tool tabs (no wrapping in the rail).
        const rail = container.querySelector(".pt-builder-tabs");
        expect(rail).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Colors" })).toBeInTheDocument();
    });

    it("opens collapsed (canvas-first) and the sheet header is present", () => {
        const { builder } = setup();
        expect(builder()).toHaveClass("sheet-collapsed");
        // The grabber header doubles as the expand/collapse control.
        expect(screen.getByRole("button", { name: /tools —/i })).toBeInTheDocument();
    });

    it("selecting a tool opens the bottom sheet to half height", () => {
        const { builder } = setup();
        expect(builder()).toHaveClass("sheet-collapsed");
        fireEvent.click(screen.getByRole("button", { name: "Colors" }));
        expect(builder()).toHaveClass("sheet-half");
        expect(builder()).not.toHaveClass("sheet-collapsed");
    });

    it("tapping the sheet grabber cycles collapsed → half → expanded → collapsed", () => {
        const { builder } = setup();
        const grabber = screen.getByRole("button", { name: /tools —/i });
        expect(builder()).toHaveClass("sheet-collapsed");
        tapGrabber(grabber);
        expect(builder()).toHaveClass("sheet-half");
        tapGrabber(grabber);
        expect(builder()).toHaveClass("sheet-expanded");
        tapGrabber(grabber);
        expect(builder()).toHaveClass("sheet-collapsed");
    });

    it("swiping the grabber up opens the sheet, swiping down closes it", () => {
        const { builder } = setup();
        const grabber = screen.getByRole("button", { name: /tools —/i });
        // Swipe up (negative dy) → collapsed → half.
        fireEvent.pointerDown(grabber, { clientY: 200 });
        fireEvent.pointerUp(grabber, { clientY: 150 });
        expect(builder()).toHaveClass("sheet-half");
        // Swipe down (positive dy) → half → collapsed.
        fireEvent.pointerDown(grabber, { clientY: 150 });
        fireEvent.pointerUp(grabber, { clientY: 200 });
        expect(builder()).toHaveClass("sheet-collapsed");
    });

    it("keeps Save and Cancel reachable in the sticky action bar", () => {
        setup();
        expect(screen.getByRole("button", { name: /save profile/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^cancel$/i })).toBeInTheDocument();
    });

    it("locks body scroll while open and restores it on close", () => {
        const { rerender, client } = setup();
        expect(document.body.style.overflow).toBe("hidden");
        rerender(
            <QueryClientProvider client={client}>{builderEl({}, { open: false })}</QueryClientProvider>
        );
        expect(document.body.style.overflow).not.toBe("hidden");
    });
});
