import { useState } from "react";
import { getBlockContent, getBlockDesign, isHexColor } from "../profileThemeUtils";
import {
    ALLOWED_LAYOUT_WIDTHS,
    ALLOWED_LAYOUT_STYLES,
    ALLOWED_LAYOUT_VARIANTS_BY_TYPE,
    LAYOUT_WIDTH_LABELS,
    LAYOUT_STYLE_LABELS,
    MAX_LAYOUT_TITLE_LENGTH,
    ALLOWED_BLOCK_CONTENT_BY_TYPE,
    CONTENT_SOURCE_LABELS,
    CONTENT_DENSITY_LABELS,
    CONTENT_IMAGE_SHAPE_LABELS,
    CONTENT_BOOLEAN_LABELS,
    DESIGN_CONTROLS,
    DESIGN_SURFACE_LABELS,
    DEFAULT_BLOCK_DESIGN,
    SWATCH_COLORS,
    PROFILE_FONTS,
    ALLOWED_FILL_TYPES,
    FILL_TYPE_LABELS,
    ALLOWED_PATTERNS,
    PATTERN_LABELS,
    ALLOWED_PATTERN_SCALES,
    PATTERN_SCALE_LABELS,
    ALLOWED_DESIGN_RADII,
    DESIGN_RADIUS_LABELS,
    ALLOWED_DESIGN_PADDINGS,
    DESIGN_PADDING_LABELS,
    ALLOWED_DESIGN_SHADOWS,
    DESIGN_SHADOW_LABELS,
    ALLOWED_DESIGN_BORDERS,
    DESIGN_BORDER_LABELS,
    ALLOWED_BORDER_STYLES,
    BORDER_STYLE_LABELS,
    ALLOWED_DESIGN_HEADERS,
    DESIGN_HEADER_LABELS,
    ALLOWED_DESIGN_TITLE_ALIGNS,
    DESIGN_TITLE_ALIGN_LABELS,
    ALLOWED_TITLE_SIZES,
    TITLE_SIZE_LABELS,
    ALLOWED_TITLE_WEIGHTS,
    TITLE_WEIGHT_LABELS,
    ALLOWED_TITLE_SPACINGS,
    TITLE_SPACING_LABELS,
    ALLOWED_TITLE_CASES,
    TITLE_CASE_LABELS,
    ALLOWED_HOVER_FX,
    HOVER_FX_LABELS,
    DESIGN_RANGES,
} from "../profileThemeConstants";
import { TOOL_ICONS } from "./toolIcons";
import { CONTAINER_SKINS } from "../containerSkins";

const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const DESIGN_CONTROL_BY_KEY = Object.fromEntries(DESIGN_CONTROLS.map((c) => [c.key, c]));

// Optional design keys a Skin clears before applying its bundle, so a previous
// look never bleeds through (the base-9 reset to defaults; these reset to unset).
const DESIGN_EXTRA_KEYS = [
    "textColor", "bgColor", "font",
    "fillType", "gradFrom", "gradTo", "gradAngle", "pattern", "patternColor", "patternScale", "patternOpacity", "fillOpacity", "blur",
    "radiusPx", "borderWidth", "borderStyle", "borderColor", "shadowStrength", "glow", "paddingPx",
    "titleSize", "titleWeight", "titleSpacing", "titleCase", "tilt", "hover", "opacity",
];
const blankExtras = () => Object.fromEntries(DESIGN_EXTRA_KEYS.map((k) => [k, undefined]));

/**
 * A labelled segmented control: a small row of mutually-exclusive option chips.
 * `hideLabel` suppresses the inline label (used as a tool's primary control inside
 * the icon tray, which shows the active tool's name itself).
 */
export const Segmented = ({ label, value, options, labels, onChange, hideLabel }) => (
    <div className="pt-content-control">
        {!hideLabel && <span className="pt-layout-control-label">{label}</span>}
        <div className="pt-seg" role="group" aria-label={label}>
            {options.map((opt) => {
                const active = String(value) === String(opt);
                return (
                    <button
                        key={opt}
                        type="button"
                        className={`pt-seg-btn${active ? " is-active" : ""}`}
                        aria-pressed={active}
                        onClick={() => onChange(opt)}
                    >
                        {labels ? labels[opt] ?? opt : opt}
                    </button>
                );
            })}
        </div>
    </div>
);

