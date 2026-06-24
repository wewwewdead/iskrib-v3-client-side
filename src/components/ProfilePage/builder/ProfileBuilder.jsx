import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import "./ProfileBuilder.css";
import "./profileTheme.css";
import "../layout/profileLayout.css";
import { updateProfileTheme } from "../../../../API/Api";
import { normalizeProfileTheme, getDefaultProfileTheme } from "./profileThemeUtils";
import { applyPresetToTheme } from "./profileThemePresets";
import { HERO_ELEMENT_LABELS, LAYOUT_BLOCK_LABELS } from "./profileThemeConstants";
import BuilderPreview from "./BuilderPreview";
import PresetsPanel from "./panels/PresetsPanel";
import ColorsPanel from "./panels/ColorsPanel";
import TypographyPanel from "./panels/TypographyPanel";
import CardsPanel from "./panels/CardsPanel";
import LayoutPanel from "./panels/LayoutPanel";
import SectionsPanel from "./panels/SectionsPanel";
import HeroElementEditor from "./panels/HeroElementEditor";
import { BlockStudioControls } from "./panels/blockStudioControls";
import PageStudioPanel from "./panels/PageStudioPanel";
import { TOOL_ICONS } from "./panels/toolIcons";
import useThemeHistory from "./useThemeHistory";

const TABS = [
    { key: "presets", label: "Presets" },
    { key: "colors", label: "Colors" },
    { key: "typography", label: "Type" },
    { key: "cards", label: "Cards" },
    { key: "layout", label: "Layout" },
    { key: "sections", label: "Sections" },
];

