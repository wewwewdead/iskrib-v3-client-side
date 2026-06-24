import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BlockDesignControls, BlockContentControls } from "./blockStudioControls";
import { ALLOWED_BLOCK_CONTENT_BY_TYPE } from "../profileThemeConstants";

const block = { type: "writings", style: "inherit", title: "Writings" };

describe("BlockDesignControls — Design Studio tool tray (V5.1)", () => {
    it("renders the expanded tool set as icon tabs", () => {
        render(<BlockDesignControls block={block} onPatchDesign={vi.fn()} />);
        ["Skins", "Fill", "Pattern", "Surface", "Tone", "Text color", "Font", "Corners", "Border", "Shadow", "Padding", "Title", "Effects", "Accent"].forEach((name) =>
            expect(screen.getByRole("tab", { name })).toBeInTheDocument()
        );
    });

    it("the dedicated Pattern tool adds grid lines (turns the fill into a pattern)", () => {
        const onPatchDesign = vi.fn();
        render(<BlockDesignControls block={block} onPatchDesign={onPatchDesign} />);
        fireEvent.click(screen.getByRole("tab", { name: "Pattern" }));
        fireEvent.click(screen.getByRole("button", { name: "Grid" }));
        expect(onPatchDesign).toHaveBeenCalledWith(
            "writings",
            expect.objectContaining({ fillType: "pattern", pattern: "grid", patternColor: "#000000" })
        );
    });

    it("applies a Skin as a one-tap design bundle (resets base + applies skin)", () => {
        const onPatchDesign = vi.fn();
        render(<BlockDesignControls block={block} onPatchDesign={onPatchDesign} />);
        // Skins is the default-open tool.
        fireEvent.click(screen.getByRole("button", { name: /neon/i }));
        expect(onPatchDesign).toHaveBeenCalledTimes(1);
        const [type, patch] = onPatchDesign.mock.calls[0];
        expect(type).toBe("writings");
        expect(patch.fillType).toBe("gradient");
        expect(patch.gradFrom).toBe("#7c3aed");
        expect(patch.surface).toBeDefined(); // base-9 reset bundled in
    });

    it("the Fill tool switches to a gradient and seeds the stops", () => {
        const onPatchDesign = vi.fn();
        render(<BlockDesignControls block={block} onPatchDesign={onPatchDesign} />);
        fireEvent.click(screen.getByRole("tab", { name: "Fill" }));
        fireEvent.click(screen.getByRole("button", { name: "Gradient" }));
        expect(onPatchDesign).toHaveBeenCalledWith(
            "writings",
            expect.objectContaining({ fillType: "gradient", gradFrom: "#7c3aed", gradTo: "#2563eb" })
        );
    });

    it("picking a Text color patches design.textColor (validated swatch)", () => {
        const onPatchDesign = vi.fn();
        render(<BlockDesignControls block={block} onPatchDesign={onPatchDesign} />);
        fireEvent.click(screen.getByRole("tab", { name: "Text color" }));
        fireEvent.click(screen.getByLabelText("Rose"));
        expect(onPatchDesign).toHaveBeenCalledWith("writings", { textColor: "#e0556e" });
    });

    it("choosing a Font patches design.font and offers the expanded font set", () => {
        const onPatchDesign = vi.fn();
        render(<BlockDesignControls block={block} onPatchDesign={onPatchDesign} />);
        fireEvent.click(screen.getByRole("tab", { name: "Font" }));
        fireEvent.click(screen.getByRole("button", { name: "Space Grotesk" }));
        expect(onPatchDesign).toHaveBeenCalledWith("writings", { font: "spaceGrotesk" });
    });

    it("a Corners slider patches design.radiusPx (fine numeric control)", () => {
        const onPatchDesign = vi.fn();
        render(<BlockDesignControls block={block} onPatchDesign={onPatchDesign} />);
        fireEvent.click(screen.getByRole("tab", { name: "Corners" }));
        fireEvent.change(screen.getByLabelText("Fine radius"), { target: { value: "30" } });
        expect(onPatchDesign).toHaveBeenCalledWith("writings", { radiusPx: 30 });
    });

    it("an Effects tilt slider patches design.tilt", () => {
        const onPatchDesign = vi.fn();
        render(<BlockDesignControls block={block} onPatchDesign={onPatchDesign} />);
        fireEvent.click(screen.getByRole("tab", { name: "Effects" }));
        fireEvent.change(screen.getByLabelText("Tilt"), { target: { value: "-3" } });
        expect(onPatchDesign).toHaveBeenCalledWith("writings", { tilt: -3 });
    });

    it("a surface chip still patches design.surface (enum tools unchanged)", () => {
        const onPatchDesign = vi.fn();
        render(<BlockDesignControls block={block} onPatchDesign={onPatchDesign} />);
        fireEvent.click(screen.getByRole("tab", { name: "Surface" }));
        fireEvent.click(screen.getByRole("button", { name: "Paper" }));
        expect(onPatchDesign).toHaveBeenCalledWith("writings", { surface: "paper" });
    });
});

describe("BlockContentControls — icon tool tray", () => {
    it("renders content tools as icons and patches via the active tool", () => {
        const onPatchContent = vi.fn();
        render(
            <BlockContentControls
                block={block}
                spec={ALLOWED_BLOCK_CONTENT_BY_TYPE.writings}
                onPatchContent={onPatchContent}
            />
        );
        expect(screen.getByRole("tab", { name: "Count" })).toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "2" }));
        expect(onPatchContent).toHaveBeenCalledWith("writings", { count: 2 });
    });
});
