import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock the API the builder saves through so no real request is made.
vi.mock("../../../../API/Api", () => ({
    updateProfileTheme: vi.fn(() => Promise.resolve({ profileTheme: null })),
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
    const utils = render(
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

    it("lets the user undo a preset, restoring the previous presentation", () => {
        setup();
        makeDirty(); // clicking a preset applies it
        expect(screen.getByRole("status")).toHaveTextContent("Unsaved changes");
        // The undo affordance appears…
        const undoBtn = screen.getByRole("button", { name: /^undo$/i });
        fireEvent.click(undoBtn);
        // …and reverts cleanly back to the opening baseline.
        expect(screen.getByRole("status")).toHaveTextContent("All changes saved");
        expect(screen.queryByRole("button", { name: /^undo$/i })).not.toBeInTheDocument();
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
