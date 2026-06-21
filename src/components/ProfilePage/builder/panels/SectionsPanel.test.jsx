import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import SectionsPanel from "./SectionsPanel";
import { getDefaultProfileTheme } from "../profileThemeUtils";

const userData = { profile_font_color: "#fff", created_at: "2020-01-01" };

const setup = (props = {}) => {
    const handlers = {
        onToggleSection: vi.fn(),
        onHeroPatchElement: vi.fn(),
        onClearHeroSelection: vi.fn(),
    };
    const theme = getDefaultProfileTheme(userData);
    const utils = render(
        <SectionsPanel theme={theme} {...handlers} selectedHeroEl={null} selectedHeroElData={null} {...props} />
    );
    return { ...utils, handlers, theme };
};

describe("SectionsPanel — header reorder hint + per-element editor", () => {
    it("shows the per-element editor only when an element is selected", () => {
        setup();
        expect(screen.queryByText(/^Editing/)).not.toBeInTheDocument();
    });

    it("edits ONLY the selected element's align/background", () => {
        const { handlers } = setup({
            selectedHeroEl: "name",
            selectedHeroElData: { x: 30, y: 16, w: 60, align: "left", style: "none" },
        });
        expect(screen.getByText("Name")).toBeInTheDocument();

        fireEvent.click(within(screen.getByLabelText("Element alignment")).getByText("Center"));
        expect(handlers.onHeroPatchElement).toHaveBeenCalledWith("name", { align: "center" });

        fireEvent.click(within(screen.getByLabelText("Element background")).getByText("Glass"));
        expect(handlers.onHeroPatchElement).toHaveBeenCalledWith("name", { style: "glass" });

        // never touched any other element
        expect(handlers.onHeroPatchElement).not.toHaveBeenCalledWith("bio", expect.anything());
    });

    it("sets a text color on ONLY the selected element", () => {
        const { handlers } = setup({
            selectedHeroEl: "name",
            selectedHeroElData: { x: 30, y: 16, w: 60, align: "left", style: "none" },
        });
        const group = screen.getByLabelText("Element text color");
        fireEvent.click(within(group).getByLabelText("Rose"));
        expect(handlers.onHeroPatchElement).toHaveBeenCalledWith("name", { color: "#e0556e" });
        // Default swatch clears the override (back to the page color).
        fireEvent.click(within(group).getByLabelText("Default"));
        expect(handlers.onHeroPatchElement).toHaveBeenCalledWith("name", { color: undefined });
    });

    it("'Done' clears the hero selection", () => {
        const { handlers } = setup({
            selectedHeroEl: "bio",
            selectedHeroElData: { x: 10, y: 60, w: 80, align: "left", style: "none" },
        });
        fireEvent.click(screen.getByText("Done"));
        expect(handlers.onClearHeroSelection).toHaveBeenCalled();
    });
});
