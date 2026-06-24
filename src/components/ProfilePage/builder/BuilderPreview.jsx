import { useMemo, useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
    profileThemeToCssVars,
    isSectionVisible,
    getVisibleOrderedLayoutBlocks,
    getOrderedLayoutBlocks,
    getBlockContent,
    getBlockCardCssVars,
    getBlockDesign,
    getBlockDesignDataAttrs,
    getBlockDesignStyle,
    composeProfileBackgroundStyle,
    resolveLegacyBackgroundForMotion,
} from "./profileThemeUtils";
import { isAnimatedBackground, getStaticBackgroundStyle } from "../background/backgroundUtils";
import usePrefersReducedMotion from "../../../hooks/usePrefersReducedMotion";
import {
    LAYOUT_BLOCK_LABELS,
    LAYOUT_WIDTH_LABELS,
    LAYOUT_STYLE_LABELS,
    ALLOWED_LAYOUT_STYLES,
    HERO_ELEMENT_LABELS,
} from "./profileThemeConstants";
import { RENDERABLE_LAYOUT_BLOCK_TYPES, blockWidthClass } from "../layout/profileLayoutUtils";
import { BlockStudioControls } from "./panels/blockStudioControls";
import HeroElementEditor from "./panels/HeroElementEditor";
import { resolveBlockItems, EMPTY_STATE_COPY } from "../layout/previewCards/previewUtils";
import WritingsPreview from "../layout/previewCards/WritingsPreview";
import MediaPreview from "../layout/previewCards/MediaPreview";
import OpinionsPreview from "../layout/previewCards/OpinionsPreview";
import StoriesPreview from "../layout/previewCards/StoriesPreview";
import PreviewSkeleton from "../layout/previewCards/PreviewSkeleton";
import PreviewEmptyState from "../layout/previewCards/PreviewEmptyState";
import { getProfilePreview, getProfileGuestbook } from "../../../../API/Api";
import FreeHero from "../layout/FreeHero";
import formatCounts from "../../../../helpers/fomatCounts";

// Widths the preview can cycle through, ordered narrow → wide. Used by both the
// edge-drag resize (snaps to the nearest) and the inline width chips.
const PREVIEW_WIDTHS = ["compact", "half", "full"];
const previewWidthClass = (width) =>
    `pt-pblock--${PREVIEW_WIDTHS.includes(width) ? width : "full"}`;

/**
 * Live body for a layout block in the builder preview — renders the user's REAL
 * content (writings/media/opinions/stories) using the exact same preview cards
 * the published profile uses, so the builder is true WYSIWYG. The body is purely
 * visual: it's wrapped in a `pointer-events: none` layer so every gesture (tap to
 * select, drag to reorder, edge-drag to resize) lands on the block shell, never
 * on a card inside it. Falls back to a skeleton while loading and a calm empty
 * state when the user has no content of that kind yet. Guestbook renders REAL
 * notes read-only (fetched from the public guestbook endpoint) so its design
 * controls preview accurately, without pulling in the interactive component.
 */
