import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import GifBackgroundPreview from "./GifBackgroundPreview";

describe("GifBackgroundPreview", () => {
    beforeEach(() => {
        window.URL.createObjectURL = vi.fn(() => "blob:fake-url");
        window.URL.revokeObjectURL = vi.fn();
    });

    it("creates an object URL for the file and renders an animated <img>", () => {
        const file = new File(["gif-bytes"], "anim.gif", { type: "image/gif" });
        const { container } = render(<GifBackgroundPreview file={file} />);
        expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
        const img = container.querySelector("img");
        expect(img).toBeTruthy();
        expect(img.getAttribute("src")).toBe("blob:fake-url");
    });

    it("revokes the object URL on unmount", () => {
        const file = new File(["gif-bytes"], "anim.gif", { type: "image/gif" });
        const { unmount } = render(<GifBackgroundPreview file={file} />);
        unmount();
        expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:fake-url");
    });

    it("renders a provided src without creating an object URL", () => {
        const { container } = render(<GifBackgroundPreview src="https://cdn.test/x.gif" />);
        expect(window.URL.createObjectURL).not.toHaveBeenCalled();
        expect(container.querySelector("img").getAttribute("src")).toBe("https://cdn.test/x.gif");
    });
});
