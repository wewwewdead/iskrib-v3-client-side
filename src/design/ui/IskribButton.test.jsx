import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IskribButton from "./IskribButton";

describe("IskribButton", () => {
    it("renders a real button with the label", () => {
        render(<IskribButton>Sign</IskribButton>);
        const btn = screen.getByRole("button", { name: "Sign" });
        expect(btn.tagName).toBe("BUTTON");
    });

    it("applies variant and size classes", () => {
        render(
            <IskribButton variant="danger" size="sm">
                Delete
            </IskribButton>
        );
        const btn = screen.getByRole("button");
        expect(btn).toHaveClass("iskrib-btn--danger");
        expect(btn).toHaveClass("iskrib-btn--sm");
    });

    it("loading implies disabled and sets aria-busy, suppressing onClick", () => {
        const onClick = vi.fn();
        render(
            <IskribButton loading onClick={onClick}>
                Save
            </IskribButton>
        );
        const btn = screen.getByRole("button");
        expect(btn).toBeDisabled();
        expect(btn).toHaveAttribute("aria-busy", "true");
        fireEvent.click(btn);
        expect(onClick).not.toHaveBeenCalled();
    });

    it("disabled suppresses onClick; enabled fires it", () => {
        const onClick = vi.fn();
        const { rerender } = render(
            <IskribButton disabled onClick={onClick}>
                Go
            </IskribButton>
        );
        fireEvent.click(screen.getByRole("button"));
        expect(onClick).not.toHaveBeenCalled();

        rerender(<IskribButton onClick={onClick}>Go</IskribButton>);
        fireEvent.click(screen.getByRole("button"));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
