import {
    PROFILE_SECTIONS,
    HERO_SUBBLOCK_SECTION_IDS,
    HERO_ELEMENT_LABELS,
    HERO_ELEMENT_ALIGNS,
    HERO_ELEMENT_ALIGN_LABELS,
    HERO_ELEMENT_STYLES,
    HERO_ELEMENT_STYLE_LABELS,
} from "../profileThemeConstants";
import { STICKER_COLORS } from "../stickerRegistry";
import { isSectionVisible } from "../profileThemeUtils";

const isHex = (v) => typeof v === "string" && /^#[0-9a-fA-F]{6}$/.test(v);

// V3A: the Sections tab now controls only the hero sub-blocks (stats / bio /
// joined date). Content containers (writings, media, opinions, stories, guestbook,
// pinned) are arranged in the Layout tab instead.
const HERO_SUBBLOCKS = PROFILE_SECTIONS.filter((s) => HERO_SUBBLOCK_SECTION_IDS.includes(s.id));

const SectionsPanel = ({
    theme,
    onToggleSection,
    selectedHeroEl,
    selectedHeroElData,
    onHeroPatchElement,
    onClearHeroSelection,
}) => {
    return (
    <div className="pt-panel">
        {/* Per-element editor — only the SELECTED header container is changed. */}
        {selectedHeroElData && (
            <div className="pt-sticker-editor">
                <div className="pt-cards-scope">
                    <span className="pt-cards-scope-label">
                        Editing <strong>{HERO_ELEMENT_LABELS[selectedHeroEl] || selectedHeroEl}</strong>
                    </span>
                    <button type="button" className="pt-cards-scope-btn" onClick={onClearHeroSelection}>
                        Done
                    </button>
                </div>
                <div className="pt-field">
                    <span className="pt-field-label">Align</span>
                    <div className="pt-pblock__chips" role="group" aria-label="Element alignment">
                        {HERO_ELEMENT_ALIGNS.map((a) => (
                            <button
                                key={a}
                                type="button"
                                className={`pt-pblock__chip${(selectedHeroElData.align || "left") === a ? " is-active" : ""}`}
                                aria-pressed={(selectedHeroElData.align || "left") === a}
                                onClick={() => onHeroPatchElement(selectedHeroEl, { align: a })}
                            >
                                {HERO_ELEMENT_ALIGN_LABELS[a]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="pt-field">
                    <span className="pt-field-label">Background</span>
                    <div className="pt-pblock__chips" role="group" aria-label="Element background">
                        {HERO_ELEMENT_STYLES.map((s) => (
                            <button
                                key={s}
                                type="button"
                                className={`pt-pblock__chip${(selectedHeroElData.style || "none") === s ? " is-active" : ""}`}
                                aria-pressed={(selectedHeroElData.style || "none") === s}
                                onClick={() => onHeroPatchElement(selectedHeroEl, { style: s })}
                            >
                                {HERO_ELEMENT_STYLE_LABELS[s]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="pt-field">
                    <span className="pt-field-label">Text color</span>
                    <div className="pt-sticker-color-row" role="group" aria-label="Element text color">
                        {STICKER_COLORS.map((c) => {
                            const active = (selectedHeroElData.color || null) === c.value;
                            return (
                                <button
                                    key={c.label}
                                    type="button"
                                    className={`pt-sticker-color${active ? " is-active" : ""}${c.value === null ? " pt-sticker-color--accent" : ""}`}
                                    style={c.value ? { background: c.value } : undefined}
                                    aria-label={c.value === null ? "Default" : c.label}
                                    aria-pressed={active}
                                    title={c.value === null ? "Default (page color)" : c.label}
                                    onClick={() =>
                                        onHeroPatchElement(selectedHeroEl, c.value ? { color: c.value } : { color: undefined })
                                    }
                                />
                            );
                        })}
                        <label className="pt-sticker-color pt-sticker-color--custom" title="Custom color">
                            <input
                                type="color"
                                value={isHex(selectedHeroElData.color) ? selectedHeroElData.color : "#ffffff"}
                                onChange={(e) => onHeroPatchElement(selectedHeroEl, { color: e.target.value })}
                                aria-label="Custom text color"
                            />
                        </label>
                    </div>
                </div>

                <p className="pt-panel-hint">
                    These changes affect only this container.
                </p>
            </div>
        )}

        {/* Header arranging — the hero is a fixed stack; reorder by dragging. */}
        <div className="pt-cards-scope">
            <span className="pt-cards-scope-label">Header layout</span>
        </div>
        <p className="pt-panel-hint">
            Drag the <strong>avatar</strong>, <strong>name</strong>, <strong>stats</strong> and{" "}
            <strong>bio</strong> up or down on the preview to reorder them. Tap one to restyle it
            (alignment, background, color, font, size).
        </p>

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
};

export default SectionsPanel;