/** A range slider with a live value read-out and an "Auto" reset (clears the override). */
const Slider = ({ label, value, range, onChange, format }) => {
    const isSet = typeof value === "number";
    const v = isSet ? value : range.def;
    return (
        <div className="pt-content-control">
            <span className="pt-layout-control-label pt-slider-label">
                {label}
                <span className="pt-slider-val" aria-hidden="true">{format ? format(v) : v}</span>
                {isSet && (
                    <button type="button" className="pt-slider-reset" onClick={() => onChange(undefined)}>
                        Auto
                    </button>
                )}
            </span>
            <input
                type="range"
                className="pt-slider-input"
                min={range.min}
                max={range.max}
                step={range.step}
                value={v}
                aria-label={label}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </div>
    );
};

/**
 * A color tool: the shared swatch palette + a custom color picker. The "Default"
 * (null) swatch clears the override (unless allowClear is false).
 */
const ColorTool = ({ value, onChange, allowClear = true }) => {
    const swatches = allowClear ? SWATCH_COLORS : SWATCH_COLORS.filter((c) => c.value !== null);
    return (
        <div className="pt-sticker-color-row" role="group" aria-label="Color">
            {swatches.map((c) => {
                const active = (value || null) === c.value;
                return (
                    <button
                        key={c.label}
                        type="button"
                        className={`pt-sticker-color${active ? " is-active" : ""}${c.value === null ? " pt-sticker-color--accent" : ""}`}
                        style={c.value ? { background: c.value } : undefined}
                        aria-label={c.value === null ? "Default" : c.label}
                        aria-pressed={active}
                        title={c.value === null ? "Default (inherit page)" : c.label}
                        onClick={() => onChange(c.value || undefined)}
                    />
                );
            })}
            <label className="pt-sticker-color pt-sticker-color--custom" title="Custom color">
                <input
                    type="color"
                    value={isHexColor(value) ? value : "#ffffff"}
                    onChange={(e) => onChange(e.target.value)}
                    aria-label="Custom color"
                />
            </label>
        </div>
    );
};

/** A font tool: the full font palette + a "Default" to clear back to the page font. */
const FontTool = ({ value, onChange }) => (
    <div className="pt-font-grid">
        <button
            type="button"
            className={`pt-font-btn${!value ? " is-active" : ""}`}
            aria-pressed={!value}
            onClick={() => onChange(undefined)}
        >
            Default
        </button>
        {PROFILE_FONTS.map((f) => (
            <button
                key={f.key}
                type="button"
                className={`pt-font-btn${value === f.key ? " is-active" : ""}`}
                aria-pressed={value === f.key}
                style={{ fontFamily: f.stack }}
                onClick={() => onChange(f.key)}
            >
                {f.label}
            </button>
        ))}
    </div>
);

/** Gradient builder: from / to color stops + an angle slider. */
const GradientBuilder = ({ design, patch }) => (
    <div className="pt-substack">
        <span className="pt-layout-control-label">From</span>
        <ColorTool value={design.gradFrom} allowClear={false} onChange={(c) => patch({ gradFrom: c })} />
        <span className="pt-layout-control-label">To</span>
        <ColorTool value={design.gradTo} allowClear={false} onChange={(c) => patch({ gradTo: c })} />
        <Slider label="Angle" value={design.gradAngle} range={DESIGN_RANGES.gradAngle} onChange={(v) => patch({ gradAngle: v })} format={(n) => `${n}°`} />
    </div>
);

/** Pattern picker: pattern type + color + scale + opacity. */
const PatternPicker = ({ design, patch }) => (
    <div className="pt-substack">
        <Segmented label="Pattern" value={design.pattern} options={ALLOWED_PATTERNS} labels={PATTERN_LABELS} onChange={(v) => patch({ pattern: v })} />
        <span className="pt-layout-control-label">Pattern color</span>
        <ColorTool value={design.patternColor} allowClear={false} onChange={(c) => patch({ patternColor: c })} />
        <Segmented label="Scale" value={design.patternScale || "m"} options={ALLOWED_PATTERN_SCALES} labels={PATTERN_SCALE_LABELS} onChange={(v) => patch({ patternScale: v })} />
        <Slider label="Pattern opacity" value={design.patternOpacity} range={DESIGN_RANGES.patternOpacity} onChange={(v) => patch({ patternOpacity: v })} format={(n) => `${Math.round(n * 100)}%`} />
    </div>
);

