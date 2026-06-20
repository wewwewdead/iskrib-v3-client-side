import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import "./ProfileBuilder.css";
import "./profileTheme.css";
import "../layout/profileLayout.css";
import { updateProfileTheme } from "../../../../API/Api";
import { normalizeProfileTheme, getDefaultProfileTheme } from "./profileThemeUtils";
import { applyPresetToTheme } from "./profileThemePresets";
import { MAX_STICKERS } from "./profileThemeConstants";
import BuilderPreview from "./BuilderPreview";
import PresetsPanel from "./panels/PresetsPanel";
import ColorsPanel from "./panels/ColorsPanel";
import TypographyPanel from "./panels/TypographyPanel";
import CardsPanel from "./panels/CardsPanel";
import LayoutPanel from "./panels/LayoutPanel";
import SectionsPanel from "./panels/SectionsPanel";
import StickersPanel from "./panels/StickersPanel";

const TABS = [
    { key: "presets", label: "Presets" },
    { key: "colors", label: "Colors" },
    { key: "typography", label: "Type" },
    { key: "cards", label: "Cards" },
    { key: "layout", label: "Layout" },
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
    const [justSaved, setJustSaved] = useState(false);
    const [error, setError] = useState("");
    const closeTimerRef = useRef(null);

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
            setJustSaved(false);
        }
    }, [open, initialTheme, userData]);

    // Clear any pending post-save close timer on unmount.
    useEffect(() => () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }, []);

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

    // ── Layout (V3A) ──
    const reindexBlocks = (blocks) => blocks.map((b, i) => ({ ...b, order: i }));

    // Reorder by a fresh ordered list of blocks (from drag).
    const handleReorderLayout = useCallback((nextBlocks) => {
        setDraft((prev) =>
            markCustom({
                ...prev,
                layout: { ...prev.layout, blocks: reindexBlocks(nextBlocks) },
            })
        );
    }, []);

    // Move a single block up/down (keyboard / button accessible reordering).
    const handleMoveBlock = useCallback((type, direction) => {
        setDraft((prev) => {
            const blocks = [...prev.layout.blocks].sort((a, b) => a.order - b.order);
            const idx = blocks.findIndex((b) => b.type === type);
            if (idx === -1) return prev;
            const swapWith = direction === "up" ? idx - 1 : idx + 1;
            if (swapWith < 0 || swapWith >= blocks.length) return prev;
            [blocks[idx], blocks[swapWith]] = [blocks[swapWith], blocks[idx]];
            return markCustom({ ...prev, layout: { ...prev.layout, blocks: reindexBlocks(blocks) } });
        });
    }, []);

    // Toggle a content block's visibility. Keep the matching `section` in sync so
    // the page tabs (which read section visibility) stay consistent with the home.
    const handleToggleLayoutBlock = useCallback((type) => {
        setDraft((prev) => {
            const blocks = prev.layout.blocks.map((b) =>
                b.type === type ? { ...b, visible: !b.visible } : b
            );
            const target = blocks.find((b) => b.type === type);
            const nextVisible = target ? target.visible : true;
            return markCustom({
                ...prev,
                layout: { ...prev.layout, blocks },
                sections: prev.sections.map((s) =>
                    s.id === type ? { ...s, visible: nextVisible } : s
                ),
            });
        });
    }, []);

    // Patch a single block's width / style / variant / title.
    const handlePatchLayoutBlock = useCallback((type, partial) => {
        setDraft((prev) =>
            markCustom({
                ...prev,
                layout: {
                    ...prev.layout,
                    blocks: prev.layout.blocks.map((b) =>
                        b.type === type ? { ...b, ...partial } : b
                    ),
                },
            })
        );
    }, []);

    // Reset a single block to its default width / style / variant / title.
    const handleResetLayoutBlock = useCallback((type) => {
        setDraft((prev) => {
            const fresh = getDefaultProfileTheme(userData).layout.blocks.find((b) => b.type === type);
            if (!fresh) return prev;
            return markCustom({
                ...prev,
                layout: {
                    ...prev.layout,
                    blocks: prev.layout.blocks.map((b) =>
                        b.type === type
                            ? { ...b, width: fresh.width, style: fresh.style, variant: fresh.variant, title: fresh.title }
                            : b
                    ),
                },
            });
        });
    }, [userData]);

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
        if (isSaving || justSaved) return;
        setIsSaving(true);
        setError("");
        try {
            const response = await updateProfileTheme(token, draft);
            onSaved?.(response?.profileTheme || draft);
            // Calm success beat: confirm "Saved", let the preview settle, then close.
            setIsSaving(false);
            setJustSaved(true);
            closeTimerRef.current = setTimeout(() => {
                onClose?.();
            }, 1050);
        } catch {
            setError("Couldn't save your theme. Please try again.");
            setIsSaving(false);
        }
    }, [draft, isSaving, justSaved, onClose, onSaved, token]);

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
            case "layout":
                return (
                    <LayoutPanel
                        theme={draft}
                        onReorder={handleReorderLayout}
                        onMoveBlock={handleMoveBlock}
                        onToggleBlock={handleToggleLayoutBlock}
                        onPatchBlock={handlePatchLayoutBlock}
                        onResetBlock={handleResetLayoutBlock}
                    />
                );
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
        handleReorderLayout,
        handleMoveBlock,
        handleToggleLayoutBlock,
        handlePatchLayoutBlock,
        handleResetLayoutBlock,
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
                            <section
                                className={`pt-builder-preview${justSaved ? " is-saved" : ""}`}
                                aria-label="Live preview"
                            >
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
                            <div className="pt-builder-footer-actions" aria-live="polite">
                                <button type="button" className="pt-builder-cancel" onClick={onClose} disabled={isSaving || justSaved}>
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className={`pt-builder-save${justSaved ? " is-saved" : ""}`}
                                    onClick={handleSave}
                                    disabled={isSaving || justSaved}
                                >
                                    {justSaved ? (
                                        <>
                                            <svg className="pt-save-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                                <path d="M5 13l4 4L19 7" />
                                            </svg>
                                            Saved
                                        </>
                                    ) : isSaving ? "Saving…" : "Save profile"}
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
