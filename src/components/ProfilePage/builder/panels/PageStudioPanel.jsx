import { useState } from "react";
import PresetsPanel from "./PresetsPanel";
import ColorsPanel from "./ColorsPanel";
import TypographyPanel from "./TypographyPanel";
import CardsPanel from "./CardsPanel";
import SectionsPanel from "./SectionsPanel";

/**
 * One collapsible section in the Page studio accordion.
 */
const Section = ({ id, label, open, onToggle, children }) => (
    <div className={`pt-page-section${open ? " is-open" : ""}`}>
        <button
            type="button"
            className="pt-page-section-head"
            aria-expanded={open}
            onClick={() => onToggle(id)}
        >
            <span className={`pt-content-chevron${open ? " is-open" : ""}`} aria-hidden="true">
                ▸
            </span>
            {label}
        </button>
        {open && <div className="pt-page-section-body">{children}</div>}
    </div>
);

/**
 * The Page studio — the global theme tools (presets, colors, type, page cards,
 * header sections) for the mobile "Page" container. On mobile there is no tool
 * sheet: tapping the Page container at the top of the canvas opens this inline,
 * exactly like tapping any other container opens its own editor.
 *
 * It reuses the existing desktop panels verbatim; hero-element / per-block-card
 * editing isn't surfaced here (those are edited by tapping the hero element or the
 * container itself), so the hero/card props are passed as null / no-ops.
 */
const PageStudioPanel = ({
    theme,
    onApplyPreset,
    onPatchColors,
    onPatchBackground,
    onPatchTypography,
    onPatchCards,
    onToggleSection,
}) => {
    const [open, setOpen] = useState("presets");
    const toggle = (id) => setOpen((cur) => (cur === id ? null : id));
    const noop = () => {};

    return (
        <div className="pt-page-studio">
            <Section id="presets" label="Presets" open={open === "presets"} onToggle={toggle}>
                <PresetsPanel theme={theme} onApplyPreset={onApplyPreset} />
            </Section>

            <Section id="colors" label="Colors & background" open={open === "colors"} onToggle={toggle}>
                <ColorsPanel
                    theme={theme}
                    onPatchColors={onPatchColors}
                    onPatchBackground={onPatchBackground}
                    selectedHeroEl={null}
                    selectedHeroElData={null}
                    onHeroPatchElement={noop}
                    onClearHeroSelection={noop}
                />
            </Section>

            <Section id="type" label="Type" open={open === "type"} onToggle={toggle}>
                <TypographyPanel theme={theme} onPatchTypography={onPatchTypography} />
            </Section>

            <Section id="cards" label="Card style" open={open === "cards"} onToggle={toggle}>
                <CardsPanel
                    theme={theme}
                    onPatchCards={onPatchCards}
                    selectedBlock={null}
                    onPatchBlockCard={noop}
                    onResetBlockCard={noop}
                    onClearSelection={noop}
                />
            </Section>

            <Section id="sections" label="Header sections" open={open === "sections"} onToggle={toggle}>
                <SectionsPanel
                    theme={theme}
                    onToggleSection={onToggleSection}
                    selectedHeroEl={null}
                    selectedHeroElData={null}
                    onHeroPatchElement={noop}
                    onClearHeroSelection={noop}
                />
            </Section>
        </div>
    );
};

export default PageStudioPanel;