/**
 * Pattern tool: a direct, discoverable way to add grid / dots / lines etc. Picking
 * a pattern turns the container's fill into a pattern fill (so it shows right away);
 * "None" turns the pattern back off. Color / scale / opacity appear once one's on.
 */
const PatternTool = ({ design, patch }) => {
    const on = design.fillType === "pattern";
    const choose = (p) =>
        patch({
            fillType: "pattern",
            pattern: p,
            ...(isHexColor(design.patternColor) || design.patternColor ? {} : { patternColor: "#000000" }),
        });
    const clear = () => patch({ fillType: design.bgColor ? "solid" : undefined });
    return (
        <div className="pt-substack">
            <div className="pt-content-control">
                <span className="pt-layout-control-label">Pattern</span>
                <div className="pt-seg" role="group" aria-label="Pattern">
                    <button
                        type="button"
                        className={`pt-seg-btn${!on ? " is-active" : ""}`}
                        aria-pressed={!on}
                        onClick={clear}
                    >
                        None
                    </button>
                    {ALLOWED_PATTERNS.map((p) => {
                        const active = on && design.pattern === p;
                        return (
                            <button
                                key={p}
                                type="button"
                                className={`pt-seg-btn${active ? " is-active" : ""}`}
                                aria-pressed={active}
                                onClick={() => choose(p)}
                            >
                                {PATTERN_LABELS[p]}
                            </button>
                        );
                    })}
                </div>
            </div>
            {on && (
                <>
                    <span className="pt-layout-control-label">Pattern color</span>
                    <ColorTool value={design.patternColor} allowClear={false} onChange={(c) => patch({ patternColor: c })} />
                    <Segmented label="Scale" value={design.patternScale || "m"} options={ALLOWED_PATTERN_SCALES} labels={PATTERN_SCALE_LABELS} onChange={(v) => patch({ patternScale: v })} />
                    <Slider label="Opacity" value={design.patternOpacity} range={DESIGN_RANGES.patternOpacity} onChange={(v) => patch({ patternOpacity: v })} format={(n) => `${Math.round(n * 100)}%`} />
                </>
            )}
        </div>
    );
};

/** Fill tool: Surface / Solid / Gradient / Pattern + the relevant sub-control. */
const FillTool = ({ design, patch }) => {
    const fillType = design.fillType || "surface";
    const setFillType = (t) => {
        const seed = {};
        if (t === "solid" && !design.bgColor) seed.bgColor = "#ffffff";
        if (t === "gradient" && !design.gradFrom) {
            seed.gradFrom = "#7c3aed";
            seed.gradTo = "#2563eb";
        }
        if (t === "pattern" && !design.pattern) {
            seed.pattern = "dots";
            seed.patternColor = "#000000";
        }
        patch({ fillType: t === "surface" ? undefined : t, ...seed });
    };
    return (
        <div className="pt-substack">
            <Segmented label="Fill" value={fillType} options={ALLOWED_FILL_TYPES} labels={FILL_TYPE_LABELS} onChange={setFillType} />
            {fillType === "solid" && (
                <>
                    <span className="pt-layout-control-label">Color</span>
                    <ColorTool value={design.bgColor} onChange={(c) => patch({ bgColor: c })} />
                </>
            )}
            {fillType === "gradient" && <GradientBuilder design={design} patch={patch} />}
            {fillType === "pattern" && <PatternPicker design={design} patch={patch} />}
            {fillType !== "surface" && (
                <Slider label="Fill opacity" value={design.fillOpacity} range={DESIGN_RANGES.fillOpacity} onChange={(v) => patch({ fillOpacity: v })} format={(n) => `${Math.round(n * 100)}%`} />
            )}
            <Slider label="Glass blur" value={design.blur} range={DESIGN_RANGES.blur} onChange={(v) => patch({ blur: v })} format={(n) => `${n}px`} />
        </div>
    );
};

/** Corners: quick radius presets + a fine slider (slider overrides the preset). */
const CornersTool = ({ design, patch }) => (
    <div className="pt-substack">
        <Segmented label="Radius" value={design.radius} options={ALLOWED_DESIGN_RADII} labels={DESIGN_RADIUS_LABELS} onChange={(v) => patch({ radius: v, radiusPx: undefined })} />
        <Slider label="Fine radius" value={design.radiusPx} range={DESIGN_RANGES.radiusPx} onChange={(v) => patch({ radiusPx: v })} format={(n) => `${n}px`} />
    </div>
);