// Pure draft helpers — module-scope so they're stable references (no per-render
// allocation, and no implicit hook dependency).
const markCustom = (next) => ({ ...next, presetId: "custom" });
const reindexBlocks = (blocks) => blocks.map((b, i) => ({ ...b, order: i }));


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
    // Mobile is a canvas-only room-builder: there is NO tool sheet — every editor
    // (page / container / hero element) opens inline inside the tapped container.
    // Desktop keeps the tabbed tool sheet beside the canvas. `activeTab` is only
    // read by the desktop sheet.
    const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
    const [activeTab, setActiveTab] = useState("presets");
    // Draft theme with full undo/redo history. `set` is aliased to `setDraft` so
    // every existing mutation handler works unchanged; rapid drags coalesce into
    // one undo entry inside the hook.
    const {
        draft,
        set: setDraft,
        undo,
        redo,
        canUndo,
        canRedo,
        reset: resetHistory,
    } = useThemeHistory(getDefaultProfileTheme(userData));
    // The container selected in the live preview. When set, the Cards tab edits
    // THAT container's card style instead of the page-wide default.
    const [selectedBlockType, setSelectedBlockType] = useState(null);
    // The free-hero element selected on the canvas — drives its per-element editor.
    const [selectedHeroEl, setSelectedHeroEl] = useState(null);
    // Mobile (V5 room-builder): the "Page" container at the top of the canvas is
    // selected → its inline editor shows the global theme tools. Mutually exclusive
    // with a selected block / hero element so only one inline editor is ever open.
    const [pageSelected, setPageSelected] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(false);
    const [confirmingDiscard, setConfirmingDiscard] = useState(false);
    const [error, setError] = useState("");
    const closeTimerRef = useRef(null);
    // Serialized snapshot of the theme the session opened with. Lets us tell when
    // the draft has unsaved edits (dirty) so we can surface it + guard the close.
    const baselineRef = useRef(null);

    // (Re)initialize the draft each time the builder opens.
    useEffect(() => {
        if (open) {
            const init = initialTheme
                ? normalizeProfileTheme(initialTheme, userData)
                : getDefaultProfileTheme(userData);
            resetHistory(init);
            baselineRef.current = JSON.stringify(init);
            setActiveTab("presets");
            setError("");
            setJustSaved(false);
            setConfirmingDiscard(false);
            setSelectedBlockType(null);
            setSelectedHeroEl(null);
            setPageSelected(false);
        }
    }, [open, initialTheme, userData, resetHistory]);

    // Lock the page behind the modal so the body never scrolls under the builder
    // (especially on mobile, where the overlay covers the full dynamic viewport).
    useEffect(() => {
        if (!open) return undefined;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [open]);

    // Picking a tool switches the desktop tool tab (mobile has no tab rail — its
    // tools live inline in the tapped container, V5 room-builder).
    const handleSelectTab = useCallback((key) => {
        setActiveTab(key);
    }, []);

    // Has the draft diverged from the snapshot it opened with?
    const isDirty = useMemo(
        () => baselineRef.current != null && JSON.stringify(draft) !== baselineRef.current,
        [draft]
    );

    // Clear any pending post-save close timer on unmount.
    useEffect(() => () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    }, []);

    // Request a close. With unsaved edits this asks to confirm first (so a stray
    // Escape / Cancel never silently throws away the user's work); otherwise it
    // closes immediately. After a successful save the draft is no longer dirty.
    const requestClose = useCallback(() => {
        if (isSaving) return;
        if (isDirty && !justSaved) {
            setConfirmingDiscard(true);
            return;
        }
        onClose?.();
    }, [isDirty, isSaving, justSaved, onClose]);

    const handleDiscard = useCallback(() => {
        setConfirmingDiscard(false);
        onClose?.();
    }, [onClose]);

    // Keyboard: Escape backs out of the discard prompt then guards the close
    // (same as Cancel/×); Cmd/Ctrl+Z undoes, Cmd/Ctrl+Shift+Z (or Ctrl+Y) redoes.
    useEffect(() => {
        if (!open) return undefined;
        const onKeyDown = (e) => {
            if (e.key === "Escape") {
                if (confirmingDiscard) setConfirmingDiscard(false);
                else requestClose();
                return;
            }
            const mod = e.metaKey || e.ctrlKey;
            if (!mod) return;
            const key = e.key.toLowerCase();
            if (key === "z") {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            } else if (key === "y") {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, confirmingDiscard, requestClose, undo, redo]);

    // Applying a preset is just a normal committed change now — global undo
    // (Cmd/Ctrl+Z) restores the previous look, no special-case snapshot needed.
    const handleApplyPreset = useCallback((presetId) => {
        setDraft((prev) => applyPresetToTheme(prev, presetId));
    }, [setDraft]);

    const handlePatchColors = useCallback((partial) => {
        setDraft((prev) => markCustom({ ...prev, colors: { ...prev.colors, ...partial } }));
    }, [setDraft]);

    const handlePatchTypography = useCallback((partial) => {
        setDraft((prev) => markCustom({ ...prev, typography: { ...prev.typography, ...partial } }));
    }, [setDraft]);

    const handlePatchCards = useCallback((partial) => {
        setDraft((prev) => markCustom({ ...prev, cards: { ...prev.cards, ...partial } }));
    }, [setDraft]);

    const handlePatchBackground = useCallback((partial) => {
        setDraft((prev) => markCustom({ ...prev, background: { ...(prev.background || {}), ...partial } }));
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

    // Patch a single block's width / style / variant / title. Choosing a fixed
    // style preset (anything but "inherit") clears a per-container card override,
    // since the preset fully defines that container's look. The "Style" picker is
    // a quick surface shortcut, so it also keeps the V5 design.surface in sync
    // (inherit → the default glass surface); the Design disclosure shows the same.
    const handlePatchLayoutBlock = useCallback((type, partial) => {
        setDraft((prev) =>
            markCustom({
                ...prev,
                layout: {
                    ...prev.layout,
                    blocks: prev.layout.blocks.map((b) => {
                        if (b.type !== type) return b;
                        const next = { ...b, ...partial };
                        if (partial.style) {
                            const surface = partial.style === "inherit" ? "glass" : partial.style;
                            next.design = { ...(b.design || {}), surface };
                            if (partial.style !== "inherit") delete next.card;
                        }
                        return next;
                    }),
                },
            })
        );
    }, []);

    // Patch a single container's card override (style / radius / border / shadow).
    // Seeds from the block's existing override or the page default, and pins the
    // block to the "inherit" surface so the override is what renders.
    const handlePatchBlockCard = useCallback((type, partial) => {
        setDraft((prev) =>
            markCustom({
                ...prev,
                layout: {
                    ...prev.layout,
                    blocks: prev.layout.blocks.map((b) => {
                        if (b.type !== type) return b;
                        const baseCard = b.card || prev.cards;
                        return {
                            ...b,
                            style: "inherit",
                            card: {
                                style: baseCard.style,
                                radius: baseCard.radius,
                                border: baseCard.border,
                                shadow: baseCard.shadow,
                                ...partial,
                            },
                        };
                    }),
                },
            })
        );
    }, []);

    // Drop a container's card override → it follows the page-wide card style again.
    const handleResetBlockCard = useCallback((type) => {
        setDraft((prev) =>
            markCustom({
                ...prev,
                layout: {
                    ...prev.layout,
                    blocks: prev.layout.blocks.map((b) => {
                        if (b.type !== type || !b.card) return b;
                        const { card, ...rest } = b;
                        void card;
                        return rest;
                    }),
                },
            })
        );
    }, []);

    // Patch a single block's content controls (count / source / density / …).
    const handlePatchLayoutBlockContent = useCallback((type, partial) => {
        setDraft((prev) =>
            markCustom({
                ...prev,
                layout: {
                    ...prev.layout,
                    blocks: prev.layout.blocks.map((b) =>
                        b.type === type
                            ? { ...b, content: { ...(b.content || {}), ...partial } }
                            : b
                    ),
                },
            })
        );
    }, []);

    // Patch a single block's design controls (surface / tone / radius / shadow /
    // border / padding / header / titleAlign / accent) — V5 Container Design Studio.
    const handlePatchLayoutBlockDesign = useCallback((type, partial) => {
        setDraft((prev) =>
            markCustom({
                ...prev,
                layout: {
                    ...prev.layout,
                    blocks: prev.layout.blocks.map((b) =>
                        b.type === type
                            ? { ...b, design: { ...(b.design || {}), ...partial } }
                            : b
                    ),
                },
            })
        );
    }, []);

    // Reset a single block to its default width / style / variant / title / content.
    const handleResetLayoutBlock = useCallback((type) => {
        setDraft((prev) => {
            const fresh = getDefaultProfileTheme(userData).layout.blocks.find((b) => b.type === type);
            if (!fresh) return prev;
            return markCustom({
                ...prev,
                layout: {
                    ...prev.layout,
                    blocks: prev.layout.blocks.map((b) => {
                        if (b.type !== type) return b;
                        const { card, ...rest } = b;
                        void card;
                        return {
                            ...rest,
                            width: fresh.width,
                            style: fresh.style,
                            variant: fresh.variant,
                            title: fresh.title,
                            ...(fresh.content ? { content: { ...fresh.content } } : {}),
                            ...(fresh.design ? { design: { ...fresh.design } } : {}),
                        };
                    }),
                },
            });
        });
    }, [userData]);

    // ── Hero (fixed reorderable stack) ──
    // Reorder (drag a hero element up/down in the preview) → persist the new order.
    const handleHeroChange = useCallback((nextHero) => {
        setDraft((prev) => markCustom({ ...prev, hero: nextHero }));
    }, []);

    // Select a hero element (clicking it on the preview) → surface its editor.
    // Both the Sections and Colors tabs are element-aware, so if the user is
    // already on Colors we keep them there; otherwise we jump to Sections.
    // Selecting one thing clears the others so only one inline editor is open
    // (matters on mobile, where editors render inline in the canvas).
    const handleSelectHeroEl = useCallback((key) => {
        setSelectedHeroEl(key);
        if (key) {
            setSelectedBlockType(null);
            setPageSelected(false);
        }
    }, []);

    // Select a layout container (mutually exclusive with hero / page selection).
    const handleSelectBlockType = useCallback((type) => {
        setSelectedBlockType(type);
        if (type) {
            setSelectedHeroEl(null);
            setPageSelected(false);
        }
    }, []);

    // Tap the mobile "Page" container → toggle the global theme tools open/closed.
    const handleSelectPage = useCallback(() => {
        setPageSelected((v) => !v);
        setSelectedBlockType(null);
        setSelectedHeroEl(null);
    }, []);

    // The Page container's inline editor (mobile): the global theme tools, reusing
    // the existing panels. Built here because all the global handlers live here.
    const renderPageStudio = useCallback(
        () => (
            <PageStudioPanel
                theme={draft}
                onApplyPreset={handleApplyPreset}
                onPatchColors={handlePatchColors}
                onPatchBackground={handlePatchBackground}
                onPatchTypography={handlePatchTypography}
                onPatchCards={handlePatchCards}
                onToggleSection={handleToggleSection}
            />
        ),
        [draft, handleApplyPreset, handlePatchColors, handlePatchBackground, handlePatchTypography, handlePatchCards, handleToggleSection]
    );

    // Patch ONE hero element's align / style (isolated to that container).
    const handleHeroPatchElement = useCallback((key, partial) => {
        setDraft((prev) =>
            markCustom({
                ...prev,
                hero: {
                    ...prev.hero,
                    layout: {
                        ...prev.hero.layout,
                        [key]: { ...prev.hero.layout[key], ...partial },
                    },
                },
            })
        );
    }, []);

    const handleSave = useCallback(async () => {
        if (isSaving || justSaved) return;
        setIsSaving(true);
        setError("");
        try {
            const response = await updateProfileTheme(token, draft);
            onSaved?.(response?.profileTheme || draft);
            // The saved draft is the new baseline — it's no longer "unsaved".
            baselineRef.current = JSON.stringify(draft);
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
                return (
                    <ColorsPanel
                        theme={draft}
                        onPatchColors={handlePatchColors}
                        onPatchBackground={handlePatchBackground}
                        selectedHeroEl={selectedHeroEl}
                        selectedHeroElData={
                            selectedHeroEl ? draft.hero?.layout?.[selectedHeroEl] || null : null
                        }
                        onHeroPatchElement={handleHeroPatchElement}
                        onClearHeroSelection={() => setSelectedHeroEl(null)}
                    />
                );
            case "typography":
                return <TypographyPanel theme={draft} onPatchTypography={handlePatchTypography} />;
            case "cards":
                return (
                    <CardsPanel
                        theme={draft}
                        onPatchCards={handlePatchCards}
                        selectedBlock={
                            selectedBlockType
                                ? draft.layout.blocks.find((b) => b.type === selectedBlockType) || null
                                : null
                        }
                        onPatchBlockCard={handlePatchBlockCard}
                        onResetBlockCard={handleResetBlockCard}
                        onClearSelection={() => setSelectedBlockType(null)}
                    />
                );
            case "layout":
                return (
                    <LayoutPanel
                        theme={draft}
                        onReorder={handleReorderLayout}
                        onMoveBlock={handleMoveBlock}
                        onToggleBlock={handleToggleLayoutBlock}
                        onPatchBlock={handlePatchLayoutBlock}
                        onPatchBlockContent={handlePatchLayoutBlockContent}
                        onPatchBlockDesign={handlePatchLayoutBlockDesign}
                        onResetBlock={handleResetLayoutBlock}
                    />
                );
            case "sections":
                return (
                    <SectionsPanel
                        theme={draft}
                        onToggleSection={handleToggleSection}
                        selectedHeroEl={selectedHeroEl}
                        selectedHeroElData={
                            selectedHeroEl ? draft.hero?.layout?.[selectedHeroEl] || null : null
                        }
                        onHeroPatchElement={handleHeroPatchElement}
                        onClearHeroSelection={() => setSelectedHeroEl(null)}
                    />
                );
            default:
                return null;
        }
    }, [
        activeTab,
        draft,
        handleApplyPreset,
        handlePatchColors,
        handlePatchBackground,
        handlePatchTypography,
        handlePatchCards,
        handleReorderLayout,
        handleMoveBlock,
        handleToggleLayoutBlock,
        handlePatchLayoutBlock,
        handlePatchLayoutBlockContent,
        handlePatchLayoutBlockDesign,
        handleResetLayoutBlock,
        handlePatchBlockCard,
        handleResetBlockCard,
        selectedBlockType,
        handleToggleSection,
        selectedHeroEl,
        handleHeroPatchElement,
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
                        className={`pt-builder${isMobile ? " is-mobile" : ""}`}
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
                            <span
                                className={`pt-builder-status${
                                    justSaved ? " is-saved" : isDirty ? " is-dirty" : ""
                                }`}
                                role="status"
                                aria-live="polite"
                            >
                                {justSaved
                                    ? "Saved"
                                    : isDirty
                                      ? "Unsaved changes"
                                      : "All changes saved"}
                            </span>
                            <div className="pt-builder-history" role="group" aria-label="Undo and redo">
                                <button
                                    type="button"
                                    className="pt-builder-history-btn"
                                    onClick={undo}
                                    disabled={!canUndo}
                                    aria-label="Undo"
                                    title="Undo (Ctrl/Cmd+Z)"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="M9 14 4 9l5-5" />
                                        <path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5H9" />
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    className="pt-builder-history-btn"
                                    onClick={redo}
                                    disabled={!canRedo}
                                    aria-label="Redo"
                                    title="Redo (Ctrl/Cmd+Shift+Z)"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                        <path d="m15 14 5-5-5-5" />
                                        <path d="M20 9H9a5 5 0 0 0-5 5v0a5 5 0 0 0 5 5h6" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                type="button"
                                className="pt-builder-close"
                                onClick={requestClose}
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
                                    onReorderBlocks={handleReorderLayout}
                                    onPatchBlock={handlePatchLayoutBlock}
                                    onMoveBlock={handleMoveBlock}
                                    onToggleBlock={handleToggleLayoutBlock}
                                    selectedType={selectedBlockType}
                                    onSelectType={handleSelectBlockType}
                                    onHeroChange={handleHeroChange}
                                    selectedHeroEl={selectedHeroEl}
                                    onSelectHeroEl={handleSelectHeroEl}
                                    isMobile={isMobile}
                                    onPatchBlockContent={handlePatchLayoutBlockContent}
                                    onPatchBlockDesign={handlePatchLayoutBlockDesign}
                                    onResetBlock={handleResetLayoutBlock}
                                    onHeroPatchElement={handleHeroPatchElement}
                                    renderPageStudio={renderPageStudio}
                                    pageSelected={pageSelected}
                                    onSelectPage={handleSelectPage}
                                />
                            </section>

                            {!isMobile && (
                            <section className="pt-builder-tools">
                                {selectedHeroEl ? (
                                    <>
                                        <div className="pt-hero-edit-banner">
                                            <span>
                                                Editing <strong>{HERO_ELEMENT_LABELS[selectedHeroEl] || selectedHeroEl}</strong>
                                                {" "}— only this container is affected
                                            </span>
                                            <button type="button" onClick={() => setSelectedHeroEl(null)}>
                                                Done
                                            </button>
                                        </div>
                                        <div className="pt-builder-panel-scroll">
                                            <HeroElementEditor
                                                elementKey={selectedHeroEl}
                                                data={draft.hero?.layout?.[selectedHeroEl]}
                                                onPatch={handleHeroPatchElement}
                                            />
                                        </div>
                                    </>
                                ) : selectedBlockType && draft.layout?.blocks?.some((b) => b.type === selectedBlockType) ? (
                                    // A layout container is selected → focus the panel on
                                    // ONLY that container's layout + design editor (no tabs).
                                    // "Done" (or deselecting on the canvas) returns to normal.
                                    <>
                                        <div className="pt-hero-edit-banner">
                                            <span>
                                                Editing <strong>{LAYOUT_BLOCK_LABELS[selectedBlockType] || selectedBlockType}</strong>
                                                {" "}— only this container is affected
                                            </span>
                                            <button type="button" onClick={() => setSelectedBlockType(null)}>
                                                Done
                                            </button>
                                        </div>
                                        <div className="pt-builder-panel-scroll">
                                            <BlockStudioControls
                                                block={draft.layout.blocks.find((b) => b.type === selectedBlockType)}
                                                label={LAYOUT_BLOCK_LABELS[selectedBlockType] || selectedBlockType}
                                                onPatchBlock={handlePatchLayoutBlock}
                                                onPatchBlockContent={handlePatchLayoutBlockContent}
                                                onPatchBlockDesign={handlePatchLayoutBlockDesign}
                                                onResetBlock={handleResetLayoutBlock}
                                                defaultOpen
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <nav className="pt-builder-tabs" role="tablist" aria-label="Customization tools">
                                            {TABS.map((tab) => (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    className={`pt-builder-tab pt-tip${activeTab === tab.key ? " is-active" : ""}`}
                                                    role="tab"
                                                    aria-selected={activeTab === tab.key}
                                                    aria-label={tab.label}
                                                    data-tip={tab.label}
                                                    onClick={() => handleSelectTab(tab.key)}
                                                >
                                                    {TOOL_ICONS[tab.key]}
                                                </button>
                                            ))}
                                        </nav>
                                        <div className="pt-tool-panel-head">
                                            <span className="pt-tool-panel-head-icon" aria-hidden="true">
                                                {TOOL_ICONS[activeTab]}
                                            </span>
                                            {TABS.find((t) => t.key === activeTab)?.label}
                                        </div>
                                        <div className="pt-builder-panel-scroll">
                                            <AnimatePresence mode="wait" initial={false}>
                                                <Motion.div
                                                    key={activeTab}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -4 }}
                                                    transition={{ duration: 0.16, ease: [0.25, 1, 0.5, 1] }}
                                                >
                                                    {activePanel}
                                                </Motion.div>
                                            </AnimatePresence>
                                        </div>
                                    </>
                                )}
                            </section>
                            )}
                        </div>

                        <footer className="pt-builder-footer">
                            {error && <span className="pt-builder-error" role="alert">{error}</span>}
                            {confirmingDiscard ? (
                                <div className="pt-builder-discard" role="alertdialog" aria-label="Discard unsaved changes">
                                    <span className="pt-builder-discard-msg">
                                        Discard your unsaved changes?
                                    </span>
                                    <div className="pt-builder-footer-actions">
                                        <button
                                            type="button"
                                            className="pt-builder-cancel"
                                            onClick={() => setConfirmingDiscard(false)}
                                        >
                                            Keep editing
                                        </button>
                                        <button
                                            type="button"
                                            className="pt-builder-discard-confirm"
                                            onClick={handleDiscard}
                                        >
                                            Discard
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="pt-builder-footer-actions" aria-live="polite">
                                    <button type="button" className="pt-builder-cancel" onClick={requestClose} disabled={isSaving || justSaved}>
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
                            )}
                        </footer>
                    </Motion.div>
                </Motion.div>
            )}
        </AnimatePresence>
    );
};

export default ProfileBuilder;
