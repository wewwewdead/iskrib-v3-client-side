import { useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import {
    profileThemeToCssVars,
    isSectionVisible,
    getVisibleOrderedLayoutBlocks,
    getOrderedLayoutBlocks,
    getBlockContent,
    getBlockCardCssVars,
    composeProfileBackgroundStyle,
} from "./profileThemeUtils";
import {
    LAYOUT_BLOCK_LABELS,
    CONTENT_SOURCE_LABELS,
    LAYOUT_WIDTH_LABELS,
    LAYOUT_STYLE_LABELS,
    ALLOWED_LAYOUT_STYLES,
} from "./profileThemeConstants";
import { RENDERABLE_LAYOUT_BLOCK_TYPES, blockWidthClass, blockStyleClass } from "../layout/profileLayoutUtils";
import { imageShapeClass, densityClass } from "../layout/previewCards/previewUtils";
import StickerLayer from "./StickerLayer";
import FreeHero from "../layout/FreeHero";
import formatCounts from "../../../../helpers/fomatCounts";

// Widths the preview can cycle through, ordered narrow → wide. Used by both the
// edge-drag resize (snaps to the nearest) and the inline width chips.
const PREVIEW_WIDTHS = ["compact", "half", "full"];
const previewWidthClass = (width) =>
    `pt-pblock--${PREVIEW_WIDTHS.includes(width) ? width : "full"}`;

/**
 * Lightweight placeholder body for a layout block in the live builder preview.
 * Reflects the block's V3C content controls (count / density / image shape /
 * excerpt / meta / source) WITHOUT fetching any real content.
 */
const PreviewBlockBody = ({ type, content }) => {
    const count = Math.min(typeof content.count === "number" ? content.count : 3, 6);
    const shapeCls = imageShapeClass(content.imageShape);
    const densityCls = densityClass(content.density);
    const sourceLabel =
        content.source && content.source !== "latest" ? CONTENT_SOURCE_LABELS[content.source] : null;

    if (type === "media") {
        return (
            <div className={`pt-preview-mini pt-preview-mini--tiles ${densityCls}`}>
                {Array.from({ length: count }).map((_, i) => (
                    <span key={i} className={`pt-preview-tile ${shapeCls}`} />
                ))}
                {sourceLabel && <span className="pt-preview-source">{sourceLabel}</span>}
            </div>
        );
    }

    const showExcerpt = content.showExcerpt !== false && type !== "guestbook" && type !== "media";
    const showMeta = content.showMeta !== false;

    return (
        <div className={`pt-preview-mini pt-preview-mini--rows ${densityCls}`}>
            {Array.from({ length: count }).map((_, i) => (
                <span key={i} className="pt-preview-row">
                    <span className="pt-preview-block-bar" />
                    {showExcerpt && <span className="pt-preview-block-bar pt-preview-block-bar--short" />}
                    {showMeta && <span className="pt-preview-block-bar pt-preview-block-bar--meta" />}
                </span>
            ))}
            {sourceLabel && <span className="pt-preview-source">{sourceLabel}</span>}
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
    onPatchBlock,
    onMoveBlock,
    onToggleBlock,
}) => {
    const dragControls = useDragControls();
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef(null);

    const label = LAYOUT_BLOCK_LABELS[block.type] || block.type;
    const content = getBlockContent(block);
    const cardVars = getBlockCardCssVars(theme, block);
    const styleCls = cardVars ? "pl-block--inherit" : blockStyleClass(block.style);

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
            style={cardVars || undefined}
            className={`pt-pblock ${previewWidthClass(block.width)} ${styleCls}${
                selected ? " is-selected" : ""
            }${isDragging ? " is-dragging" : ""}${isResizing ? " is-resizing" : ""}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(block.type);
            }}
        >
            <div className="pt-pblock__head">
                {/* Whole grip+title is the reorder drag zone. */}
                <span
                    className="pt-pblock__drag"
                    role="button"
                    aria-label={`Drag to reorder ${label}`}
                    title="Drag to reorder"
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        dragControls.start(e);
                    }}
                >
                    <span className="pt-pblock__grip" aria-hidden="true">
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

            <PreviewBlockBody type={block.type} content={content} />

            {selected && (
                <div className="pt-pblock__edit">
                    {/* Per-container controls — these write to THIS block only
                        (onPatchBlock(block.type, …)), so editing one container's
                        width/style never touches the others. The Cards tab still
                        sets the global default for blocks left on "Theme". */}
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
 * Stickers remain editable here too (drag to move, remove).
 */
const BuilderPreview = ({
    theme,
    userData,
    followerCount,
    followingCount,
    onStickersChange,
    onReorderBlocks,
    onPatchBlock,
    onMoveBlock,
    onToggleBlock,
    selectedType: selectedTypeProp,
    onSelectType,
    selectedStickerIndex = -1,
    onSelectSticker,
    onHeroChange,
    selectedHeroEl,
    onSelectHeroEl,
}) => {
    const cssVars = profileThemeToCssVars(theme, userData);
    // The theme's gradient OVERLAYS the legacy image (so opacity < 1 tints rather
    // than hides it); the preview matches the live page.
    const background = composeProfileBackgroundStyle(theme, userData?.background) || null;
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

    // Clicking anywhere on the canvas that ISN'T a sticker deselects it.
    // Stickers stopPropagation on pointer-down, so this only fires off-sticker.
    const handleCanvasPointerDown = () => {
        if (onSelectSticker && selectedStickerIndex >= 0) onSelectSticker(-1);
    };

    return (
        <div className="pt-preview-wrap pt-scope" style={cssVars}>
            <div
                className="pt-preview-surface"
                style={background || undefined}
                onPointerDown={onSelectSticker ? handleCanvasPointerDown : undefined}
            >
                {/* Stickers live INSIDE the hero so their %-coordinates map to the
                    exact same box the live profile hero uses — drag here, save,
                    and they land in the same place on the page. */}
                <div className="pt-preview-hero" style={{ position: "relative" }}>
                    <StickerLayer
                        stickers={theme.stickers}
                        editable
                        onChange={onStickersChange}
                        accentColor={theme.colors.accent}
                        selectedIndex={selectedStickerIndex}
                        onSelectSticker={onSelectSticker}
                    />
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
                                    onPatchBlock={onPatchBlock}
                                    onMoveBlock={onMoveBlock}
                                    onToggleBlock={onToggleBlock}
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
                            const styleCls = cardVars ? "pl-block--inherit" : blockStyleClass(block.style);
                            return (
                            <div
                                key={block.type}
                                className={`pt-preview-block ${blockWidthClass(block.width)} ${styleCls}`}
                                style={cardVars || undefined}
                            >
                                <span className="pt-preview-block-title">
                                    {block.title || LAYOUT_BLOCK_LABELS[block.type] || block.type}
                                </span>
                                <PreviewBlockBody type={block.type} content={getBlockContent(block)} />
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
