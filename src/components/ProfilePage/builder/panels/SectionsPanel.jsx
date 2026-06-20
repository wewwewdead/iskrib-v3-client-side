import { PROFILE_SECTIONS, HERO_SUBBLOCK_SECTION_IDS } from "../profileThemeConstants";
import { isSectionVisible } from "../profileThemeUtils";

// V3A: the Sections tab now controls only the hero sub-blocks (stats / bio /
// joined date). Content containers (writings, media, opinions, stories, guestbook,
// pinned) are arranged in the Layout tab instead.
const HERO_SUBBLOCKS = PROFILE_SECTIONS.filter((s) => HERO_SUBBLOCK_SECTION_IDS.includes(s.id));

const SectionsPanel = ({ theme, onToggleSection }) => (
    <div className="pt-panel">
        <p className="pt-panel-hint">
            Show or hide the details inside your profile header. Your name and avatar always
            stay. Arrange the rest of your page in the <strong>Layout</strong> tab.
        </p>
        <div className="pt-section-list">
            {HERO_SUBBLOCKS.map((section) => {
                const visible = isSectionVisible(theme, section.id);
                return (
                    <div key={section.id} className={`pt-section-row${visible ? " is-visible" : ""}`}>
                        <span className="pt-section-name">{section.label}</span>
                        <div className="pt-section-control">
                            <span className="pt-section-state" aria-hidden="true">
                                {visible ? "Shown" : "Hidden"}
                            </span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={visible}
                                aria-label={`${visible ? "Hide" : "Show"} ${section.label}`}
                                className={`pt-toggle${visible ? " is-on" : ""}`}
                                onClick={() => onToggleSection(section.id)}
                            >
                                <span className="pt-toggle-knob" />
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
);

export default SectionsPanel;
