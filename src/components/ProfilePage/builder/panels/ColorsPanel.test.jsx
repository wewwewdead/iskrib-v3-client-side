import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ColorsPanel from "./ColorsPanel";
import { getDefaultProfileTheme } from "../profileThemeUtils";

const userData = { profile_font_color: "#ffffff", created_at: "2020-01-01" };

const setup = (props = {}) => {
    const handlers = {
        onPatchColors: vi.fn(),
        onHeroPatchElement: vi.fn(),
        onClearHeroSelection: vi.fn(),
    };
    const theme = getDefaultProfileTheme(userData);
    const utils = render(
        <ColorsPanel theme={theme} {...handlers} selectedHeroEl={null} selectedHeroElData={null} {...props} />
    );
    return { ...utils, handlers, theme };
};

describe("ColorsPanel — page vs selected-container text color", () => {
    it("edits the page text color when nothing is selected", () => {
        const { handlers } = setup();
        fireEvent.input(document.getElementById("pt-text-color"), { target: { value: "#123456" } });
        expect(handlers.onPatchColors).toHaveBeenCalledWith({ text: "#123456" });
        expect(handlers.onHeroPatchElement).not.toHaveBeenCalled();
    });

    it("retargets the text color to ONLY the selected hero container", () => {
        const { handlers } = setup({
            selectedHeroEl: "name",
            selectedHeroElData: { x: 30, y: 16, w: 60, align: "left", style: "none" },
        });
        // Scope is shown.
        expect(screen.getByText("Name")).toBeInTheDocument();
        fireEvent.input(document.getElementById("pt-text-color"), { target: { value: "#abcdef" } });
        expect(handlers.onHeroPatchElement).toHaveBeenCalledWith("name", { color: "#abcdef" });
        expect(handlers.onPatchColors).not.toHaveBeenCalled();
    });

    it("'Whole page' clears the selection (back to global color)", () => {
        const { handlers } = setup({
            selectedHeroEl: "bio",
            selectedHeroElData: { x: 6, y: 60, w: 80, align: "left", style: "none", color: "#ff0000" },
        });
        fireEvent.click(screen.getByText("Whole page"));
        expect(handlers.onClearHeroSelection).toHaveBeenCalled();
        // Reset clears the override.
        fireEvent.click(screen.getByText("Reset"));
        expect(handlers.onHeroPatchElement).toHaveBeenCalledWith("bio", { color: undefined });
    });

    it("accent color stays global even with a container selected", () => {
        const { handlers } = setup({
            selectedHeroEl: "name",
            selectedHeroElData: { x: 30, y: 16, w: 60, align: "left", style: "none" },
        });
        fireEvent.input(document.getElementById("pt-accent-color"), { target: { value: "#00ff00" } });
        expect(handlers.onPatchColors).toHaveBeenCalledWith({ accent: "#00ff00" });
    });
});