const PreviewBlockBody = ({ type, content, variant, preview, isPreviewLoading, isOwn, guestbook, isGuestbookLoading }) => {
    if (type === "guestbook") {
        const notes = (guestbook || []).slice(0, Math.min(content.count || 3, 5));
        return (
            <div className="pt-pblock__realbody" aria-hidden="true">
                {isGuestbookLoading ? (
                    <PreviewSkeleton type="writings" />
                ) : notes.length === 0 ? (
                    <PreviewEmptyState
                        message="No notes yet."
                        hint={isOwn ? "Visitors can leave you a note here." : undefined}
                    />
                ) : (
                    <div className="pl-gb-mini">
                        {notes.map((n) => (
                            <div key={n.id} className="pl-gb-mininote">
                                <img
                                    className="pl-gb-miniavatar"
                                    src={n.author?.image_url || "/assets/profile.jpg"}
                                    alt=""
                                    loading="lazy"
                                />
                                <div className="pl-gb-minibody">
                                    <span className="pl-gb-miniauthor">
                                        {n.author?.name || n.author?.username || "Someone"}
                                    </span>
                                    <span className="pl-gb-minimsg">{n.message}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    const items = resolveBlockItems(type, content.source, preview);

    const inner = () => {
        if (isPreviewLoading) return <PreviewSkeleton type={type} />;
        if (!items.length) {
            const copy = EMPTY_STATE_COPY[type] || { message: "Nothing here yet." };
            return <PreviewEmptyState message={copy.message} hint={isOwn ? copy.ownerHint : undefined} />;
        }
        const common = {
            items,
            variant,
            count: content.count,
            density: content.density,
            imageShape: content.imageShape,
            showMeta: content.showMeta,
            showExcerpt: content.showExcerpt,
            // Display-only in the builder: no-op click handlers so a card never
            // throws if it's reached (the body is also pointer-events:none).
            onItemClick: () => {},
            onStoryClick: () => {},
        };
        switch (type) {
            case "writings":
                return <WritingsPreview {...common} />;
            case "pinned_writings":
                return <WritingsPreview {...common} variant={variant === "compact" ? "compact" : "editorial"} />;
            case "media":
                return <MediaPreview {...common} />;
            case "opinions":
                return <OpinionsPreview {...common} />;
            case "stories":
                return <StoriesPreview {...common} />;
            default:
                return null;
        }
    };

    // pointer-events:none keeps the real cards display-only so block gestures win.
    return (
        <div className="pt-pblock__realbody" aria-hidden="true">
            {inner()}
        </div>
    );
};

/**
 * One directly-editable block inside the live preview. The whole header is a
 * drag zone (reorder), the right edge is a resize handle (snaps width), and a
 * selection toolbar exposes width / move / hide. All of these route through the
 * SAME draft handlers the Layout tab uses — the preview is just a second, more
 * tactile surface onto the same state. Keyboard users can still do everything
 * from the Layout tab; nothing here is drag-only.
 */
const PreviewLayoutBlock = ({
    block,
    theme,
    index,
    total,
    selected,
    onSelect,
    onEditBlock,
    onPatchBlock,
    onMoveBlock,
    onToggleBlock,
    preview,
    isPreviewLoading,
    guestbook,
    isGuestbookLoading,
    isOwn,
    isMobile = false,
    onPatchBlockContent,
    onPatchBlockDesign,
    onResetBlock,
}) => {
    const dragControls = useDragControls();
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef(null);

    const label = LAYOUT_BLOCK_LABELS[block.type] || block.type;
    const content = getBlockContent(block);
    const cardVars = getBlockCardCssVars(theme, block);
    const design = getBlockDesign(block);
    const designAttrs = getBlockDesignDataAttrs(design);
    const blockStyle = { ...(cardVars || {}), ...getBlockDesignStyle(design) };
    const styleProp = Object.keys(blockStyle).length ? blockStyle : undefined;
    const styleCls = cardVars ? "pl-block--inherit" : "pl-block--design";
    // Mobile shows the container's FULL editor inline (no tool sheet); desktop
    // keeps quick width/style chips here and the full controls in the Layout tab.
    const useStudio = isMobile && onPatchBlockContent && onPatchBlockDesign && onResetBlock;

    // Map the pointer's x within the block's row to the nearest discrete width.
    // Left edge is fixed (blocks are left-aligned), so dragging the right edge
    // out/in grows/shrinks the block — snapping compact → half → full.
    const widthForPointer = (clientX) => {
        const st = resizeRef.current;
        if (!st?.blockEl || !st?.containerEl) return block.width;
        const blockLeft = st.blockEl.getBoundingClientRect().left;
        const containerWidth = st.containerEl.getBoundingClientRect().width;
        if (containerWidth === 0) return block.width;
        const fraction = (clientX - blockLeft) / containerWidth;
        if (fraction >= 0.8) return "full";
        if (fraction >= 0.5) return "half";
        return "compact";
    };

    const onResizeDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const handleEl = e.currentTarget;
        const blockEl = handleEl.closest(".pt-pblock");
        handleEl.setPointerCapture?.(e.pointerId);
        resizeRef.current = {
            pointerId: e.pointerId,
            blockEl,
            containerEl: blockEl?.parentElement || null,
        };
        setIsResizing(true);
        onSelect(block.type);
    };

    const onResizeMove = (e) => {
        if (!resizeRef.current) return;
        const next = widthForPointer(e.clientX);
        if (next !== block.width) onPatchBlock(block.type, { width: next });
    };

    const endResize = (e) => {
        const st = resizeRef.current;
        if (st) {
            e.currentTarget.releasePointerCapture?.(st.pointerId);
            resizeRef.current = null;
        }
        setIsResizing(false);
    };

    return (
        <Reorder.Item
            value={block.type}
            dragListener={false}
            dragControls={dragControls}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            style={styleProp}
            {...designAttrs}
            className={`pt-pblock ${previewWidthClass(block.width)} ${styleCls}${
                selected ? " is-selected" : ""
            }${isDragging ? " is-dragging" : ""}${isResizing ? " is-resizing" : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(block.type);
                // Tap (not drag) → surface this container's controls on mobile.
                onEditBlock?.(block.type);
            }}
        >
            <div className="pt-pblock__head">
                {/* The header strip selects the block, and with a mouse/pen it also
                    starts a reorder drag (desktop behaviour, unchanged). On TOUCH
                    the strip stays scroll-safe — a reorder must be started from the
                    ⠿ grip — so swiping over a block header scrolls the canvas
                    instead of accidentally reordering it (mirrors FreeHero). */}
                <span
                    className="pt-pblock__drag"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onSelect(block.type);
                        if (e.pointerType !== "touch") dragControls.start(e);
                    }}
                >
                    {/* The ⠿ grip is the dedicated reorder handle — it starts a drag
                        on every pointer type, so touch users get a clear, scroll-safe
                        way to reorder from the preview. */}
                    <span
                        className="pt-pblock__grip"
                        role="button"
                        aria-label={`Drag to reorder ${label}`}
                        title="Drag to reorder"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                            onSelect(block.type);
                            dragControls.start(e);
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="8" cy="6" r="1.6" />
                            <circle cx="16" cy="6" r="1.6" />
                            <circle cx="8" cy="12" r="1.6" />
                            <circle cx="16" cy="12" r="1.6" />
                            <circle cx="8" cy="18" r="1.6" />
                            <circle cx="16" cy="18" r="1.6" />
                        </svg>
                    </span>
                    <span className="pt-preview-block-title">
                        {block.title || label}
                    </span>
                </span>

                {selected && (
                    <span className="pt-pblock__actions">
                        <button
                            type="button"
                            className="pt-pblock__btn"
                            aria-label={`Move ${label} up`}
                            disabled={index === 0}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveBlock(block.type, "up");
                            }}
                        >
                            ↑
                        </button>
                        <button
                            type="button"
                            className="pt-pblock__btn"
                            aria-label={`Move ${label} down`}
                            disabled={index === total - 1}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMoveBlock(block.type, "down");
                            }}
                        >
                            ↓
                        </button>
                        <button
                            type="button"
                            className="pt-pblock__btn"
                            aria-label={`Hide ${label}`}
                            title="Hide block"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleBlock(block.type);
                            }}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                                <circle cx="12" cy="12" r="3" />
                                <path d="m3 3 18 18" />
                            </svg>
                        </button>
                    </span>
                )}
            </div>

            <PreviewBlockBody
                type={block.type}
                content={content}
                variant={block.variant}
                preview={preview}
                isPreviewLoading={isPreviewLoading}
                guestbook={guestbook}
                isGuestbookLoading={isGuestbookLoading}
                isOwn={isOwn}
            />

            {selected && (
                <div
                    className={`pt-pblock__edit${useStudio ? " pt-pblock__edit--studio" : ""}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Per-container controls — these write to THIS block only
                        (onPatchBlock(block.type, …)), so editing one container's
                        look never touches the others. On MOBILE (the V5 room-builder
                        with no tool sheet) the container's FULL editor lives right
                        here inside it: width/style/variant/title + Content + Design.
                        On desktop the canvas keeps quick width/style chips and the
                        Layout tab in the sheet carries the full controls. */}
                    {useStudio ? (
                        <BlockStudioControls
                            block={block}
                            label={label}
                            onPatchBlock={onPatchBlock}
                            onPatchBlockContent={onPatchBlockContent}
                            onPatchBlockDesign={onPatchBlockDesign}
                            onResetBlock={onResetBlock}
                        />
                    ) : (
                        <>
                            <span className="pt-pblock__edit-label">Width</span>
                            <div className="pt-pblock__chips" role="group" aria-label={`${label} width`}>
                                {PREVIEW_WIDTHS.map((w) => (
                                    <button
                                        key={w}
                                        type="button"
                                        className={`pt-pblock__chip${block.width === w ? " is-active" : ""}`}
                                        aria-pressed={block.width === w}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPatchBlock(block.type, { width: w });
                                        }}
                                    >
                                        {LAYOUT_WIDTH_LABELS[w] || w}
                                    </button>
                                ))}
                            </div>

                            <span className="pt-pblock__edit-label">Style</span>
                            <div className="pt-pblock__chips" role="group" aria-label={`${label} style`}>
                                {ALLOWED_LAYOUT_STYLES.map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        className={`pt-pblock__chip${block.style === s ? " is-active" : ""}`}
                                        aria-pressed={block.style === s}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPatchBlock(block.type, { style: s });
                                        }}
                                    >
                                        {LAYOUT_STYLE_LABELS[s] || s}
                                    </button>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Right-edge resize handle — drag to grow/shrink the block. */}
            <span
                className="pt-pblock__resize"
                role="button"
                aria-label={`Resize ${label}`}
                title="Drag to resize"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={onResizeDown}
                onPointerMove={onResizeMove}
                onPointerUp={endResize}
                onPointerCancel={endResize}
            />
        </Reorder.Item>
    );
};

/**
 * Live preview of the profile hero + layout as the draft theme is edited.
 *
 * When the layout edit handlers are supplied the content blocks become a fully
 * interactive canvas: drag a block by its header to reorder, drag its right edge
 * (or use the width chips) to resize, and use the per-block toolbar to move/hide.
 */
const BuilderPreview = ({
    theme,
    userData,
    followerCount,
    followingCount,
    onReorderBlocks,
    onPatchBlock,
    onMoveBlock,
    onToggleBlock,
    selectedType: selectedTypeProp,
    onSelectType,
    onEditBlock,
    onHeroChange,
    selectedHeroEl,
    onSelectHeroEl,
    // Mobile (V5 room-builder, no tool sheet): full per-container editing happens
    // inline in the canvas. These are only used when isMobile is true.
    isMobile = false,
    onPatchBlockContent,
    onPatchBlockDesign,
    onResetBlock,
    onHeroPatchElement,
    renderPageStudio,
    pageSelected = false,
    onSelectPage,
}) => {
    // Both are pure derivations of (theme, userData) — memoized so selection-only
    // re-renders (clicking a block/sticker) don't re-run the full theme normalize.
    const cssVars = useMemo(() => profileThemeToCssVars(theme, userData), [theme, userData]);
    const prefersReducedMotion = usePrefersReducedMotion();
    // The theme's gradient OVERLAYS the background. The builder is an editing
    // surface, so animated (GIF/video) backgrounds ALWAYS render as a static
    // poster here — keeping drag/resize/content editing smooth (no FPS drops on
    // a profile with a GIF background). Static image/gradient backgrounds compose
    // normally; the live page is where motion plays.
    const background = useMemo(() => {
        const raw = userData?.background;
        const base = isAnimatedBackground(raw)
            ? getStaticBackgroundStyle(raw, { posterForAnimated: true })
            : resolveLegacyBackgroundForMotion(raw, prefersReducedMotion);
        return composeProfileBackgroundStyle(theme, base) || null;
    }, [theme, userData, prefersReducedMotion]);

    // Fetch the user's REAL content for the preview — same React Query key the
    // published profile uses, so it's a shared cache hit (no extra request). The
    // builder always edits the owner's own profile (isOwn), so empty blocks show
    // the gentle owner hint. Only fetched when the layout has a content block.
    const previewUsername = userData?.username;
    const themeHasContentBlocks = useMemo(
        () =>
            getVisibleOrderedLayoutBlocks(theme).some(
                (b) => b.type !== "guestbook" && RENDERABLE_LAYOUT_BLOCK_TYPES.includes(b.type)
            ),
        [theme]
    );
    const { data: livePreview, isLoading: previewLoading } = useQuery({
        queryKey: ["profilePreview", previewUsername],
        queryFn: () => getProfilePreview(previewUsername),
        enabled: !!previewUsername && themeHasContentBlocks,
        staleTime: 1000 * 60,
        refetchOnWindowFocus: false,
    });
    const isPreviewLoading = previewLoading && themeHasContentBlocks;

    // Guestbook notes preview (public endpoint, read-only) so the guestbook block
    // shows real content while its design is being tuned. Shares the same query
    // key as the live ProfileGuestbook, so it's a cache hit when already loaded.
    const themeHasGuestbook = useMemo(
        () => getVisibleOrderedLayoutBlocks(theme).some((b) => b.type === "guestbook"),
        [theme]
    );
    const { data: guestbookData, isLoading: guestbookLoading } = useQuery({
        queryKey: ["guestbook", previewUsername],
        queryFn: () => getProfileGuestbook(previewUsername),
        enabled: !!previewUsername && themeHasGuestbook,
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: false,
    });
    const guestbookEntries = guestbookData?.entries || [];
    const isGuestbookLoading = guestbookLoading && themeHasGuestbook;

    // Selection is controlled when the parent supplies onSelectType (so the
    // Cards tab can edit the selected container); otherwise it's self-managed.
    const [internalSelected, setInternalSelected] = useState(null);
    const isControlled = typeof onSelectType === "function";
    const selectedType = isControlled ? selectedTypeProp ?? null : internalSelected;
    const setSelectedType = isControlled ? onSelectType : setInternalSelected;

    const showStats = isSectionVisible(theme, "stats");
    const showBio = isSectionVisible(theme, "bio");
    const showJoined = isSectionVisible(theme, "joined_date");

    const interactive = Boolean(onReorderBlocks && onPatchBlock && onMoveBlock && onToggleBlock);

    const layoutBlocks = getVisibleOrderedLayoutBlocks(theme).filter((b) =>
        RENDERABLE_LAYOUT_BLOCK_TYPES.includes(b.type)
    );
    const visibleTypes = layoutBlocks.map((b) => b.type);

    // Reorder by the new order of *visible* block types. Hidden blocks keep their
    // slots in the full list so toggling a block off then dragging never drops it.
    const handleReorder = (nextVisibleTypes) => {
        const allRenderable = getOrderedLayoutBlocks(theme).filter((b) =>
            RENDERABLE_LAYOUT_BLOCK_TYPES.includes(b.type)
        );
        const byType = new Map(allRenderable.map((b) => [b.type, b]));
        const queue = [...nextVisibleTypes];
        const merged = allRenderable
            .map((b) => (b.visible === false ? b : byType.get(queue.shift())))
            .filter(Boolean);
        onReorderBlocks(merged);
    };

    // Mobile container-first editing: the whole page is itself a tappable "Page"
    // container at the top of the canvas. Tapping it opens the global theme tools
    // (presets / colors / type / cards / sections) inline — exactly like tapping
    // any other container opens its own editor. Desktop keeps the tool sheet.
    const showPageContainer = isMobile && typeof renderPageStudio === "function";
    const showHeroInlineEditor = isMobile && selectedHeroEl && typeof onHeroPatchElement === "function";

    return (
        <div className="pt-preview-wrap pt-scope" style={cssVars}>
            <div className="pt-preview-surface" style={background || undefined}>
                {showPageContainer && (
                    <div className={`pt-page-container${pageSelected ? " is-selected" : ""}`}>
                        <button
                            type="button"
                            className="pt-page-container-head"
                            aria-expanded={pageSelected}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectPage?.();
                            }}
                        >
                            <span className="pt-page-container-icon" aria-hidden="true">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                                </svg>
                            </span>
                            <span className="pt-page-container-label">Page · theme, colors &amp; type</span>
                            <span className="pt-page-container-hint">{pageSelected ? "Close" : "Tap to edit"}</span>
                        </button>
                        {pageSelected && (
                            <div className="pt-page-container-body" onClick={(e) => e.stopPropagation()}>
                                {renderPageStudio()}
                            </div>
                        )}
                    </div>
                )}

                <div className="pt-preview-hero" style={{ position: "relative" }}>
                    <FreeHero
                        editable
                        hero={theme.hero}
                        name={userData?.name}
                        username={userData?.username}
                        bio={userData?.bio}
                        avatarUrl={userData?.image_url}
                        badge={userData?.badge}
                        followers={followerCount}
                        following={followingCount}
                        showStats={showStats}
                        showBio={showBio}
                        onChange={onHeroChange}
                        selectedEl={selectedHeroEl}
                        onSelectEl={onSelectHeroEl}
                    />
                    {showHeroInlineEditor && (
                        <div className="pt-hero-inline-editor" onClick={(e) => e.stopPropagation()}>
                            <div className="pt-inline-editor-head">
                                <span>
                                    Editing <strong>{HERO_ELEMENT_LABELS[selectedHeroEl] || selectedHeroEl}</strong>
                                </span>
                                <button type="button" onClick={() => onSelectHeroEl(null)}>
                                    Done
                                </button>
                            </div>
                            <HeroElementEditor
                                elementKey={selectedHeroEl}
                                data={theme.hero?.layout?.[selectedHeroEl]}
                                onPatch={onHeroPatchElement}
                            />
                        </div>
                    )}
                </div>

                {/* Layout preview — mirrors the configured block order / width /
                    style. Interactive when edit handlers are supplied. */}
                {layoutBlocks.length > 0 && interactive && (
                    <>
                        <p className="pt-preview-edit-hint" aria-hidden="true">
                            Tap a block to edit · drag the handle to reorder · drag the edge to resize
                        </p>
                        <Reorder.Group
                            axis="y"
                            values={visibleTypes}
                            onReorder={handleReorder}
                            className="pt-preview-layout pt-preview-layout--edit"
                            onClick={(e) => {
                                // Click on empty canvas (not a block) clears selection.
                                if (e.target === e.currentTarget) setSelectedType(null);
                            }}
                        >
                            {layoutBlocks.map((block, index) => (
                                <PreviewLayoutBlock
                                    key={block.type}
                                    block={block}
                                    theme={theme}
                                    index={index}
                                    total={layoutBlocks.length}
                                    selected={selectedType === block.type}
                                    onSelect={setSelectedType}
                                    onEditBlock={onEditBlock}
                                    onPatchBlock={onPatchBlock}
                                    onMoveBlock={onMoveBlock}
                                    onToggleBlock={onToggleBlock}
                                    preview={livePreview}
                                    isPreviewLoading={isPreviewLoading}
                                    guestbook={guestbookEntries}
                                    isGuestbookLoading={isGuestbookLoading}
                                    isOwn
                                    isMobile={isMobile}
                                    onPatchBlockContent={onPatchBlockContent}
                                    onPatchBlockDesign={onPatchBlockDesign}
                                    onResetBlock={onResetBlock}
                                />
                            ))}
                        </Reorder.Group>
                    </>
                )}

                {/* Read-only fallback (no edit handlers): the original grid. */}
                {layoutBlocks.length > 0 && !interactive && (
                    <div className="pt-preview-layout">
                        {layoutBlocks.map((block) => {
                            const cardVars = getBlockCardCssVars(theme, block);
                            const styleCls = cardVars ? "pl-block--inherit" : "pl-block--design";
                            const design = getBlockDesign(block);
                            const designAttrs = getBlockDesignDataAttrs(design);
                            const roStyle = { ...(cardVars || {}), ...getBlockDesignStyle(design) };
                            return (
                            <div
                                key={block.type}
                                className={`pt-preview-block ${blockWidthClass(block.width)} ${styleCls}`}
                                style={Object.keys(roStyle).length ? roStyle : undefined}
                                {...designAttrs}
                            >
                                <span className="pt-preview-block-title">
                                    {block.title || LAYOUT_BLOCK_LABELS[block.type] || block.type}
                                </span>
                                <PreviewBlockBody
                                    type={block.type}
                                    content={getBlockContent(block)}
                                    variant={block.variant}
                                    preview={livePreview}
                                    isPreviewLoading={isPreviewLoading}
                                    guestbook={guestbookEntries}
                                    isGuestbookLoading={isGuestbookLoading}
                                    isOwn
                                />
                            </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuilderPreview;
