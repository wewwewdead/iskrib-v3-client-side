import { PROFILE_THEME_PRESETS } from "../profileThemePresets";

const PresetsPanel = ({ theme, onApplyPreset, canUndo = false, onUndo }) => (
    <div className="pt-panel">
        <p className="pt-panel-hint">Start from a preset, then fine-tune anything you like.</p>
        {canUndo && onUndo && (
            <div className="pt-preset-undo">
                <span>Preset applied — your previous colors, type &amp; cards were replaced.</span>
                <button type="button" className="pt-preset-undo-btn" onClick={onUndo}>
                    Undo
                </button>
            </div>
        )}
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
                    >
                        {theme.presetId === preset.id && (
                            <span className="pt-preset-check" aria-hidden="true">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M5 13l4 4L19 7" />
                                </svg>
                            </span>
                        )}
                    </span>
                    <span className="pt-preset-label">{preset.label}</span>
                </button>
            ))}
        </div>
    </div>
);

export default PresetsPanel;
