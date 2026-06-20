import { PROFILE_THEME_PRESETS } from "../profileThemePresets";

const PresetsPanel = ({ theme, onApplyPreset }) => (
    <div className="pt-panel">
        <p className="pt-panel-hint">Start from a preset, then fine-tune anything you like.</p>
        <div className="pt-preset-grid">
            {PROFILE_THEME_PRESETS.map((preset) => (
                <button
                    key={preset.id}
                    type="button"
                    className={`pt-preset-card${theme.presetId === preset.id ? " is-active" : ""}`}
                    onClick={() => onApplyPreset(preset.id)}
                    aria-pressed={theme.presetId === preset.id}
                >
                    <span
                        className="pt-preset-swatch"
                        style={{ background: `linear-gradient(135deg, ${preset.swatch[0]} 0%, ${preset.swatch[1]} 100%)` }}
                        aria-hidden="true"
                    />
                    <span className="pt-preset-label">{preset.label}</span>
                </button>
            ))}
        </div>
    </div>
);

export default PresetsPanel;
