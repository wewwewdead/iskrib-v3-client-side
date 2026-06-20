import { PROFILE_FONTS, TYPE_SCALES } from "../profileThemeConstants";
import { FieldLabel, OptionButtons } from "./BuilderControls";

const TypographyPanel = ({ theme, onPatchTypography }) => (
    <div className="pt-panel">
        <div className="pt-field">
            <FieldLabel>Font</FieldLabel>
            <div className="pt-font-grid">
                {PROFILE_FONTS.map((font) => (
                    <button
                        key={font.key}
                        type="button"
                        className={`pt-font-btn${theme.typography.font === font.key ? " is-active" : ""}`}
                        aria-pressed={theme.typography.font === font.key}
                        onClick={() => onPatchTypography({ font: font.key })}
                        style={{ fontFamily: font.stack }}
                    >
                        {font.label}
                    </button>
                ))}
            </div>
        </div>

        <div className="pt-field">
            <FieldLabel>Text size</FieldLabel>
            <OptionButtons
                ariaLabel="Text size"
                options={TYPE_SCALES.map((s) => ({ key: s.key, label: s.label }))}
                value={theme.typography.scale}
                onChange={(scale) => onPatchTypography({ scale })}
            />
        </div>
    </div>
);

export default TypographyPanel;
