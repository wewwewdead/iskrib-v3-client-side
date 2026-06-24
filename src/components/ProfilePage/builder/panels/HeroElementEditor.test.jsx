import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import HeroElementEditor from "./HeroElementEditor";

const baseData = { align: "left" };

const setup = (data = baseData) => {
    const onPatch = vi.fn();
    render(<HeroElementEditor elementKey="name" data={data} onPatch={onPatch} />);
    return { onPatch };
};

describe("HeroElementEditor — hero controls + container Design tray (V5.2)", () => {
    it("align / width / break line / text size patch the flat element fields", () => {
        const { onPatch } = setup();
        fireEvent.click(within(screen.getByLabelText("Align")).getByText("Center"));
        fireEvent.click(within(screen.getByLabelText("Width")).getByText("Narrow"));
        fireEvent.click(within(screen.getByLabelText("Break line")).getByText("Line"));
        fireEvent.click(within(screen.getByLabelText("Text size")).getByText("Spacious"));
        expect(onPatch).toHaveBeenCalledWith("name", { align: "center" });
        expect(onPatch).toHaveBeenCalledWith("name", { width: "narrow" });
        expect(onPatch).toHaveBeenCalledWith("name", { divider: "line" });
        expect(onPatch).toHaveBeenCalledWith("name", expect.objectContaining({ size: "spacious" }));
        onPatch.mock.calls.forEach(([key]) => expect(key).toBe("name"));
    });

    it("the Design tray styles the element via its `design` object (same tools as containers)", () => {
        const { onPatch } = setup();
        fireEvent.click(screen.getByRole("tab", { name: "Surface" }));
        fireEvent.click(screen.getByRole("button", { name: "Paper" }));
        expect(onPatch).toHaveBeenCalledWith("name", { design: expect.objectContaining({ surface: "paper" }) });

        // A container-only capability now on the hero: tilt (Effects tool).
        fireEvent.click(screen.getByRole("tab", { name: "Effects" }));
        fireEvent.change(screen.getByLabelText("Tilt"), { target: { value: "-3" } });
        expect(onPatch).toHaveBeenCalledWith("name", { design: expect.objectContaining({ tilt: -3 }) });
    });

    it("seeds the design tray from legacy styling so an existing look is carried over", () => {
        const { onPatch } = setup({ ...baseData, style: "glass", color: "#e0556e", font: "lora" });
        fireEvent.click(screen.getByRole("tab", { name: "Surface" }));
        fireEvent.click(screen.getByRole("button", { name: "Minimal" }));
        const call = onPatch.mock.calls.find(([, p]) => p.design);
        expect(call[1].design.surface).toBe("minimal");
        expect(call[1].design.textColor).toBe("#e0556e");
        expect(call[1].design.font).toBe("lora");
    });

    it("does NOT surface the container-only Skins / Padding / Title tools", () => {
        setup();
        expect(screen.queryByRole("tab", { name: "Skins" })).not.toBeInTheDocument();
        expect(screen.queryByRole("tab", { name: "Padding" })).not.toBeInTheDocument();
        expect(screen.queryByRole("tab", { name: "Title" })).not.toBeInTheDocument();
        // ...but the styling tools ARE present.
        expect(screen.getByRole("tab", { name: "Fill" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Shadow" })).toBeInTheDocument();
        expect(screen.getByRole("tab", { name: "Text color" })).toBeInTheDocument();
    });

    it("reset clears the element's styling + design", () => {
        const { onPatch } = setup({ ...baseData, style: "glass", design: { surface: "glass" } });
        fireEvent.click(screen.getByText("Reset this container"));
        const [, patch] = onPatch.mock.calls[0];
        expect(patch.design).toBeUndefined();
        expect(patch.style).toBeUndefined();
        expect(patch.align).toBe("left");
    });
});
