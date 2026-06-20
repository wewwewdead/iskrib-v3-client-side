import { PROFILE_SECTIONS } from "../profileThemeConstants";
import { isSectionVisible } from "../profileThemeUtils";

const SectionsPanel = ({ theme, onToggleSection }) => (
    <div className="pt-panel">
        <p className="pt-panel-hint">Show or hide parts of your profile. Header and Writings always stay visible.</p>
        <div className="pt-section-list">
            {PROFILE_SECTIONS.map((section) => {
                const visible = isSectionVisible(theme, section.id);
                const locked = section.togglable === false;
                return (
                    <div key={section.id} className="pt-section-row">
                        <span className="pt-section-name">{section.label}</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={visible}
                            aria-label={`${visible ? "Hide" : "Show"} ${section.label}`}
                            disabled={locked}
                            className={`pt-toggle${visible ? " is-on" : ""}${locked ? " is-locked" : ""}`}
                            onClick={() => !locked && onToggleSection(section.id)}
                        >
                            <span className="pt-toggle-knob" />
                        </button>
                    </div>
                );
            })}
        </div>
    </div>
);

export default SectionsPanel;
