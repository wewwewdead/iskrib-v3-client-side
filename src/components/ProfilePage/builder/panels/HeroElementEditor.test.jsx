import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import HeroElementEditor from "./HeroElementEditor";

const baseData = { align: "left", style: "none" };

const setup = (data = baseData) => {
    const onPatch = vi.fn();
    render(<HeroElementEditor elementKey="name" data={data} onPatch={onPatch} />);
    return { onPatch };
};

describe("HeroElementEditor — every control scoped to one container", () => {
    it("align, background, font and size all patch the same single element", () => {
        const { onPatch } = setup();
        fireEvent.click(within(screen.getByLabelText("Align")).getByText("Center"));
        fireEvent.click(within(screen.getByLabelText("Background")).getByText("Glass"));
        fireEvent.click(screen.getByText("Lora")); // a font
        fireEvent.click(within(screen.getByLabelText("Text size")).getByText("Spacious"));

        expect(onPatch).toHaveBeenCalledWith("name", { align: "center" });
        expect(onPatch).toHaveBeenCalledWith("name", { style: "glass" });
        expect(onPatch).toHaveBeenCalledWith("name", { font: "lora" });
        expect(onPatch).toHaveBeenCalledWith("name", { size: "spacious" });
        // every call targeted "name" — never any other element
        onPatch.mock.calls.forEach(([key]) => expect(key).toBe("name"));
    });

    it("width, border, corners and break-line each patch only this element", () => {
        const { onPatch } = setup();
        fireEvent.click(within(screen.getByLabelText("Width")).getByText("Narrow"));
        fireEvent.click(within(screen.getByLabelText("Border")).getByText("Dashed"));
        fireEvent.click(within(screen.getByLabelText("Corners")).getByText("Round"));
        fireEvent.click(within(screen.getByLabelText("Break line")).getByText("Line"));

        expect(onPatch).toHaveBeenCalledWith("name", { width: "narrow" });
        expect(onPatch).toHaveBeenCalledWith("name", { border: "dashed" });
        expect(onPatch).toHaveBeenCalledWith("name", { radius: "round" });
        expect(onPatch).toHaveBeenCalledWith("name", { divider: "line" });
        onPatch.mock.calls.forEach(([key]) => expect(key).toBe("name"));
    });

    it("background color patches only this element; Default clears it", () => {
        const { onPatch } = setup({ ...baseData, bgColor: "#222222" });
        const group = screen.getByLabelText("Background color");
        fireEvent.click(within(group).getByLabelText("Blue"));
        expect(onPatch).toHaveBeenCalledWith("name", { bgColor: "#5a8dee" });
        fireEvent.click(within(group).getByLabelText("Default"));
        expect(onPatch).toHaveBeenCalledWith("name", { bgColor: undefined });
    });

    it("text color patches only this element; Default clears it", () => {
        const { onPatch } = setup({ ...baseData, color: "#e0556e" });
        const group = screen.getByLabelText("Text color");
        fireEvent.click(within(group).getByLabelText("Blue"));
        expect(onPatch).toHaveBeenCalledWith("name", { color: "#5a8dee" });
        fireEvent.click(within(group).getByLabelText("Default"));
        expect(onPatch).toHaveBeenCalledWith("name", { color: undefined });
    });

    it("reset clears all styling on the element", () => {
        const { onPatch } = setup({ ...baseData, align: "center", style: "glass", color: "#fff", font: "lora", size: "spacious" });
        fireEvent.click(screen.getByText("Reset this container"));
        expect(onPatch).toHaveBeenCalledWith("name", {
            align: "left",
            width: "full",
            style: "none",
            border: "none",
            radius: "soft",
            divider: "none",
            color: undefined,
            bgColor: undefined,
            font: undefined,
            size: undefined,
            scale: undefined,
        });
    });
});