/** Border: preset + fine width/style/color. */
const BorderTool = ({ design, patch }) => (
    <div className="pt-substack">
        <Segmented label="Border" value={design.border} options={ALLOWED_DESIGN_BORDERS} labels={DESIGN_BORDER_LABELS} onChange={(v) => patch({ border: v, borderWidth: undefined, borderStyle: undefined, borderColor: undefined })} />
        <Slider label="Width" value={design.borderWidth} range={DESIGN_RANGES.borderWidth} onChange={(v) => patch({ borderWidth: v })} format={(n) => `${n}px`} />
        <Segmented label="Style" value={design.borderStyle || "solid"} options={ALLOWED_BORDER_STYLES} labels={BORDER_STYLE_LABELS} onChange={(v) => patch({ borderStyle: v })} />
        <span className="pt-layout-control-label">Border color</span>
        <ColorTool value={design.borderColor} onChange={(c) => patch({ borderColor: c })} />
    </div>
);

/** Shadow: preset + strength slider + colored glow. */
const ShadowTool = ({ design, patch }) => (
    <div className="pt-substack">
        <Segmented label="Shadow" value={design.shadow} options={ALLOWED_DESIGN_SHADOWS} labels={DESIGN_SHADOW_LABELS} onChange={(v) => patch({ shadow: v, shadowStrength: undefined, glow: undefined })} />
        <Slider label="Strength" value={design.shadowStrength} range={DESIGN_RANGES.shadowStrength} onChange={(v) => patch({ shadowStrength: v })} format={(n) => `${Math.round(n * 100)}%`} />
        <span className="pt-layout-control-label">Glow color</span>
        <ColorTool value={design.glow} onChange={(c) => patch({ glow: c })} />
    </div>
);

/** Padding: preset + fine slider. */
const PaddingTool = ({ design, patch }) => (
    <div className="pt-substack">
        <Segmented label="Padding" value={design.padding} options={ALLOWED_DESIGN_PADDINGS} labels={DESIGN_PADDING_LABELS} onChange={(v) => patch({ padding: v, paddingPx: undefined })} />
        <Slider label="Fine padding" value={design.paddingPx} range={DESIGN_RANGES.paddingPx} onChange={(v) => patch({ paddingPx: v })} format={(n) => `${n}px`} />
    </div>
);

/** Title: header style + alignment + size / weight / spacing / case. */
const TitleTool = ({ design, patch }) => (
    <div className="pt-substack">
        <Segmented label="Header" value={design.header} options={ALLOWED_DESIGN_HEADERS} labels={DESIGN_HEADER_LABELS} onChange={(v) => patch({ header: v })} />
        <Segmented label="Align" value={design.titleAlign} options={ALLOWED_DESIGN_TITLE_ALIGNS} labels={DESIGN_TITLE_ALIGN_LABELS} onChange={(v) => patch({ titleAlign: v })} />
        <Segmented label="Size" value={design.titleSize || "md"} options={ALLOWED_TITLE_SIZES} labels={TITLE_SIZE_LABELS} onChange={(v) => patch({ titleSize: v })} />
        <Segmented label="Weight" value={design.titleWeight || "bold"} options={ALLOWED_TITLE_WEIGHTS} labels={TITLE_WEIGHT_LABELS} onChange={(v) => patch({ titleWeight: v })} />
        <Segmented label="Spacing" value={design.titleSpacing || "normal"} options={ALLOWED_TITLE_SPACINGS} labels={TITLE_SPACING_LABELS} onChange={(v) => patch({ titleSpacing: v })} />
        <Segmented label="Case" value={design.titleCase || "none"} options={ALLOWED_TITLE_CASES} labels={TITLE_CASE_LABELS} onChange={(v) => patch({ titleCase: v })} />
    </div>
);

/** Effects: tilt + hover effect + container opacity. */
const EffectsTool = ({ design, patch }) => (
    <div className="pt-substack">
        <Slider label="Tilt" value={design.tilt} range={DESIGN_RANGES.tilt} onChange={(v) => patch({ tilt: v })} format={(n) => `${n}°`} />
        <Segmented label="Hover" value={design.hover || "none"} options={ALLOWED_HOVER_FX} labels={HOVER_FX_LABELS} onChange={(v) => patch({ hover: v })} />
        <Slider label="Opacity" value={design.opacity} range={DESIGN_RANGES.opacity} onChange={(v) => patch({ opacity: v })} format={(n) => `${Math.round(n * 100)}%`} />
    </div>
);

