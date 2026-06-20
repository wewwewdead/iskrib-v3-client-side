// Settings → Appearance. Lets the viewer choose the private app-shell theme.
// This is the App Theme system (client-only, localStorage) — distinct from the
// public Profile Builder `profile_theme`. Selecting a card applies it instantly
// via ThemeContext; no page reload, no server save.
import { useAppTheme } from '../../theme/useAppTheme';
import './appThemePicker.css';

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

const AppThemePicker = () => {
    const { selectedTheme, setAppTheme, availableThemes } = useAppTheme();

    return (
        <section className="settings-section app-theme-section">
            <h2 className="settings-section-title">Appearance</h2>
            <p className="settings-current-value">Choose how Iskrib feels to you.</p>

            <div className="app-theme-grid" role="radiogroup" aria-label="App theme">
                {availableThemes.map((theme) => {
                    const checked = selectedTheme === theme.id;
                    return (
                        <label
                            key={theme.id}
                            className={`app-theme-card ${checked ? 'is-selected' : ''}`}
                        >
                            <input
                                type="radio"
                                name="app-theme"
                                className="app-theme-radio"
                                value={theme.id}
                                checked={checked}
                                onChange={() => setAppTheme(theme.id)}
                            />
                            <span className="app-theme-swatches" aria-hidden="true">
                                {theme.swatches.map((color, i) => (
                                    <span
                                        key={i}
                                        className="app-theme-swatch"
                                        style={{ background: color }}
                                    />
                                ))}
                            </span>
                            <span className="app-theme-meta">
                                <span className="app-theme-name">{theme.label}</span>
                                <span className="app-theme-desc">{theme.description}</span>
                            </span>
                            <span className="app-theme-check" aria-hidden="true">
                                <CheckIcon />
                            </span>
                        </label>
                    );
                })}
            </div>
        </section>
    );
};

export default AppThemePicker;
