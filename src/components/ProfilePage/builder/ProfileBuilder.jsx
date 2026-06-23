import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import "./ProfileBuilder.css";
import "./profileTheme.css";
import "../layout/profileLayout.css";
import { updateProfileTheme } from "../../../../API/Api";
import { normalizeProfileTheme, getDefaultProfileTheme } from "./profileThemeUtils";
import { applyPresetToTheme } from "./profileThemePresets";
import { MAX_STICKERS, HERO_ELEMENT_LABELS } from "./profileThemeConstants";
import BuilderPreview from "./BuilderPreview";
import PresetsPanel from "./panels/PresetsPanel";
import ColorsPanel from "./panels/ColorsPanel";
import TypographyPanel from "./panels/TypographyPanel";
import CardsPanel from "./panels/CardsPanel";
import LayoutPanel from "./panels/LayoutPanel";
import SectionsPanel from "./panels/SectionsPanel";
import StickersPanel from "./panels/StickersPanel";
import HeroElementEditor from "./panels/HeroElementEditor";
import useThemeHistory from "./useThemeHistory";

const TABS = [
    { key: "presets", label: "Presets" },
    { key: "colors", label: "Colors" },
    { key: "typography", label: "Type" },
    { key: "cards", label: "Cards" },
    { key: "layout", label: "Layout" },
    { key: "sections", label: "Sections" },
    { key: "stickers", label: "Stickers" },
];

// Pure draft helpers — module-scope so they're stable references (no per-render
// allocation, and no implicit hook dependency).
const markCustom = (next) => ({ ...next, presetId: "custom" });
const reindexBlocks = (blocks) => blocks.map((b, i) => ({ ...b, order: i }));