/** Skins: a gallery of one-tap design bundles (reset + apply). */
const SkinsTool = ({ block, onPatchDesign }) => (
    <div className="pt-skins-grid">
        {CONTAINER_SKINS.map((skin) => (
            <button
                key={skin.id}
                type="button"
                className="pt-skin"
                onClick={() => onPatchDesign(block.type, { ...DEFAULT_BLOCK_DESIGN, ...blankExtras(), ...skin.design })}
            >
                <span className="pt-skin-swatch" style={{ background: skin.swatch }} aria-hidden="true" />
                <span className="pt-skin-label">{skin.label}</span>
            </button>
        ))}
    </div>
);

/**
 * The icon-only tool tray (V5): a compact row of tool icons; tapping one reveals
 * its options below. Each tool = { key, label, icon?, dot?, render() }.
 * Responsive: desktop shows icon-only (label is a hover tooltip); mobile shows the
 * icon + its name and the row wraps to fit the screen.
 */
const IconToolbar = ({ ariaLabel, tools }) => {
    const valid = tools.filter(Boolean);
    const [active, setActive] = useState(valid[0]?.key);
    const current = valid.find((t) => t.key === active) || valid[0];

    return (
        <div className="pt-tooltray">
            <div className="pt-tooltray-icons" role="tablist" aria-label={ariaLabel}>
                {valid.map((t) => {
                    const isActive = current?.key === t.key;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={isActive}
                            className={`pt-tool-icon${isActive ? " is-active" : ""}`}
                            title={t.label}
                            aria-label={t.label}
                            onClick={() => setActive(t.key)}
                        >
                            {TOOL_ICONS[t.icon || t.key]}
                            {t.dot && <span className="pt-tool-dot" style={{ background: t.dot }} aria-hidden="true" />}
                            <span className="pt-tool-icon-label">{t.label}</span>
                        </button>
                    );
                })}
            </div>
            {current && (
                <div className="pt-tooltray-options">
                    <span className="pt-tooltray-label">{current.label}</span>
                    {current.render()}
                </div>
            )}
        </div>
    );
};

/** The boolean show/hide toggles (meta / excerpt) for a content block. */
const DisplayToggles = ({ content, keys, patch }) => (
    <div className="pt-content-toggles">
        {keys.map((key) => {
            const on = content[key] !== false;
            return (
                <button
                    key={key}
                    type="button"
                    role="switch"
                    aria-checked={on}
                    className={`pt-content-toggle${on ? " is-on" : ""}`}
                    onClick={() => patch({ [key]: !on })}
                >
                    <span className={`pt-toggle pt-toggle--sm${on ? " is-on" : ""}`}>
                        <span className="pt-toggle-knob" />
                    </span>
                    <span className="pt-content-toggle-label">{CONTENT_BOOLEAN_LABELS[key] || key}</span>
                </button>
            );
        })}
    </div>
);

/**
 * The "Content" controls for a single block, as an icon tool tray: count / source
 * / density / image shape / display toggles. Only the tools the block supports
 * appear. All values are whitelisted enums.
 */
export const BlockContentControls = ({ block, spec, onPatchContent }) => {
    const content = getBlockContent(block);
    const patch = (partial) => onPatchContent(block.type, partial);

    const tools = [
        spec.count && {
            key: "count",
            label: "Count",
            render: () => (
                <Segmented label="Count" hideLabel value={content.count} options={spec.count} onChange={(v) => patch({ count: Number(v) })} />
            ),
        },
        spec.source && spec.source.length > 1 && {
            key: "source",
            label: "Source",
            render: () => (
                <Segmented label="Source" hideLabel value={content.source} options={spec.source} labels={CONTENT_SOURCE_LABELS} onChange={(v) => patch({ source: v })} />
            ),
        },
        spec.density && {
            key: "density",
            label: "Density",
            render: () => (
                <Segmented label="Density" hideLabel value={content.density} options={spec.density} labels={CONTENT_DENSITY_LABELS} onChange={(v) => patch({ density: v })} />
            ),
        },
        spec.imageShape && {
            key: "imageShape",
            label: "Image shape",
            render: () => (
                <Segmented label="Image shape" hideLabel value={content.imageShape} options={spec.imageShape} labels={CONTENT_IMAGE_SHAPE_LABELS} onChange={(v) => patch({ imageShape: v })} />
            ),
        },
        (spec.booleans || []).length > 0 && {
            key: "display",
            label: "Display",
            render: () => <DisplayToggles content={content} keys={spec.booleans} patch={patch} />,
        },
    ];

    return <IconToolbar ariaLabel="Container content tools" tools={tools} />;
};

