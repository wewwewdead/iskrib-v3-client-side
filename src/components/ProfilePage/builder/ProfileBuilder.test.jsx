import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock the API the builder saves through (and the preview fetch) so no real
// request is made.
vi.mock("../../../../API/Api", () => ({
    updateProfileTheme: vi.fn(() => Promise.resolve({ profileTheme: null })),
    getProfilePreview: vi.fn(() =>
        Promise.resolve({ writings: [], media: [], opinions: [], stories: [], pinnedWritings: [] })
    ),
    getProfileGuestbook: vi.fn(() => Promise.resolve({ entries: [] })),
}));

import ProfileBuilder from "./ProfileBuilder";
import { updateProfileTheme } from "../../../../API/Api";

const userData = {
    name: "Alice",
    username: "alice",
    image_url: null,
    bio: "hi",
    created_at: "2020-01-01",
    background: null,
};

const setup = (props = {}) => {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const utils = render(
        <QueryClientProvider client={client}>
            <ProfileBuilder
                open
                onClose={onClose}
                onSaved={onSaved}
                userData={userData}
                initialTheme={null}
                token="t"
                followerCount={3}
                followingCount={5}
                {...props}
            />
        </QueryClientProvider>
    );
    return { ...utils, onClose, onSaved };
};

// The Presets panel is the default tab; clicking a preset mutates the draft.
const makeDirty = () => {
    const presetCards = document.querySelectorAll(".pt-preset-card");
    // Click a preset that is not already active so the draft actually changes.
    const target = Array.from(presetCards).find(
        (b) => b.getAttribute("aria-pressed") !== "true"
    );
    fireEvent.click(target);
};

describe("ProfileBuilder — unsaved-changes guard", () => {
    beforeEach(() => {
        updateProfileTheme.mockClear();
    });

    it("starts clean and closes immediately when there are no edits", () => {
        const { onClose } = setup();
        expect(screen.getByRole("status")).toHaveTextContent("All changes saved");
        fireEvent.click(screen.getByRole("button", { name: /close customizer/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("renders the desktop tool rail as icon tabs with tooltips (tools, not words)", () => {
        setup();
        const colorsTab = screen.getByRole("tab", { name: "Colors" });
        // Tooltip carrier + icon, but no visible word label on the button itself.
        expect(colorsTab).toHaveClass("pt-tip");
        expect(colorsTab).toHaveAttribute("data-tip", "Colors");
        expect(colorsTab.querySelector("svg")).toBeTruthy();
        expect(colorsTab).not.toHaveTextContent("Colors");
        // Switching tab still works via the icon button.
        fireEvent.click(colorsTab);
        expect(colorsTab).toHaveAttribute("aria-selected", "true");
    });

    it("focuses the tool panel on one container when selected (desktop); Done returns to tabs", () => {
        setup();
        // Normal tabbed panel to start.
        expect(screen.getByRole("tab", { name: "Colors" })).toBeInTheDocument();

        // Selecting a container in the canvas focuses the panel on ONLY its editor.
        fireEvent.click(document.querySelector(".pt-pblock"));
        expect(screen.getByText(/only this container is affected/i)).toBeInTheDocument();
        // The global tabs are hidden while a container is focused.
        expect(screen.queryByRole("tab", { name: "Colors" })).not.toBeInTheDocument();

        // "Done" exits back to the normal tabbed panel.
        fireEvent.click(screen.getByRole("button", { name: /^done$/i }));
        expect(screen.getByRole("tab", { name: "Colors" })).toBeInTheDocument();
        expect(screen.queryByText(/only this container is affected/i)).not.toBeInTheDocument();
    });

    it("marks the draft dirty after an edit", () => {
        setup();
        makeDirty();
        expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
    });

    it("guards the close with a discard prompt when there are unsaved edits", () => {
        const { onClose } = setup();
        makeDirty();
        fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
        // Close is NOT called yet — the discard prompt appears instead.
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.getByText(/discard your unsaved changes/i)).toBeInTheDocument();

        // "Keep editing" backs out without closing.
        fireEvent.click(screen.getByRole("button", { name: /keep editing/i }));
        expect(onClose).not.toHaveBeenCalled();
        expect(screen.queryByText(/discard your unsaved changes/i)).not.toBeInTheDocument();

        // Re-trigger and confirm discard closes.
        fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));
        fireEvent.click(screen.getByRole("button", { name: /^discard$/i }));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("global undo reverts a preset back to the opening baseline", () => {
        setup();
        // Undo starts disabled (nothing to undo yet).
        const undoBtn = screen.getByRole("button", { name: /^undo$/i });
        expect(undoBtn).toBeDisabled();

        makeDirty(); // clicking a preset applies it — a committed, undoable change
        expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
        expect(undoBtn).toBeEnabled();

        fireEvent.click(undoBtn);
        // …reverts cleanly back to the opening baseline, and undo disables again.
        expect(screen.getByRole("status")).toHaveTextContent("All changes saved");
        expect(undoBtn).toBeDisabled();
    });

    it("saves the draft and reports a saved state", async () => {
        const { onSaved } = setup();
        makeDirty();
        fireEvent.click(screen.getByRole("button", { name: /save profile/i }));
        await waitFor(() => expect(updateProfileTheme).toHaveBeenCalledTimes(1));
        expect(onSaved).toHaveBeenCalledTimes(1);
        await waitFor(() =>
            expect(screen.getByRole("status")).toHaveTextContent("Saved")
        );
    });
});
