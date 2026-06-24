import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Force the mobile shell on: useMediaQuery always reports a match so the builder
// renders its V5 container-first canvas (no tool sheet) regardless of the viewport.
vi.mock("react-responsive", () => ({
    useMediaQuery: () => true,
}));

// No real save request; preview fetch resolves empty.
vi.mock("../../../../API/Api", () => ({
    updateProfileTheme: vi.fn(() => Promise.resolve({ profileTheme: null })),
    getProfilePreview: vi.fn(() =>
        Promise.resolve({ writings: [], media: [], opinions: [], stories: [], pinnedWritings: [] })
    ),
    getProfileGuestbook: vi.fn(() => Promise.resolve({ entries: [] })),
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

describe("ProfileBuilder — mobile room-builder (container-first, no sheet)", () => {
    beforeEach(() => {
        document.body.style.overflow = "";
    });

    it("renders the mobile shell with NO tool sheet or tab rail", () => {
        const { builder, container } = setup();
        expect(builder()).toHaveClass("is-mobile");
        // The whole point: the bottom sheet + tab rail are gone on mobile.
        expect(container.querySelector(".pt-builder-tools")).toBeNull();
        expect(container.querySelector(".pt-builder-tabs")).toBeNull();
    });

    it("shows a tappable Page container that opens the global theme tools inline", () => {
        const { container } = setup();
        const pageBtn = screen.getByRole("button", { name: /page.*theme/i });
        // Closed by default.
        expect(container.querySelector(".pt-page-container.is-selected")).toBeNull();
        fireEvent.click(pageBtn);
        expect(container.querySelector(".pt-page-container.is-selected")).toBeTruthy();
        // The accordion exposes the global tool sections inline.
        expect(screen.getByRole("button", { name: /^presets$/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /colors.*background/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^type$/i })).toBeInTheDocument();
    });

    it("tapping a container opens its full editor inline (content + design)", () => {
        const { container } = setup();
        fireEvent.click(screen.getByLabelText("Drag to reorder Writings"));
        const editor = container.querySelector(".pt-pblock__edit--studio");
        expect(editor).toBeTruthy();
        // The container's FULL per-container controls live inside it.
        expect(within(editor).getByRole("button", { name: /content/i })).toBeInTheDocument();
        expect(within(editor).getByRole("button", { name: /design/i })).toBeInTheDocument();
    });

    it("only one inline editor is open at a time (Page selection closes a container)", () => {
        const { container } = setup();
        fireEvent.click(screen.getByLabelText("Drag to reorder Writings"));
        expect(container.querySelector(".pt-pblock__edit--studio")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: /page.*theme/i }));
        expect(container.querySelector(".pt-pblock__edit--studio")).toBeNull();
        expect(container.querySelector(".pt-page-container.is-selected")).toBeTruthy();
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
