import {
    HERO_ELEMENT_ALIGNS,
    HERO_ELEMENT_ALIGN_LABELS,
    HERO_ELEMENT_WIDTHS,
    HERO_ELEMENT_WIDTH_LABELS,
    HERO_ELEMENT_DIVIDERS,
    HERO_ELEMENT_DIVIDER_LABELS,
    TYPE_SCALES,
} from "../profileThemeConstants";
import { getHeroElementDesign, heroLegacyToDesign } from "../profileThemeUtils";
import { BlockDesignControls } from "./blockStudioControls";

// The hero editor doesn't surface these container tools: Skins (container-shaped
// looks), Padding and Title (no block padding/title on a hero element). Everything
// else — surface, fill, pattern, tone, text colour, font, corners, border, shadow,
// effects, accent — is the SAME tray the containers use.
const HERO_OMIT_TOOLS = ["skins", "padding", "title"];

/**
 * The ONLY editor shown while a hero container is selected. The styling controls
 * are the SAME Design tool tray the containers use (V5.2) — surface / fill /
 * pattern / colour / font / corners / border / shadow / effects / accent — writing
 * to the element's `design`. The hero-specific controls (alignment, width, break
 * line, text size) stay here. Everything writes to that one element only.
 */
const HeroElementEditor = ({ elementKey, data, onPatch }) => {
    if (!data) return null;
    const set = (partial) => onPatch(elementKey, partial);

    // The element's design, seeded from its legacy style fields when it has none yet
    // (so opening the tools shows its current look; the first edit migrates it).
    const rawDesign = data.design && typeof data.design === "object" ? data.design : heroLegacyToDesign(data);
    const design = getHeroElementDesign({ design: rawDesign });
    const onPatchDesign = (_key, partial) => set({ design: { ...rawDesign, ...partial } });

    // Reusable whitelisted chip-group row for the hero-specific controls.
    const chips = ({ label, options, labels, fallback, field, clear }) => (
        <div className="pt-field">
            <span className="pt-field-label">{label}</span>
            <div className="pt-pblock__chips" role="group" aria-label={label}>
                {options.map((opt) => {
                    const active = (data[field] || fallback) === opt;
                    return (
                        <button
                            key={opt}
                            type="button"
                            className={`pt-pblock__chip${active ? " is-active" : ""}`}
                            aria-pressed={active}
                            onClick={() => set({ [field]: opt, ...(clear ? { [clear]: undefined } : {}) })}
                        >
                            {labels[opt]}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    return (
        <div className="pt-panel">
            <p className="pt-panel-hint">
                Everything here changes <strong>only this container</strong>. On the preview: drag the
                <strong> ⠿ grip</strong> to reorder it, the <strong>right-edge bar</strong> to set its
                width, or the <strong>corner dot</strong> to resize its overall size.
            </p>

            {chips({ label: "Align", options: HERO_ELEMENT_ALIGNS, labels: HERO_ELEMENT_ALIGN_LABELS, fallback: "left", field: "align" })}
            {chips({ label: "Width", options: HERO_ELEMENT_WIDTHS, labels: HERO_ELEMENT_WIDTH_LABELS, fallback: "full", field: "width" })}
            {chips({ label: "Break line", options: HERO_ELEMENT_DIVIDERS, labels: HERO_ELEMENT_DIVIDER_LABELS, fallback: "none", field: "divider" })}
            {chips({
                label: "Text size",
                options: TYPE_SCALES.map((s) => s.key),
                labels: Object.fromEntries(TYPE_SCALES.map((s) => [s.key, s.label])),
                fallback: "normal",
                field: "size",
                clear: "scale",
            })}

            {/* The full container Design tray (minus Skins / Padding / Title). */}
            <div className="pt-field">
                <span className="pt-field-label">Style</span>
                <BlockDesignControls
                    block={{ type: elementKey }}
                    design={design}
                    onPatchDesign={onPatchDesign}
                    omit={HERO_OMIT_TOOLS}
                />
            </div>

            <button
                type="button"
                className="pt-sticker-delete"
                onClick={() =>
                    set({
                        align: "left",
                        width: "full",
                        divider: "none",
                        size: undefined,
                        scale: undefined,
                        // Legacy style fields + the design are all cleared.
                        style: undefined,
                        color: undefined,
                        bgColor: undefined,
                        border: undefined,
                        radius: undefined,
                        font: undefined,
                        design: undefined,
                    })
                }
            >
                Reset this container
            </button>
        </div>
    );
};

export default HeroElementEditor;