// Mobile bottom-sheet states, cycled by the sheet grabber. "collapsed" keeps the
// canvas in focus (Preview mode); "half"/"expanded" surface the tool panel.
const SHEET_NEXT = { collapsed: "half", half: "expanded", expanded: "collapsed" };
// Ordered snap points for the swipe gesture (drag up = open more, down = close).
const SHEET_ORDER = ["collapsed", "half", "expanded"];
const SHEET_SWIPE_THRESHOLD = 26; // px of travel before a drag counts as a swipe
// Tabs that already act on the selected container — tapping a block keeps you
// here instead of yanking you over to Layout.
const CONTAINER_AWARE_TABS = new Set(["layout", "cards"]);

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
    // Mobile gets a dedicated app-shell: a canvas-first preview with a bottom
    // sheet for tools. Desktop ignores all of this (the sheet state is harmless).
    const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
    const [mobileSheetState, setMobileSheetState] = useState("collapsed");
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
    // The sticker selected on the canvas (-1 = none) — drives the Stickers editor.
    const [selectedStickerIndex, setSelectedStickerIndex] = useState(-1);
    // The free-hero element selected on the canvas — drives its per-element editor.
    const [selectedHeroEl, setSelectedHeroEl] = useState(null);
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
            setSelectedStickerIndex(-1);
            setSelectedHeroEl(null);
            // Mobile opens canvas-first — the sheet is tucked away until a tool
            // is picked, so the preview is fully visible the moment it opens.
            setMobileSheetState("collapsed");
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

    // Step the mobile bottom sheet through collapsed → half → expanded → collapsed.
    const cycleSheet = useCallback(() => {
        setMobileSheetState((s) => SHEET_NEXT[s] || "half");
    }, []);

    // Swipe the sheet up/down between snap points; a near-stationary press is a
    // tap and just cycles. Pointer-captured so the gesture keeps tracking after
    // the finger leaves the grabber (mirrors the StickerLayer drag pattern).
    const sheetDragRef = useRef(null);
    const onSheetPointerDown = useCallback((e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        sheetDragRef.current = { y: e.clientY, id: e.pointerId };
    }, []);
    const onSheetPointerUp = useCallback(
        (e) => {
            const st = sheetDragRef.current;
            if (!st) return;
            sheetDragRef.current = null;
            e.currentTarget.releasePointerCapture?.(st.id);
            const dy = e.clientY - st.y;
            if (dy <= -SHEET_SWIPE_THRESHOLD) {
                setMobileSheetState(
                    (s) => SHEET_ORDER[Math.min(SHEET_ORDER.indexOf(s) + 1, SHEET_ORDER.length - 1)]
                );
            } else if (dy >= SHEET_SWIPE_THRESHOLD) {
                setMobileSheetState((s) => SHEET_ORDER[Math.max(SHEET_ORDER.indexOf(s) - 1, 0)]);
            } else {
                cycleSheet();
            }
        },
        [cycleSheet]
    );

    // Tap a container in the preview → surface its controls on mobile (the core
    // "edit this container" gesture). Only fires from a real tap (onClick), never
    // mid-drag, so reordering a block never shrinks the canvas out from under it.
    const handleEditBlock = useCallback(
        (type) => {
            if (!isMobile || !type) return;
            setMobileSheetState((s) => (s === "collapsed" ? "half" : s));
            setActiveTab((t) => (CONTAINER_AWARE_TABS.has(t) ? t : "layout"));
        },
        [isMobile]
    );

    // Picking a tool surfaces the sheet (half) on mobile if it's tucked away, so
    // the chosen panel is actually visible. Desktop just switches tabs.
    const handleSelectTab = useCallback(
        (key) => {
            setActiveTab(key);
            if (isMobile) setMobileSheetState((s) => (s === "collapsed" ? "half" : s));
        },
        [isMobile]
    );

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
    // since the preset fully defines that container's look.
    const handlePatchLayoutBlock = useCallback((type, partial) => {
        setDraft((prev) =>
            markCustom({
                ...prev,
                layout: {
                    ...prev.layout,
                    blocks: prev.layout.blocks.map((b) => {
                        if (b.type !== type) return b;
                        const next = { ...b, ...partial };
                        if (partial.style && partial.style !== "inherit") {
                            delete next.card;
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
                        };
                    }),
                },
            });
        });
    }, [userData]);

    const handleAddSticker = useCallback((stickerId) => {
        setDraft((prev) => {
            if (prev.stickers.length >= MAX_STICKERS) return prev;
            // Stagger new stickers slightly so they don't stack perfectly.
            const offset = (prev.stickers.length % 5) * 6;
            // Select the freshly-added sticker so its controls show immediately.
            setSelectedStickerIndex(prev.stickers.length);
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

    // Select a sticker (clicking it on the canvas) and surface its editor.
    const handleSelectSticker = useCallback((index) => {
        setSelectedStickerIndex(index);
        if (index >= 0) {
            setActiveTab("stickers");
            // Bring the sheet up on mobile so the sticker's controls are reachable.
            if (isMobile) setMobileSheetState((s) => (s === "collapsed" ? "half" : s));
        }
    }, [isMobile]);

    // Patch one sticker's color / scale / rotation.
    const handleUpdateSticker = useCallback((index, partial) => {
        setDraft((prev) => ({
            ...prev,
            stickers: prev.stickers.map((s, i) => (i === index ? { ...s, ...partial } : s)),
        }));
    }, []);

    const handleRemoveSticker = useCallback((index) => {
        setDraft((prev) => ({ ...prev, stickers: prev.stickers.filter((_, i) => i !== index) }));
        setSelectedStickerIndex(-1);
    }, []);

    // ── Hero (fixed reorderable stack) ──
    // Reorder (drag a hero element up/down in the preview) → persist the new order.
    const handleHeroChange = useCallback((nextHero) => {
        setDraft((prev) => markCustom({ ...prev, hero: nextHero }));
    }, []);

    // Select a hero element (clicking it on the preview) → surface its editor.
    // Both the Sections and Colors tabs are element-aware, so if the user is
    // already on Colors we keep them there; otherwise we jump to Sections.
    const handleSelectHeroEl = useCallback((key) => {
        setSelectedHeroEl(key);
        // Surface the hero element's editor in the bottom sheet on mobile.
        if (key && isMobile) setMobileSheetState((s) => (s === "collapsed" ? "half" : s));
    }, [isMobile]);

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
            case "stickers":
                return (
                    <StickersPanel
                        theme={draft}
                        onAddSticker={handleAddSticker}
                        selectedIndex={selectedStickerIndex}
                        selectedSticker={
                            selectedStickerIndex >= 0 ? draft.stickers[selectedStickerIndex] || null : null
                        }
                        onUpdateSticker={handleUpdateSticker}
                        onRemoveSticker={handleRemoveSticker}
                        onDeselect={() => setSelectedStickerIndex(-1)}
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
        handleResetLayoutBlock,
        handlePatchBlockCard,
        handleResetBlockCard,
        selectedBlockType,
        handleToggleSection,
        handleAddSticker,
        selectedStickerIndex,
        handleUpdateSticker,
        handleRemoveSticker,
        selectedHeroEl,
        handleHeroPatchElement,
    ]);

    // Label shown in the mobile sheet header so it's always clear what the sheet
    // is editing — the active tool, or the hero element being tuned.
    const activeTabLabel = TABS.find((t) => t.key === activeTab)?.label || "Tools";
    const sheetTitle = selectedHeroEl
        ? `Editing ${HERO_ELEMENT_LABELS[selectedHeroEl] || selectedHeroEl}`
        : activeTabLabel;

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
                        className={`pt-builder${isMobile ? ` is-mobile sheet-${mobileSheetState}` : ""}`}
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
                                    onStickersChange={handleStickersChange}
                                    selectedStickerIndex={selectedStickerIndex}
                                    onSelectSticker={handleSelectSticker}
                                    onReorderBlocks={handleReorderLayout}
                                    onPatchBlock={handlePatchLayoutBlock}
                                    onMoveBlock={handleMoveBlock}
                                    onToggleBlock={handleToggleLayoutBlock}
                                    selectedType={selectedBlockType}
                                    onSelectType={setSelectedBlockType}
                                    onEditBlock={handleEditBlock}
                                    onHeroChange={handleHeroChange}
                                    selectedHeroEl={selectedHeroEl}
                                    onSelectHeroEl={handleSelectHeroEl}
                                />
                            </section>

                            <section className="pt-builder-tools">
                                {isMobile && (
                                    <button
                                        type="button"
                                        className="pt-sheet-header"
                                        onPointerDown={onSheetPointerDown}
                                        onPointerUp={onSheetPointerUp}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                cycleSheet();
                                            }
                                        }}
                                        aria-expanded={mobileSheetState !== "collapsed"}
                                        aria-label={`Tools — ${sheetTitle}. Swipe up or down, or tap to ${
                                            mobileSheetState === "expanded" ? "collapse" : "expand"
                                        }`}
                                    >
                                        <span className="pt-sheet-grabber-pill" aria-hidden="true" />
                                        <span className="pt-sheet-header-row">
                                            <span className="pt-sheet-title">{sheetTitle}</span>
                                            <span
                                                className={`pt-sheet-chevron sheet-${mobileSheetState}`}
                                                aria-hidden="true"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="m6 15 6-6 6 6" />
                                                </svg>
                                            </span>
                                        </span>
                                    </button>
                                )}
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
                                ) : (
                                    <>
                                        <nav className="pt-builder-tabs" aria-label="Customization tools">
                                            {TABS.map((tab) => (
                                                <button
                                                    key={tab.key}
                                                    type="button"
                                                    className={`pt-builder-tab${activeTab === tab.key ? " is-active" : ""}`}
                                                    aria-pressed={activeTab === tab.key}
                                                    onClick={() => handleSelectTab(tab.key)}
                                                >
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </nav>
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
