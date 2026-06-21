import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GifCreatorModal from "./GifCreatorModal";
import { generateBackgroundGif } from "../../../utils/generateBackgroundGif";
import { uploadBackgroundGif } from "../../../../API/Api";

vi.mock("../../../utils/generateBackgroundGif", () => ({
    generateBackgroundGif: vi.fn(),
}));

vi.mock("../../../../API/Api", () => ({
    uploadBackgroundGif: vi.fn(),
}));

beforeEach(() => {
    vi.clearAllMocks();
    window.URL.createObjectURL = vi.fn(() => "blob:fake");
    window.URL.revokeObjectURL = vi.fn();
});

describe("GifCreatorModal", () => {
    it("does not render when closed", () => {
        const { container } = render(<GifCreatorModal open={false} />);
        expect(container.firstChild).toBeNull();
    });

    it("opens and shows the built-in presets", () => {
        render(<GifCreatorModal open onClose={vi.fn()} onApply={vi.fn()} token="tok" />);
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Aurora drift" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Floating lights" })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Soft stars" })).toBeInTheDocument();
    });

    it("generates and uploads a GIF + poster, then applies the background", async () => {
        const gifBlob = new Blob(["gif"], { type: "image/gif" });
        const posterBlob = new Blob(["poster"], { type: "image/webp" });
        generateBackgroundGif.mockResolvedValue({ gifBlob, posterBlob });
        uploadBackgroundGif.mockResolvedValue({
            gifUrl: "https://cdn.test/a.gif",
            posterUrl: "https://cdn.test/a.webp",
        });
        const onApply = vi.fn();
        const onClose = vi.fn();

        render(<GifCreatorModal open onClose={onClose} onApply={onApply} token="tok-123" />);

        fireEvent.click(screen.getByRole("button", { name: "Use as background" }));

        await waitFor(() => expect(uploadBackgroundGif).toHaveBeenCalled());

        // generation happened before upload
        expect(generateBackgroundGif).toHaveBeenCalled();

        const [token, formData] = uploadBackgroundGif.mock.calls[0];
        expect(token).toBe("tok-123");
        expect(formData.get("gif")).toBeInstanceOf(Blob);
        expect(formData.get("poster")).toBeInstanceOf(Blob);

        await waitFor(() => expect(onApply).toHaveBeenCalled());
        expect(onApply.mock.calls[0][0]).toMatchObject({
            mediaType: "gif",
            backgroundImage: "url(https://cdn.test/a.gif)",
            backgroundPosterImage: "url(https://cdn.test/a.webp)",
        });
        expect(onClose).toHaveBeenCalled();
    });
});
