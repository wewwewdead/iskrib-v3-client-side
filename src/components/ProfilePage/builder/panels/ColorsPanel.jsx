import { useState } from "react";
import { FieldLabel, OptionButtons } from "./BuilderControls";
import {
    HERO_ELEMENT_LABELS,
    DEFAULT_BACKGROUND,
    ALLOWED_BACKGROUND_TYPES,
    BACKGROUND_TYPE_LABELS,
    BACKGROUND_ANGLE_OPTIONS,
} from "../profileThemeConstants";

const isHex = (v) => /^#[0-9a-fA-F]{6}$/.test(v || "");

const hexToRgb = (hex) => {
    let h = (hex || "").replace("#", "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6) return { r: 255, g: 255, b: 255 };
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    };
};

const rgba = (r, g, b, a) => `rgba(${r},${g},${b},${a})`;

const BASES = [
    { key: "light", label: "Light", rgb: { r: 255, g: 255, b: 255 } },
    { key: "dark", label: "Dark", rgb: { r: 18, g: 18, b: 22 } },
    { key: "tint", label: "Tint", rgb: null }, // derived from accent
];

const ColorsPanel = ({
    theme,
    onPatchColors,
    onPatchBackground,
    selectedHeroEl,
    selectedHeroElData,
    onHeroPatchElement,
    onClearHeroSelection,
}) => {
    const [base, setBase] = useState("light");

    // Page background (gradient + opacity). Falls back to defaults for legacy
    // themes saved before the background config existed.
    const bg = { ...DEFAULT_BACKGROUND, ...(theme.background || {}) };
    const isGradient = bg.type === "gradient";
    const closestAngle =
        BACKGROUND_ANGLE_OPTIONS.reduce(
            (best, opt) =>
                Math.abs(opt.key - bg.angle) < Math.abs(best - bg.angle) ? opt.key : best,
            BACKGROUND_ANGLE_OPTIONS[0].key
        );

    // When a hero container is selected, the Text color edits THAT element only.
    const editingEl = Boolean(selectedHeroElData);
    const elLabel = selectedHeroEl ? HERO_ELEMENT_LABELS[selectedHeroEl] || selectedHeroEl : null;
    const textValue = editingEl ? selectedHeroElData.color || theme.colors.text : theme.colors.text;
    const setText = (val) =>
        editingEl ? onHeroPatchElement(selectedHeroEl, { color: val }) : onPatchColors({ text: val });

    const baseRgb = () => {
        const found = BASES.find((b) => b.key === base);
        if (found?.rgb) return found.rgb;
        return hexToRgb(theme.colors.accent);
    };

    const currentBgAlpha = () => {
        const match = /rgba?\([^)]*,\s*(0|1|0?\.\d+)\s*\)/.exec(theme.colors.cardBackground || "");
        return match ? parseFloat(match[1]) : 0.55;
    };

    const currentBorderAlpha = () => {
        const match = /rgba?\([^)]*,\s*(0|1|0?\.\d+)\s*\)/.exec(theme.colors.cardBorder || "");
        return match ? parseFloat(match[1]) : 0.22;
    };

    const updateBg = (alpha) => {
        const { r, g, b } = baseRgb();
        onPatchColors({ cardBackground: rgba(r, g, b, alpha) });
    };

    const updateBorder = (alpha) => {
        const { r, g, b } = baseRgb();
        onPatchColors({ cardBorder: rgba(r, g, b, alpha) });
    };

    const onBaseChange = (key) => {
        setBase(key);
        const found = BASES.find((b) => b.key === key);
        const rgbVal = found?.rgb || hexToRgb(theme.colors.accent);
        onPatchColors({
            cardBackground: rgba(rgbVal.r, rgbVal.g, rgbVal.b, currentBgAlpha()),
            cardBorder: rgba(rgbVal.r, rgbVal.g, rgbVal.b, currentBorderAlpha()),
        });
    };

    return (
        <div className="pt-panel">
            <div className="pt-field">
                {editingEl ? (
                    <div className="pt-cards-scope">
                        <span className="pt-cards-scope-label">
                            Text color · <strong>{elLabel}</strong>
                        </span>
                        <button type="button" className="pt-cards-scope-btn" onClick={onClearHeroSelection}>
                            Whole page
                        </button>
                    </div>
                ) : (
                    <FieldLabel htmlFor="pt-text-color">Text color</FieldLabel>
                )}
                <div className="pt-color-input-row">
                    <input
                        id="pt-text-color"
                        type="color"
                        value={isHex(textValue) ? textValue : "#ffffff"}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <span className="pt-color-value">
                        {editingEl ? selectedHeroElData.color || "Default (page)" : theme.colors.text}
                    </span>
                    {editingEl && selectedHeroElData.color && (
                        <button
                            type="button"
                            className="pt-cards-scope-btn"
                            onClick={() => onHeroPatchElement(selectedHeroEl, { color: undefined })}
                        >
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <div className="pt-field">
                <FieldLabel htmlFor="pt-accent-color">Accent color</FieldLabel>
                <div className="pt-color-input-row">
                    <input
                        id="pt-accent-color"
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(theme.colors.accent) ? theme.colors.accent : "#D4A853"}
                        onChange={(e) => onPatchColors({ accent: e.target.value })}
                    />
                    <span className="pt-color-value">{theme.colors.accent}</span>
                </div>
            </div>

            <div className="pt-field">
                <FieldLabel>Card tone</FieldLabel>
                <OptionButtons
                    ariaLabel="Card tone"
                    options={BASES.map((b) => ({ key: b.key, label: b.label }))}
                    value={base}
                    onChange={onBaseChange}
                />
            </div>

            <div className="pt-field">
                <FieldLabel htmlFor="pt-bg-alpha">Card opacity</FieldLabel>
                <input
                    id="pt-bg-alpha"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentBgAlpha()}
                    onChange={(e) => updateBg(parseFloat(e.target.value))}
                />
            </div>

            <div className="pt-field">
                <FieldLabel htmlFor="pt-border-alpha">Border strength</FieldLabel>
                <input
                    id="pt-border-alpha"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentBorderAlpha()}
                    onChange={(e) => updateBorder(parseFloat(e.target.value))}
                />
            </div>

            <div className="pt-field pt-field--divided">
                <FieldLabel>Page background</FieldLabel>
                <OptionButtons
                    ariaLabel="Page background type"
                    options={ALLOWED_BACKGROUND_TYPES.map((t) => ({
                        key: t,
                        label: BACKGROUND_TYPE_LABELS[t] || t,
                    }))}
                    value={bg.type}
                    onChange={(type) => onPatchBackground({ type })}
                />
            </div>

            {isGradient && (
                <>
                    <div className="pt-field">
                        <FieldLabel htmlFor="pt-bg-from">Gradient — from</FieldLabel>
                        <div className="pt-color-input-row">
                            <input
                                id="pt-bg-from"
                                type="color"
                                value={isHex(bg.from) ? bg.from : "#7c3aed"}
                                onChange={(e) => onPatchBackground({ from: e.target.value })}
                            />
                            <span className="pt-color-value">{bg.from}</span>
                        </div>
                    </div>

                    <div className="pt-field">
                        <FieldLabel htmlFor="pt-bg-to">Gradient — to</FieldLabel>
                        <div className="pt-color-input-row">
                            <input
                                id="pt-bg-to"
                                type="color"
                                value={isHex(bg.to) ? bg.to : "#2563eb"}
                                onChange={(e) => onPatchBackground({ to: e.target.value })}
                            />
                            <span className="pt-color-value">{bg.to}</span>
                        </div>
                    </div>

                    <div className="pt-field">
                        <FieldLabel>Direction</FieldLabel>
                        <OptionButtons
                            ariaLabel="Gradient direction"
                            options={BACKGROUND_ANGLE_OPTIONS}
                            value={closestAngle}
                            onChange={(angle) => onPatchBackground({ angle })}
                        />
                    </div>

                    <div className="pt-field">
                        <FieldLabel htmlFor="pt-bg-opacity">
                            Background opacity — lower it for better contrast
                        </FieldLabel>
                        <input
                            id="pt-bg-opacity"
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={bg.opacity}
                            onChange={(e) => onPatchBackground({ opacity: parseFloat(e.target.value) })}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default ColorsPanel;
