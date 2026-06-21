import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import StickersPanel from "./StickersPanel";

const baseTheme = (stickers = []) => ({ stickers });

const setup = (props = {}) => {
    const handlers = {
        onAddSticker: vi.fn(),
        onUpdateSticker: vi.fn(),
        onRemoveSticker: vi.fn(),
        onDeselect: vi.fn(),
    };
    const utils = render(
        <StickersPanel theme={baseTheme(props.stickers)} {...handlers} selectedIndex={-1} selectedSticker={null} {...props} />
    );
    return { ...utils, handlers };
};

const selectedSticker = { id: "star-01", x: 50, y: 50, rotation: 0, scale: 1 };

describe("StickersPanel — add palette + selected editor", () => {
    it("shows only the add palette when nothing is selected", () => {
        setup();
        expect(screen.getByLabelText("Add Star sticker")).toBeInTheDocument();
        expect(screen.queryByText("Remove sticker")).not.toBeInTheDocument();
    });

    it("adding a sticker calls onAddSticker with its id", () => {
        const { handlers } = setup();
        fireEvent.click(screen.getByLabelText("Add Heart sticker"));
        expect(handlers.onAddSticker).toHaveBeenCalledWith("heart-01");
    });

    it("reveals the editor for the selected sticker", () => {
        setup({ selectedIndex: 0, selectedSticker, stickers: [selectedSticker] });
        expect(screen.getByText("Star")).toBeInTheDocument();
        expect(screen.getByText("Remove sticker")).toBeInTheDocument();
    });

    it("a color swatch recolors only the selected sticker", () => {
        const { handlers } = setup({ selectedIndex: 0, selectedSticker, stickers: [selectedSticker] });
        fireEvent.click(screen.getByLabelText("Rose"));
        expect(handlers.onUpdateSticker).toHaveBeenCalledWith(0, { color: "#e0556e" });
    });

    it("the accent swatch clears the color override", () => {
        const colored = { ...selectedSticker, color: "#e0556e" };
        const { handlers } = setup({ selectedIndex: 0, selectedSticker: colored, stickers: [colored] });
        fireEvent.click(screen.getByLabelText("Theme accent"));
        expect(handlers.onUpdateSticker).toHaveBeenCalledWith(0, { color: undefined });
    });

    it("the size slider resizes the selected sticker", () => {
        const { handlers } = setup({ selectedIndex: 0, selectedSticker, stickers: [selectedSticker] });
        fireEvent.change(screen.getByLabelText("Sticker size"), { target: { value: "2" } });
        expect(handlers.onUpdateSticker).toHaveBeenCalledWith(0, { scale: 2 });
    });

    it("the rotation slider rotates the selected sticker", () => {
        const { handlers } = setup({ selectedIndex: 0, selectedSticker, stickers: [selectedSticker] });
        fireEvent.change(screen.getByLabelText("Sticker rotation"), { target: { value: "45" } });
        expect(handlers.onUpdateSticker).toHaveBeenCalledWith(0, { rotation: 45 });
    });

    it("remove + done route to their handlers", () => {
        const { handlers } = setup({ selectedIndex: 0, selectedSticker, stickers: [selectedSticker] });
        fireEvent.click(screen.getByText("Remove sticker"));
        expect(handlers.onRemoveSticker).toHaveBeenCalledWith(0);
        fireEvent.click(screen.getByText("Done"));
        expect(handlers.onDeselect).toHaveBeenCalled();
    });
});
