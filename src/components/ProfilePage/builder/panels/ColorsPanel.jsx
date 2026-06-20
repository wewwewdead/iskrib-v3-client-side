import { useState } from "react";
import { FieldLabel, OptionButtons } from "./BuilderControls";

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

const ColorsPanel = ({ theme, onPatchColors }) => {
    const [base, setBase] = useState("light");

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
                <FieldLabel htmlFor="pt-text-color">Text color</FieldLabel>
                <div className="pt-color-input-row">
                    <input
                        id="pt-text-color"
                        type="color"
                        value={/^#[0-9a-fA-F]{6}$/.test(theme.colors.text) ? theme.colors.text : "#ffffff"}
                        onChange={(e) => onPatchColors({ text: e.target.value })}
                    />
                    <span className="pt-color-value">{theme.colors.text}</span>
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
        </div>
    );
};

export default ColorsPanel;