/**
 * The "Design" controls for a single block (V5.1 Design Studio), as an icon tool
 * tray: skins, fill (solid/gradient/pattern), surface, tone, text color, font,
 * corners, border, shadow, padding, title, effects, accent. Colors are validated
 * (swatches + custom), numbers are clamped sliders, the rest are whitelisted enums.
 */
export const BlockDesignControls = ({ block, onPatchDesign, design: designProp, omit }) => {
    // `designProp` lets the hero editor pass a hero-defaulted design; otherwise the
    // container design (glass-card defaults) is resolved from the block.
    const design = designProp || getBlockDesign(block);
    const patch = (partial) => onPatchDesign(block.type, partial);

    const segTool = (key) => {
        const ctrl = DESIGN_CONTROL_BY_KEY[key];
        return {
            key,
            label: ctrl.label,
            render: () => (
                <Segmented label={ctrl.label} hideLabel value={design[key]} options={ctrl.options} labels={ctrl.labels} onChange={(v) => patch({ [key]: v })} />
            ),
        };
    };

    const tools = [
        { key: "skins", label: "Skins", render: () => <SkinsTool block={block} onPatchDesign={onPatchDesign} /> },
        // Surface (paper / glass / solid / minimal / framed) comes first — it's the
        // card style most people reach for. For the hero (Skins omitted) it's the
        // default-open tool, so paper/glass are visible the moment you open Design.
        segTool("surface"),
        { key: "fill", label: "Fill", dot: design.bgColor || design.gradFrom || null, render: () => <FillTool design={design} patch={patch} /> },
        { key: "pattern", label: "Pattern", render: () => <PatternTool design={design} patch={patch} /> },
        segTool("tone"),
        { key: "textColor", label: "Text color", dot: design.textColor || null, render: () => <ColorTool value={design.textColor} onChange={(c) => patch({ textColor: c })} /> },
        { key: "font", label: "Font", render: () => <FontTool value={design.font} onChange={(f) => patch({ font: f })} /> },
        { key: "corners", icon: "radius", label: "Corners", render: () => <CornersTool design={design} patch={patch} /> },
        { key: "border", label: "Border", render: () => <BorderTool design={design} patch={patch} /> },
        { key: "shadow", label: "Shadow", render: () => <ShadowTool design={design} patch={patch} /> },
        { key: "padding", label: "Padding", render: () => <PaddingTool design={design} patch={patch} /> },
        { key: "title", icon: "header", label: "Title", render: () => <TitleTool design={design} patch={patch} /> },
        { key: "effects", label: "Effects", render: () => <EffectsTool design={design} patch={patch} /> },
        { key: "accent", label: "Accent", render: () => <Segmented label="Accent" hideLabel value={design.accent} options={DESIGN_CONTROL_BY_KEY.accent.options} labels={DESIGN_CONTROL_BY_KEY.accent.labels} onChange={(v) => patch({ accent: v })} /> },
    ];

    const shown = omit && omit.length ? tools.filter((t) => !omit.includes(t.key)) : tools;
    return <IconToolbar ariaLabel="Container design tools" tools={shown} />;
};

/**
 * The full per-container editor body — width / style / variant / title, plus the
 * Content and Design tool trays and a Reset. It carries NO drag/visibility chrome
 * (the host supplies that), so it can be dropped into either the Layout panel card
 * (desktop) or the inline container editor in the canvas (mobile, V5 room-builder).
 */
