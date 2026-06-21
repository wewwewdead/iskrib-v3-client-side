import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import BuilderPreview from "./BuilderPreview";
import { getDefaultProfileTheme } from "./profileThemeUtils";

const userData = {
    name: "Alice",
    username: "alice",
    image_url: null,
    bio: "hi",
    created_at: "2020-01-01",
    background: null,
};

const editHandlers = () => ({
    onReorderBlocks: vi.fn(),
    onPatchBlock: vi.fn(),
    onMoveBlock: vi.fn(),
    onToggleBlock: vi.fn(),
    onStickersChange: vi.fn(),
});

const setup = (props = {}) => {
    const handlers = editHandlers();
    const theme = getDefaultProfileTheme(userData);
    const utils = render(
        <BuilderPreview
            theme={theme}
            userData={userData}
            followerCount={3}
            followingCount={5}
            {...handlers}
            {...props}
        />
    );
    return { ...utils, handlers, theme };
};

describe("BuilderPreview — sticker selection", () => {
    it("clicking off a sticker on the canvas deselects it", () => {
        const onSelectSticker = vi.fn();
        const theme = getDefaultProfileTheme(userData);
        theme.stickers = [{ id: "star-01", x: 50, y: 30, rotation: 0, scale: 1 }];
        const { container } = render(
            <BuilderPreview
                theme={theme}
                userData={userData}
                followerCount={1}
                followingCount={1}
                {...editHandlers()}
                selectedStickerIndex={0}
                onSelectSticker={onSelectSticker}
            />
        );
        fireEvent.pointerDown(container.querySelector(".pt-preview-surface"));
        expect(onSelectSticker).toHaveBeenCalledWith(-1);
    });

    it("does not deselect when nothing is selected", () => {
        const onSelectSticker = vi.fn();
        const theme = getDefaultProfileTheme(userData);
        theme.stickers = [{ id: "star-01", x: 50, y: 30, rotation: 0, scale: 1 }];
        const { container } = render(
            <BuilderPreview
                theme={theme}
                userData={userData}
                followerCount={1}
                followingCount={1}
                {...editHandlers()}
                selectedStickerIndex={-1}
                onSelectSticker={onSelectSticker}
            />
        );
        fireEvent.pointerDown(container.querySelector(".pt-preview-surface"));
        expect(onSelectSticker).not.toHaveBeenCalled();
    });
});

