import { describe, it, expect, vi, afterEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import StickerLayer from "./StickerLayer";

// jsdom has no layout, so give the sticker layer a 200×200 box at the origin →
// the (50%,50%) sticker sits at center (100,100) and the angle/distance math runs.
const origRect = Element.prototype.getBoundingClientRect;
afterEach(() => {
    Element.prototype.getBoundingClientRect = origRect;
});
const mockLayout = () => {
    Element.prototype.getBoundingClientRect = () => ({
        left: 0, top: 0, right: 200, bottom: 200, width: 200, height: 200, x: 0, y: 0,
    });
};

const setup = (stickerOverrides = {}) => {
    const onChange = vi.fn();
    const onSelectSticker = vi.fn();
    const sticker = { id: "star-01", x: 50, y: 50, rotation: 0, scale: 1, ...stickerOverrides };
    const { container } = render(
        <StickerLayer
            stickers={[sticker]}
            editable
            onChange={onChange}
            accentColor="#d4a853"
            selectedIndex={0}
            onSelectSticker={onSelectSticker}
        />
    );
    return { container, onChange, onSelectSticker };
};

describe("StickerLayer — on-canvas handles", () => {
    it("renders resize + rotate handles on the selected sticker", () => {
        const { container } = setup();
        expect(container.querySelector(".pt-sticker-resize")).toBeTruthy();
        expect(container.querySelector(".pt-sticker-rotate")).toBeTruthy();
    });

    it("does not render handles when the sticker isn't selected", () => {
        const onChange = vi.fn();
        const { container } = render(
            <StickerLayer
                stickers={[{ id: "star-01", x: 50, y: 50, rotation: 0, scale: 1 }]}
                editable
                onChange={onChange}
                selectedIndex={-1}
            />
        );
        expect(container.querySelector(".pt-sticker-resize")).toBeNull();
        expect(container.querySelector(".pt-sticker-rotate")).toBeNull();
    });

    it("dragging the rotate knob updates rotation (pointer to the right → 90°)", () => {
        mockLayout();
        const { container, onChange } = setup();
        const knob = container.querySelector(".pt-sticker-rotate");
        fireEvent.pointerDown(knob, { pointerId: 1, clientX: 100, clientY: 60 });
        fireEvent.pointerMove(knob, { pointerId: 1, clientX: 110, clientY: 100 });
        fireEvent.pointerUp(knob, { pointerId: 1 });
        expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ rotation: 90 })]);
    });

    it("dragging the resize handle updates scale (distance / base radius)", () => {
        mockLayout();
        const { container, onChange } = setup();
        const handle = container.querySelector(".pt-sticker-resize");
        // 48px from center (100,100) → scale 48 / 24 = 2.
        fireEvent.pointerDown(handle, { pointerId: 1, clientX: 120, clientY: 100 });
        fireEvent.pointerMove(handle, { pointerId: 1, clientX: 148, clientY: 100 });
        fireEvent.pointerUp(handle, { pointerId: 1 });
        expect(onChange).toHaveBeenCalledWith([expect.objectContaining({ scale: 2 })]);
    });

    it("selecting via a handle reports the index up", () => {
        mockLayout();
        const { container, onSelectSticker } = setup();
        fireEvent.pointerDown(container.querySelector(".pt-sticker-rotate"), { pointerId: 1, clientX: 100, clientY: 60 });
        expect(onSelectSticker).toHaveBeenCalledWith(0);
    });
});
