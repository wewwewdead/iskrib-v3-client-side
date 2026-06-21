import {
    HERO_ELEMENT_ALIGNS,
    HERO_ELEMENT_ALIGN_LABELS,
    HERO_ELEMENT_STYLES,
    HERO_ELEMENT_STYLE_LABELS,
    HERO_ELEMENT_WIDTHS,
    HERO_ELEMENT_WIDTH_LABELS,
    HERO_ELEMENT_BORDERS,
    HERO_ELEMENT_BORDER_LABELS,
    HERO_ELEMENT_RADII,
    HERO_ELEMENT_RADIUS_LABELS,
    HERO_ELEMENT_DIVIDERS,
    HERO_ELEMENT_DIVIDER_LABELS,
    PROFILE_FONTS,
    TYPE_SCALES,
} from "../profileThemeConstants";
import { STICKER_COLORS } from "../stickerRegistry";

const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(v || "");

/**
 * The ONLY editor shown while a hero container is selected. Every control here
 * writes to that one container (onPatch(key, partial)) — there is no global
 * edit reachable while a container is selected, so editing can never spill onto
 * the other containers or the page.
 */
const HeroElementEditor = ({ elementKey, data, onPatch }) => {
    if (!data) return null;
    const set = (partial) => onPatch(elementKey, partial);

    // Reusable whitelisted chip-group row (called as a function, not a nested
    // component, so the custom-color input below never remounts mid-edit).
    // `clear` lets a preset also reset another field (e.g. Text size clears the
    // continuous corner-drag scale so the preset wins).
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

    // Reusable color-swatch row (text or background).
    const colorRow = ({ label, field }) => (
        <div className="pt-field">
            <span className="pt-field-label">{label}</span>
            <div className="pt-sticker-color-row" role="group" aria-label={label}>
                {STICKER_COLORS.map((c) => {
                    const active = (data[field] || null) === c.value;
                    return (
                        <button
                            key={c.label}
                            type="button"
                            className={`pt-sticker-color${active ? " is-active" : ""}${c.value === null ? " pt-sticker-color--accent" : ""}`}
                            style={c.value ? { background: c.value } : undefined}
                            aria-label={c.value === null ? "Default" : c.label}
                            aria-pressed={active}
                            title={c.value === null ? "Default" : c.label}
                            onClick={() => set(c.value ? { [field]: c.value } : { [field]: undefined })}
                        />
                    );
                })}
                <label className="pt-sticker-color pt-sticker-color--custom" title="Custom color">
                    <input
                        type="color"
                        value={isHex(data[field]) ? data[field] : "#ffffff"}
                        onChange={(e) => set({ [field]: e.target.value })}
                        aria-label={`Custom ${label.toLowerCase()}`}
                    />
                </label>
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
            {chips({ label: "Background", options: HERO_ELEMENT_STYLES, labels: HERO_ELEMENT_STYLE_LABELS, fallback: "none", field: "style" })}

            {colorRow({ label: "Background color", field: "bgColor" })}

            {chips({ label: "Border", options: HERO_ELEMENT_BORDERS, labels: HERO_ELEMENT_BORDER_LABELS, fallback: "none", field: "border" })}
            {chips({ label: "Corners", options: HERO_ELEMENT_RADII, labels: HERO_ELEMENT_RADIUS_LABELS, fallback: "soft", field: "radius" })}
            {chips({ label: "Break line", options: HERO_ELEMENT_DIVIDERS, labels: HERO_ELEMENT_DIVIDER_LABELS, fallback: "none", field: "divider" })}

            {colorRow({ label: "Text color", field: "color" })}

            <div className="pt-field">
                <span className="pt-field-label">Font</span>
                <div className="pt-font-grid">
                    {PROFILE_FONTS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            className={`pt-font-btn${data.font === f.key ? " is-active" : ""}`}
                            aria-pressed={data.font === f.key}
                            style={{ fontFamily: f.stack }}
                            onClick={() => set({ font: f.key })}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                {data.font && (
                    <button type="button" className="pt-cards-scope-btn" onClick={() => set({ font: undefined })}>
                        Default font
                    </button>
                )}
            </div>

            {chips({
                label: "Text size",
                options: TYPE_SCALES.map((s) => s.key),
                labels: Object.fromEntries(TYPE_SCALES.map((s) => [s.key, s.label])),
                fallback: "normal",
                field: "size",
                clear: "scale",
            })}

            <button
                type="button"
                className="pt-sticker-delete"
                onClick={() =>
                    set({
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
                    })
                }
            >
                Reset this container
            </button>
        </div>
    );
};

export default HeroElementEditor;