describe("BuilderPreview — interactive layout canvas", () => {
    it("renders each visible block with a labelled drag zone", () => {
        setup();
        expect(screen.getByLabelText("Drag to reorder Guestbook")).toBeInTheDocument();
        expect(screen.getByLabelText("Drag to reorder Writings")).toBeInTheDocument();
        // And an edge resize handle per block.
        expect(screen.getByLabelText("Resize Writings")).toBeInTheDocument();
    });

    it("a touch press on a block header selects it (reorder stays grip-only on touch)", () => {
        // On touch the header strip must only SELECT — a reorder has to start from
        // the ⠿ grip — so swiping over a block header scrolls the canvas instead of
        // accidentally reordering. We prove the select path ran via onSelectType.
        const onSelectType = vi.fn();
        setup({ onSelectType, selectedType: null });
        const title = screen.getByText("Writings");
        fireEvent.pointerDown(title, { pointerId: 1, pointerType: "touch" });
        expect(onSelectType).toHaveBeenCalledWith("writings");
    });

    it("hides the per-block toolbar until a block is selected", () => {
        setup();
        // No width chips before selection.
        expect(screen.queryByLabelText("Writings width")).not.toBeInTheDocument();
    });

    it("selecting a block reveals width chips, move and hide controls", () => {
        setup();
        fireEvent.click(screen.getByLabelText("Drag to reorder Writings"));
        const widthGroup = screen.getByLabelText("Writings width");
        expect(within(widthGroup).getByText("Compact")).toBeInTheDocument();
        expect(within(widthGroup).getByText("Half")).toBeInTheDocument();
        expect(within(widthGroup).getByText("Full")).toBeInTheDocument();
        expect(screen.getByLabelText("Move Writings up")).toBeInTheDocument();
        expect(screen.getByLabelText("Move Writings down")).toBeInTheDocument();
        expect(screen.getByLabelText("Hide Writings")).toBeInTheDocument();
    });

    it("a width chip resizes the block via onPatchBlock", () => {
        const { handlers } = setup();
        fireEvent.click(screen.getByLabelText("Drag to reorder Media"));
        fireEvent.click(within(screen.getByLabelText("Media width")).getByText("Half"));
        expect(handlers.onPatchBlock).toHaveBeenCalledWith("media", { width: "half" });
    });

    it("selecting a block reveals a per-container style picker", () => {
        setup();
        fireEvent.click(screen.getByLabelText("Drag to reorder Writings"));
        const styleGroup = screen.getByLabelText("Writings style");
        expect(within(styleGroup).getByText("Theme")).toBeInTheDocument();
        expect(within(styleGroup).getByText("Glass")).toBeInTheDocument();
        expect(within(styleGroup).getByText("Framed")).toBeInTheDocument();
    });

    it("a style chip patches ONLY the selected container's style", () => {
        const { handlers } = setup();
        fireEvent.click(screen.getByLabelText("Drag to reorder Writings"));
        fireEvent.click(within(screen.getByLabelText("Writings style")).getByText("Glass"));
        expect(handlers.onPatchBlock).toHaveBeenCalledWith("writings", { style: "glass" });

        // Switching containers scopes the next edit to the new block only.
        fireEvent.click(screen.getByLabelText("Drag to reorder Media"));
        fireEvent.click(within(screen.getByLabelText("Media style")).getByText("Paper"));
        expect(handlers.onPatchBlock).toHaveBeenCalledWith("media", { style: "paper" });
        // The writings block was never patched with the media edit.
        expect(handlers.onPatchBlock).not.toHaveBeenCalledWith("writings", { style: "paper" });
    });

    it("the resize edge handle snaps width on pointer drag", () => {
        // jsdom has no layout, so give every element a 200px-wide box. With a
        // left edge at 0, a pointer at x=120 is 60% across → snaps to "half".
        const orig = Element.prototype.getBoundingClientRect;
        Element.prototype.getBoundingClientRect = () => ({
            left: 0, right: 200, width: 200, top: 0, bottom: 50, height: 50, x: 0, y: 0,
        });
        try {
            const { handlers } = setup();
            const handle = screen.getByLabelText("Resize Writings");
            fireEvent.pointerDown(handle, { pointerId: 1, clientX: 120 });
            fireEvent.pointerMove(handle, { pointerId: 1, clientX: 120 });
            fireEvent.pointerUp(handle, { pointerId: 1 });
            expect(handlers.onPatchBlock).toHaveBeenCalledWith("writings", { width: "half" });
        } finally {
            Element.prototype.getBoundingClientRect = orig;
        }
    });

    it("move + hide route to the existing draft handlers", () => {
        const { handlers } = setup();
        fireEvent.click(screen.getByLabelText("Drag to reorder Writings"));
        fireEvent.click(screen.getByLabelText("Move Writings down"));
        expect(handlers.onMoveBlock).toHaveBeenCalledWith("writings", "down");
        fireEvent.click(screen.getByLabelText("Hide Writings"));
        expect(handlers.onToggleBlock).toHaveBeenCalledWith("writings");
    });

    it("only one block's toolbar is open at a time", () => {
        setup();
        fireEvent.click(screen.getByLabelText("Drag to reorder Writings"));
        expect(screen.getByLabelText("Writings width")).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText("Drag to reorder Media"));
        expect(screen.getByLabelText("Media width")).toBeInTheDocument();
        expect(screen.queryByLabelText("Writings width")).not.toBeInTheDocument();
    });

    it("falls back to a read-only grid when no edit handlers are supplied", () => {
        render(
            <BuilderPreview
                theme={getDefaultProfileTheme(userData)}
                userData={userData}
                followerCount={1}
                followingCount={1}
            />
        );
        // No drag affordance in read-only mode.
        expect(screen.queryByLabelText("Drag to reorder Writings")).not.toBeInTheDocument();
        // But the block titles still render.
        expect(screen.getByText("Writings")).toBeInTheDocument();
    });
});
