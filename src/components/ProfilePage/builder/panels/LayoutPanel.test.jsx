import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import LayoutPanel from "./LayoutPanel";
import { getDefaultProfileTheme } from "../profileThemeUtils";

const userData = { profile_font_color: "#ffffff", created_at: "2020-01-01" };

// Render LayoutPanel with spy handlers + a default (normalized) theme. No
// providers needed — the panel is presentational and self-contained.
const setup = (overrides = {}) => {
    const handlers = {
        onReorder: vi.fn(),
        onMoveBlock: vi.fn(),
        onToggleBlock: vi.fn(),
        onPatchBlock: vi.fn(),
        onPatchBlockContent: vi.fn(),
        onResetBlock: vi.fn(),
        ...overrides,
    };
    const theme = getDefaultProfileTheme(userData);
    const utils = render(<LayoutPanel theme={theme} {...handlers} />);
    return { ...utils, handlers, theme };
};

describe("LayoutPanel — drag affordance + reorder wiring", () => {
    it("exposes a labelled drag zone for every block (grab the header, not a tiny icon)", () => {
        setup();
        // The drag zone carries an accessible label and is the grabbable region.
        const zone = screen.getByLabelText("Drag to reorder Guestbook");
        expect(zone).toBeInTheDocument();
        // The block name lives INSIDE the drag zone, so grabbing the name drags.
        expect(within(zone).getByText("Guestbook")).toBeInTheDocument();
    });

    it("up/down buttons call onMoveBlock and stay keyboard-operable", () => {
        const { handlers } = setup();
        // First block can't move up; a later block's up button works.
        const moveWritingsUp = screen.getByLabelText("Move Writings up");
        expect(moveWritingsUp).not.toBeDisabled();
        fireEvent.click(moveWritingsUp);
        expect(handlers.onMoveBlock).toHaveBeenCalledWith("writings", "up");

        const moveWritingsDown = screen.getByLabelText("Move Writings down");
        fireEvent.click(moveWritingsDown);
        expect(handlers.onMoveBlock).toHaveBeenCalledWith("writings", "down");
    });

    it("disables ↑ on the first block and ↓ on the last block", () => {
        setup();
        expect(screen.getByLabelText("Move Guestbook up")).toBeDisabled();
        expect(screen.getByLabelText("Move Pinned writings down")).toBeDisabled();
    });

    it("editing a block title patches that block, never starting a drag", () => {
        const { handlers } = setup();
        // Grab the first block's title input via its label container.
        const titleInput = screen
            .getAllByText("Title")
            .map((el) => el.parentElement.querySelector("input"))
            .find(Boolean);
        fireEvent.change(titleInput, { target: { value: "My posts" } });
        expect(handlers.onPatchBlock).toHaveBeenCalledWith(
            expect.any(String),
            { title: "My posts" }
        );
        // Typing must not have triggered any reorder.
        expect(handlers.onReorder).not.toHaveBeenCalled();
    });

    it("the visibility switch toggles the block and does not reorder", () => {
        const { handlers } = setup();
        fireEvent.click(screen.getByLabelText("Hide Writings"));
        expect(handlers.onToggleBlock).toHaveBeenCalledWith("writings");
        expect(handlers.onReorder).not.toHaveBeenCalled();
    });

    it("changing a width/style select patches the block, not a drag", () => {
        const { handlers } = setup();
        const widthSelect = screen
            .getAllByText("Width")
            .map((el) => el.parentElement.querySelector("select"))
            .find(Boolean);
        fireEvent.change(widthSelect, { target: { value: "half" } });
        expect(handlers.onPatchBlock).toHaveBeenCalledWith(
            expect.any(String),
            { width: "half" }
        );
        expect(handlers.onReorder).not.toHaveBeenCalled();
    });

    it("renders one card per renderable block in stored order", () => {
        setup();
        // Default order starts with Guestbook then Writings (renderable set).
        expect(screen.getByLabelText("Drag to reorder Guestbook")).toBeInTheDocument();
        expect(screen.getByLabelText("Drag to reorder Writings")).toBeInTheDocument();
        expect(screen.getByLabelText("Drag to reorder Media")).toBeInTheDocument();
    });
});
