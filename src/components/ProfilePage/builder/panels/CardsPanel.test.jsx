import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import CardsPanel from "./CardsPanel";
import { getDefaultProfileTheme } from "../profileThemeUtils";

const userData = { profile_font_color: "#ffffff", created_at: "2020-01-01" };

const setup = (props = {}) => {
    const handlers = {
        onPatchCards: vi.fn(),
        onPatchBlockCard: vi.fn(),
        onResetBlockCard: vi.fn(),
        onClearSelection: vi.fn(),
    };
    const theme = getDefaultProfileTheme(userData);
    const utils = render(<CardsPanel theme={theme} {...handlers} selectedBlock={null} {...props} />);
    return { ...utils, handlers, theme };
};

describe("CardsPanel — page vs per-container scope", () => {
    it("edits the whole page when nothing is selected", () => {
        const { handlers } = setup();
        expect(screen.getByText("Editing the whole page")).toBeInTheDocument();
        fireEvent.click(within(screen.getByLabelText("Card style")).getByText("Paper"));
        expect(handlers.onPatchCards).toHaveBeenCalledWith({ style: "paper" });
        expect(handlers.onPatchBlockCard).not.toHaveBeenCalled();
    });

    it("edits only the selected container's card when one is selected", () => {
        const block = { type: "writings", style: "inherit" }; // no card override yet
        const { handlers } = setup({ selectedBlock: block });
        // Scope header names the container.
        expect(screen.getByText("Writings")).toBeInTheDocument();
        fireEvent.click(within(screen.getByLabelText("Card corners")).getByText("Sharp"));
        expect(handlers.onPatchBlockCard).toHaveBeenCalledWith("writings", { radius: "sharp" });
        expect(handlers.onPatchCards).not.toHaveBeenCalled();
    });

    it("shows the controls seeded from the block's existing override", () => {
        const block = {
            type: "media",
            card: { style: "minimal", radius: "sharp", border: "none", shadow: "none" },
        };
        setup({ selectedBlock: block });
        // The active style chip reflects the block override, not the page default.
        const styleGroup = screen.getByLabelText("Card style");
        expect(within(styleGroup).getByText("Minimal")).toHaveAttribute("aria-pressed", "true");
    });

    it("'Edit whole page' clears the selection", () => {
        const { handlers } = setup({ selectedBlock: { type: "writings", style: "inherit" } });
        fireEvent.click(screen.getByText("Edit whole page"));
        expect(handlers.onClearSelection).toHaveBeenCalled();
    });

    it("offers a reset only when the block has an override", () => {
        const { handlers, rerender, theme } = setup({
            selectedBlock: { type: "writings", card: { style: "paper", radius: "soft", border: "soft", shadow: "soft" } },
        });
        fireEvent.click(screen.getByText("Reset to page style"));
        expect(handlers.onResetBlockCard).toHaveBeenCalledWith("writings");

        // No reset button when the block has no override yet.
        rerender(
            <CardsPanel
                theme={theme}
                onPatchCards={handlers.onPatchCards}
                onPatchBlockCard={handlers.onPatchBlockCard}
                onResetBlockCard={handlers.onResetBlockCard}
                onClearSelection={handlers.onClearSelection}
                selectedBlock={{ type: "writings", style: "inherit" }}
            />
        );
        expect(screen.queryByText("Reset to page style")).not.toBeInTheDocument();
    });
});
