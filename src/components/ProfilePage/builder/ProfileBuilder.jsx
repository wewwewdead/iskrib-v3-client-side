import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import "./ProfileBuilder.css";
import "./profileTheme.css";
import { updateProfileTheme } from "../../../../API/Api";
import { normalizeProfileTheme, getDefaultProfileTheme } from "./profileThemeUtils";
import { applyPresetToTheme } from "./profileThemePresets";
import { MAX_STICKERS } from "./profileThemeConstants";
import BuilderPreview from "./BuilderPreview";
import PresetsPanel from "./panels/PresetsPanel";
import ColorsPanel from "./panels/ColorsPanel";
import TypographyPanel from "./panels/TypographyPanel";
import CardsPanel from "./panels/CardsPanel";
import SectionsPanel from "./panels/SectionsPanel";
import StickersPanel from "./panels/StickersPanel";

const TABS = [
    { key: "presets", label: "Presets" },
    { key: "colors", label: "Colors" },
    { key: "typography", label: "Type" },
    { key: "cards", label: "Cards" },
    { key: "sections", label: "Sections" },
    { key: "stickers", label: "Stickers" },
];

const ProfileBuilder = ({
    open,
    onClose,
    userData,
    initialTheme,
    token,
    onSaved,
    followerCount,
    followingCount,
}) => {
    const [activeTab, setActiveTab] = useState("presets");
    const [draft, setDraft] = useState(() => getDefaultProfileTheme(userData));
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");

    // (Re)initialize the draft each time the builder opens.
    useEffect(() => {
        if (open) {
            setDraft(
                initialTheme
                    ? normalizeProfileTheme(initialTheme, userData)
                    : getDefaultProfileTheme(userData)
            );
            setActiveTab("presets");
            setError("");
        }
    }, [open, initialTheme, userData]);

    // Close on Escape.
    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (e) => {
            if (e.key === "Escape") onClose?.();
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    const markCustom = (next) => ({ ...next, presetId: "custom" });

    const handleApplyPreset = useCallback((presetId) => {
        setDraft((prev) => applyPresetToTheme(prev, presetId));
    }, []);

    const handlePatchColors = useCallback((partial) => {
        setDraft((prev) => markCustom({ ...prev, colors: { ...prev.colors, ...partial } }));
    }, []);

    const handlePatchTypography = useCallback((partial) => {
        setDraft((prev) => markCustom({ ...prev, typography: { ...prev.typography, ...partial } }));
    }, []);

    const handlePatchCards = useCallback((partial) => {
        setDraft((prev) => markCustom({ ...prev, cards: { ...prev.cards, ...partial } }));
    }, []);

    const handleToggleSection = useCallback((sectionId) => {
        setDraft((prev) => ({
            ...prev,
            sections: prev.sections.map((s) =>
                s.id === sectionId ? { ...s, visible: !s.visible } : s
            ),
        }));
    }, []);

    const handleAddSticker = useCallback((stickerId) => {
        setDraft((prev) => {
            if (prev.stickers.length >= MAX_STICKERS) return prev;
            // Stagger new stickers slightly so they don't stack perfectly.
            const offset = (prev.stickers.length % 5) * 6;
            return {
                ...prev,
                stickers: [
                    ...prev.stickers,
                    { id: stickerId, x: 40 + offset, y: 30 + offset, rotation: -6, scale: 1 },
                ],
            };
        });
    }, []);

    const handleStickersChange = useCallback((nextStickers) => {
        setDraft((prev) => ({ ...prev, stickers: nextStickers }));
    }, []);

    const handleSave = useCallback(async () => {
        if (isSaving) return;
        setIsSaving(true);
        setError("");
        try {
            const response = await updateProfileTheme(token, draft);
            onSaved?.(response?.profileTheme || draft);
            onClose?.();
        } catch {
            setError("Couldn't save your theme. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }, [draft, isSaving, onClose, onSaved, token]);

    const activePanel = useMemo(() => {
        switch (activeTab) {
            case "presets":
                return <PresetsPanel theme={draft} onApplyPreset={handleApplyPreset} />;
            case "colors":
                return <ColorsPanel theme={draft} onPatchColors={handlePatchColors} />;
            case "typography":
                return <TypographyPanel theme={draft} onPatchTypography={handlePatchTypography} />;
            case "cards":
                return <CardsPanel theme={draft} onPatchCards={handlePatchCards} />;
            case "sections":
                return <SectionsPanel theme={draft} onToggleSection={handleToggleSection} />;
            case "stickers":
                return <StickersPanel theme={draft} onAddSticker={handleAddSticker} />;
            default:
                return null;
        }
    }, [
        activeTab,
        draft,
        handleApplyPreset,
        handlePatchColors,
        handlePatchTypography,
        handlePatchCards,
        handleToggleSection,
        handleAddSticker,
    ]);

    return (
        <AnimatePresence>
            {open && (
                <Motion.div
                    className="pt-builder-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Customize profile"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <Motion.div
                        className="pt-builder"
                        initial={{ scale: 0.96, y: 16, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.97, y: 8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 240, damping: 26 }}
                    >
                        <header className="pt-builder-header">
                            <div className="pt-builder-title">
                                <h2>Customize profile</h2>
                                <p>Design your space — changes apply after you save.</p>
                            </div>
                            <button
                                type="button"
                                className="pt-builder-close"
                                onClick={onClose}
                                aria-label="Close customizer"
                            >
                                ×
                            </button>
                        </header>

                        <div className="pt-builder-body">
                            <section className="pt-builder-preview" aria-label="Live preview">
                                <BuilderPreview
                                    theme={draft}
                                    userData={userData}
                                    followerCount={followerCount}
                                    followingCount={followingCount}
                                    onStickersChange={handleStickersChange}
                                />
                            </section>

                            <section className="pt-builder-tools">
                                <nav className="pt-builder-tabs" aria-label="Customization tools">
                                    {TABS.map((tab) => (
                                        <button
                                            key={tab.key}
                                            type="button"
                                            className={`pt-builder-tab${activeTab === tab.key ? " is-active" : ""}`}
                                            aria-pressed={activeTab === tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </nav>
                                <div className="pt-builder-panel-scroll">{activePanel}</div>
                            </section>
                        </div>

                        <footer className="pt-builder-footer">
                            {error && <span className="pt-builder-error" role="alert">{error}</span>}
                            <div className="pt-builder-footer-actions">
                                <button type="button" className="pt-builder-cancel" onClick={onClose} disabled={isSaving}>
                                    Cancel
                                </button>
                                <button type="button" className="pt-builder-save" onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? "Saving…" : "Save profile"}
                                </button>
                            </div>
                        </footer>
                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProfileBuilder;
