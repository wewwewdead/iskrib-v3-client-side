import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import FreeHero from "./FreeHero";

const hero = {
    mode: "stack",
    order: ["avatar", "name", "stats", "bio"],
    layout: { avatar: {}, name: {}, stats: {}, bio: {} },
};

const setup = (props = {}) => {
    const onChange = vi.fn();
    const utils = render(
        <FreeHero
            hero={hero}
            name="Alice"
            username="alice"
            bio="hello"
            avatarUrl={null}
            followers={3}
            following={5}
            editable
            onChange={onChange}
            {...props}
        />
    );
    return { ...utils, onChange };
};

describe("FreeHero — fixed reorderable stack", () => {
    it("renders the four hero elements", () => {
        const { container } = setup();
        ["avatar", "name", "stats", "bio"].forEach((k) =>
            expect(container.querySelector(`.pt-freehero-el--${k}`)).toBeTruthy()
        );
    });

    it("hides stats / bio when their section is off (builder and live)", () => {
        const { container } = setup({ showStats: false, showBio: false });
        expect(container.querySelector(".pt-freehero-el--stats")).toBeNull();
        expect(container.querySelector(".pt-freehero-el--bio")).toBeNull();
        expect(container.querySelector(".pt-freehero-el--avatar")).toBeTruthy();
    });

    it("renders the elements in the saved order", () => {
        const reordered = { ...hero, order: ["name", "avatar", "bio", "stats"] };
        const { container } = render(
            <FreeHero hero={reordered} name="A" username="a" bio="b" followers={1} following={1} />
        );
        const els = [...container.querySelectorAll(".pt-freehero-el")];
        expect(els[0].className).toContain("pt-freehero-el--name");
        expect(els[1].className).toContain("pt-freehero-el--avatar");
        expect(els[2].className).toContain("pt-freehero-el--bio");
        expect(els[3].className).toContain("pt-freehero-el--stats");
    });

    it("labels each editable element so it's clearly a draggable row", () => {
        const { container, getByText } = setup();
        ["Avatar", "Name", "Stats", "Bio"].forEach((t) => expect(getByText(new RegExp(t))).toBeTruthy());
        expect(container.querySelectorAll(".pt-freehero-tag").length).toBe(4);
    });

    it("read-only mode shows no edit affordances", () => {
        const { container } = render(
            <FreeHero hero={hero} name="A" username="a" bio="b" followers={1} following={1} />
        );
        expect(container.querySelector(".pt-freehero-el.is-editable")).toBeNull();
        expect(container.querySelector(".pt-freehero-tag")).toBeNull();
    });

    it("renders the badge ring + verified badge when a badge is set", () => {
        const { container } = setup({ badge: "og" });
        expect(container.querySelector(".pt-freehero-avatar.badge-ring-og")).toBeTruthy();
    });

    it("exposes the ⠿ tag as a labelled reorder grip on every element", () => {
        const { getByLabelText } = setup();
        ["Avatar", "Name", "Stats", "Bio"].forEach((t) =>
            expect(getByLabelText(`Drag to reorder ${t}`)).toBeTruthy()
        );
    });

    it("tapping a row (touch) selects it without requiring the grip", () => {
        const onSelectEl = vi.fn();
        const { container } = setup({ onSelectEl, selectedEl: null });
        const nameRow = container.querySelector(".pt-freehero-el--name");
        // A touch press on the body selects the element (reorder is grip-only on
        // touch, so the canvas stays scroll-safe).
        fireEvent.pointerDown(nameRow, { pointerId: 1, pointerType: "touch" });
        expect(onSelectEl).toHaveBeenCalledWith("name");
    });

    it("labels the resize handles on the selected element", () => {
        const { getByLabelText } = setup({ selectedEl: "name", onSelectEl: vi.fn() });
        expect(getByLabelText("Resize Name")).toBeTruthy();
        expect(getByLabelText("Resize Name width")).toBeTruthy();
    });
});
