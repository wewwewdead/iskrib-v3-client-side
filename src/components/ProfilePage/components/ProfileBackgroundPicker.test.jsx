import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ProfileBackgroundPicker from "./ProfileBackgroundPicker";

const baseProps = {
    show: true,
    handleBgOnchange: vi.fn(),
    bgInputRef: { current: null },
    gradients: [{ style: { background: "linear-gradient(#000,#fff)" } }],
    gradientPicked: null,
    handleSelectGradient: vi.fn(),
    handleInsertBgImage: vi.fn(),
    imageSrc: null,
    crop: { x: 0, y: 0 },
    zoom: 1,
    setCrop: vi.fn(),
    setZoom: vi.fn(),
    setCropAreaPixels: vi.fn(),
    handleRemoveBgPreview: vi.fn(),
    handleHideGradientPicker: vi.fn(),
    handleSaveProfileConfig: vi.fn(),
    isUpdatingProfileConfig: false,
    gifInputRef: { current: null },
    handleInsertGif: vi.fn(),
    handleGifInputChange: vi.fn(),
    pendingGifFile: null,
    handleRemoveGif: vi.fn(),
    onOpenGifCreator: vi.fn(),
    gifError: "",
};

beforeEach(() => {
    window.URL.createObjectURL = vi.fn(() => "blob:fake");
    window.URL.revokeObjectURL = vi.fn();
});

describe("ProfileBackgroundPicker", () => {
    it("renders the three background tabs", () => {
        render(<ProfileBackgroundPicker {...baseProps} />);
        expect(screen.getByRole("tab", { name: "Gradient" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Image" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "GIF" })).toBeInTheDocument();
    });

    it("shows Upload GIF and Create GIF controls with the subtlety note on the GIF tab", () => {
        render(<ProfileBackgroundPicker {...baseProps} />);
        fireEvent.click(screen.getByRole("tab", { name: "GIF" }));
        expect(screen.getByRole("button", { name: "Upload GIF" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Create GIF" })).toBeInTheDocument();
        expect(screen.getByText(/motion only/i)).toBeInTheDocument();
    });

    it("opens the GIF file dialog and the creator from the GIF tab", () => {
        render(<ProfileBackgroundPicker {...baseProps} />);
        fireEvent.click(screen.getByRole("tab", { name: "GIF" }));
        fireEvent.click(screen.getByRole("button", { name: "Upload GIF" }));
        expect(baseProps.handleInsertGif).toHaveBeenCalled();
        fireEvent.click(screen.getByRole("button", { name: "Create GIF" }));
        expect(baseProps.onOpenGifCreator).toHaveBeenCalled();
    });

    it("shows a GIF preview (no cropper) and removes it via the remove button", () => {
        const file = new File(["g"], "anim.gif", { type: "image/gif" });
        const handleRemoveGif = vi.fn();
        render(
            <ProfileBackgroundPicker {...baseProps} pendingGifFile={file} handleRemoveGif={handleRemoveGif} />
        );
        fireEvent.click(screen.getByRole("tab", { name: "GIF" }));
        expect(screen.getByRole("button", { name: "Remove GIF" })).toBeInTheDocument();
        // The upload/create buttons are hidden once a GIF is pending.
        expect(screen.queryByRole("button", { name: "Upload GIF" })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "Remove GIF" }));
        expect(handleRemoveGif).toHaveBeenCalled();
    });

    it("shows a friendly GIF error when provided", () => {
        render(<ProfileBackgroundPicker {...baseProps} gifError="That GIF is too large." />);
        fireEvent.click(screen.getByRole("tab", { name: "GIF" }));
        expect(screen.getByText("That GIF is too large.")).toBeInTheDocument();
    });
});