export const BlockStudioControls = ({
    block,
    label,
    onPatchBlock,
    onPatchBlockContent,
    onPatchBlockDesign,
    onResetBlock,
    defaultOpen = false,
}) => {
    const variants = ALLOWED_LAYOUT_VARIANTS_BY_TYPE[block.type] || [];
    const contentSpec = ALLOWED_BLOCK_CONTENT_BY_TYPE[block.type];
    const [showContent, setShowContent] = useState(defaultOpen);
    const [showDesign, setShowDesign] = useState(defaultOpen);
    const [confirmReset, setConfirmReset] = useState(false);
    const name = label || block.type;

    return (
        <>
            <div className="pt-layout-controls">
                <label className="pt-layout-control">
                    <span className="pt-layout-control-label">Width</span>
                    <select
                        value={block.width}
                        onChange={(e) => onPatchBlock(block.type, { width: e.target.value })}
                    >
                        {ALLOWED_LAYOUT_WIDTHS.map((w) => (
                            <option key={w} value={w}>
                                {LAYOUT_WIDTH_LABELS[w] || w}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="pt-layout-control">
                    <span className="pt-layout-control-label">Style</span>
                    <select
                        value={block.style}
                        onChange={(e) => onPatchBlock(block.type, { style: e.target.value })}
                    >
                        {ALLOWED_LAYOUT_STYLES.map((s) => (
                            <option key={s} value={s}>
                                {LAYOUT_STYLE_LABELS[s] || s}
                            </option>
                        ))}
                    </select>
                </label>

                {variants.length > 1 && (
                    <label className="pt-layout-control">
                        <span className="pt-layout-control-label">Variant</span>
                        <select
                            value={block.variant}
                            onChange={(e) => onPatchBlock(block.type, { variant: e.target.value })}
                        >
                            {variants.map((v) => (
                                <option key={v} value={v}>
                                    {titleCase(v)}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="pt-layout-title-row">
                <label className="pt-layout-control pt-layout-title-field">
                    <span className="pt-layout-control-label">
                        Title
                        <span className="pt-layout-title-count" aria-hidden="true">
                            {(block.title || "").length}/{MAX_LAYOUT_TITLE_LENGTH}
                        </span>
                    </span>
                    <input
                        type="text"
                        value={block.title}
                        maxLength={MAX_LAYOUT_TITLE_LENGTH}
                        onChange={(e) => onPatchBlock(block.type, { title: e.target.value })}
                    />
                </label>
                {confirmReset ? (
                    <span className="pt-layout-reset-confirm" role="group" aria-label={`Reset ${name}?`}>
                        <button
                            type="button"
                            className="pt-layout-reset is-confirm"
                            onClick={() => {
                                onResetBlock(block.type);
                                setConfirmReset(false);
                            }}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            className="pt-layout-reset-cancel"
                            onClick={() => setConfirmReset(false)}
                        >
                            Cancel
                        </button>
                    </span>
                ) : (
                    <button
                        type="button"
                        className="pt-layout-reset"
                        aria-label={`Reset ${name} to defaults`}
                        onClick={() => setConfirmReset(true)}
                    >
                        Reset
                    </button>
                )}
            </div>

            {contentSpec && (
                <div className="pt-content-disclosure">
                    <button
                        type="button"
                        className="pt-content-toggle-btn"
                        aria-expanded={showContent}
                        onClick={() => setShowContent((v) => !v)}
                    >
                        <span className={`pt-content-chevron${showContent ? " is-open" : ""}`} aria-hidden="true">
                            ▸
                        </span>
                        Content
                        {!showContent && (
                            <span className="pt-content-summary">
                                {getBlockContent(block).count} shown — tap to tune
                            </span>
                        )}
                    </button>
                    {showContent && (
                        <BlockContentControls block={block} spec={contentSpec} onPatchContent={onPatchBlockContent} />
                    )}
                </div>
            )}

            <div className="pt-content-disclosure">
                <button
                    type="button"
                    className="pt-content-toggle-btn"
                    aria-expanded={showDesign}
                    onClick={() => setShowDesign((v) => !v)}
                >
                    <span className={`pt-content-chevron${showDesign ? " is-open" : ""}`} aria-hidden="true">
                        ▸
                    </span>
                    Design
                    {!showDesign && (
                        <span className="pt-content-summary">
                            {DESIGN_SURFACE_LABELS[getBlockDesign(block).surface] || "Glass"} — tap to restyle
                        </span>
                    )}
                </button>
                {showDesign && <BlockDesignControls block={block} onPatchDesign={onPatchBlockDesign} />}
            </div>
        </>
    );
};
