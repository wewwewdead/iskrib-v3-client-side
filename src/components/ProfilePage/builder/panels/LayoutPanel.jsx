import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { getOrderedLayoutBlocks, getBlockContent } from "../profileThemeUtils";
import {
    LAYOUT_BLOCK_LABELS,
    ALLOWED_LAYOUT_WIDTHS,
    ALLOWED_LAYOUT_STYLES,
    ALLOWED_LAYOUT_VARIANTS_BY_TYPE,
    LAYOUT_WIDTH_LABELS,
    LAYOUT_STYLE_LABELS,
    MAX_LAYOUT_TITLE_LENGTH,
    ALLOWED_BLOCK_CONTENT_BY_TYPE,
    CONTENT_SOURCE_LABELS,
    CONTENT_DENSITY_LABELS,
    CONTENT_IMAGE_SHAPE_LABELS,
    CONTENT_BOOLEAN_LABELS,
} from "../profileThemeConstants";
import { RENDERABLE_LAYOUT_BLOCK_TYPES } from "../../layout/profileLayoutUtils";

const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * A labelled segmented control: a small row of mutually-exclusive option chips.
 * Used for the per-block content controls (count / source / density / shape).
 */
const Segmented = ({ label, value, options, labels, onChange }) => (
    <div className="pt-content-control">
        <span className="pt-layout-control-label">{label}</span>
        <div className="pt-seg" role="group" aria-label={label}>
            {options.map((opt) => {
                const active = String(value) === String(opt);
                return (
                    <button
                        key={opt}
                        type="button"
                        className={`pt-seg-btn${active ? " is-active" : ""}`}
                        aria-pressed={active}
                        onClick={() => onChange(opt)}
                    >
                        {labels ? labels[opt] ?? opt : opt}
                    </button>
                );
            })}
        </div>
    </div>
);

/**
 * The expandable "Content" controls for a single block. Only rendered for block
 * types that carry content controls. Controls are presentation-only; they map to
 * the block's `content` config (count / source / density / imageShape / meta /
 * excerpt). All values are whitelisted enums — no free text.
 */
const BlockContentControls = ({ block, spec, onPatchContent }) => {
    const content = getBlockContent(block);
    const patch = (partial) => onPatchContent(block.type, partial);

    return (
        <div className="pt-content-controls">
            {spec.count && (
                <Segmented
                    label="Count"
                    value={content.count}
                    options={spec.count}
                    onChange={(v) => patch({ count: Number(v) })}
                />
            )}
            {spec.source && spec.source.length > 1 && (
                <Segmented
                    label="Source"
                    value={content.source}
                    options={spec.source}
                    labels={CONTENT_SOURCE_LABELS}
                    onChange={(v) => patch({ source: v })}
                />
            )}
            {spec.density && (
                <Segmented
                    label="Density"
                    value={content.density}
                    options={spec.density}
                    labels={CONTENT_DENSITY_LABELS}
                    onChange={(v) => patch({ density: v })}
                />
            )}
            {spec.imageShape && (
                <Segmented
                    label="Image shape"
                    value={content.imageShape}
                    options={spec.imageShape}
                    labels={CONTENT_IMAGE_SHAPE_LABELS}
                    onChange={(v) => patch({ imageShape: v })}
                />
            )}
            {(spec.booleans || []).length > 0 && (
                <div className="pt-content-toggles">
                    {spec.booleans.map((key) => {
                        const on = content[key] !== false;
                        return (
                            <button
                                key={key}
                                type="button"
                                role="switch"
                                aria-checked={on}
                                className={`pt-content-toggle${on ? " is-on" : ""}`}
                                onClick={() => patch({ [key]: !on })}
                            >
                                <span className={`pt-toggle pt-toggle--sm${on ? " is-on" : ""}`}>
                                    <span className="pt-toggle-knob" />
                                </span>
                                <span className="pt-content-toggle-label">
                                    {CONTENT_BOOLEAN_LABELS[key] || key}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/**
 * One draggable block card. Drag is initiated from the handle (pointer) OR via
 * the Up/Down buttons (keyboard accessible). All controls are labelled. Content
 * controls live in a per-card disclosure so cards stay short by default.
 */
const LayoutBlockCard = ({
    block,
    index,
    total,
    onMoveBlock,
    onToggleBlock,
    onPatchBlock,
    onPatchBlockContent,
    onResetBlock,
}) => {
    const dragControls = useDragControls();
    const label = LAYOUT_BLOCK_LABELS[block.type] || block.type;
    const variants = ALLOWED_LAYOUT_VARIANTS_BY_TYPE[block.type] || [];
    const visible = block.visible !== false;
    const contentSpec = ALLOWED_BLOCK_CONTENT_BY_TYPE[block.type];

    const [showContent, setShowContent] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [confirmReset, setConfirmReset] = useState(false);

    return (
        <Reorder.Item
            value={block.type}
            dragListener={false}
            dragControls={dragControls}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            className={`pt-layout-card${visible ? "" : " is-hidden"}${isDragging ? " is-dragging" : ""}`}
        >
            <div className="pt-layout-card-top">
                {/* The whole grip+name header is the drag zone, so users can grab
                    the block by its header — not just a tiny icon. The action
                    controls (move/visibility) sit OUTSIDE this zone so tapping
                    them never starts a drag. Keyboard users reorder via ↑ ↓. */}
                <div
                    className="pt-layout-drag-zone"
                    role="button"
                    aria-label={`Drag to reorder ${label}`}
                    title="Drag to reorder"
                    onPointerDown={(e) => dragControls.start(e)}
                >
                    <span className="pt-layout-handle" aria-hidden="true">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <circle cx="8" cy="6" r="1.6" />
                            <circle cx="16" cy="6" r="1.6" />
                            <circle cx="8" cy="12" r="1.6" />
                            <circle cx="16" cy="12" r="1.6" />
                            <circle cx="8" cy="18" r="1.6" />
                            <circle cx="16" cy="18" r="1.6" />
                        </svg>
                    </span>

                    <span className="pt-layout-name">{label}</span>
                </div>

                <div className="pt-layout-top-actions">
                    <button
                        type="button"
                        className="pt-layout-move"
                        aria-label={`Move ${label} up`}
                        disabled={index === 0}
                        onClick={() => onMoveBlock(block.type, "up")}
                    >
                        ↑
                    </button>
                    <button
                        type="button"
                        className="pt-layout-move"
                        aria-label={`Move ${label} down`}
                        disabled={index === total - 1}
                        onClick={() => onMoveBlock(block.type, "down")}
                    >
                        ↓
                    </button>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={visible}
                        aria-label={`${visible ? "Hide" : "Show"} ${label}`}
                        className={`pt-toggle pt-toggle--sm${visible ? " is-on" : ""}`}
                        onClick={() => onToggleBlock(block.type)}
                    >
                        <span className="pt-toggle-knob" />
                    </button>
                </div>
            </div>

            <span className="pt-layout-state" aria-hidden="true">
                {visible ? "Shown" : "Hidden"}
            </span>

            <div className="pt-layout-controls">
                <label className="pt-layout-control">
                    <span className="pt-layout-control-label">Width</span>
                    <select
                        value={block.width}
                        onChange={(e) => onPatchBlock(block.type, { width: e.target.value })}
                    >
                        {ALLOWED_LAYOUT_WIDTHS.map((w) => (
                            <option key={w} value={w}>
                                {LAYOUT_WIDTH_LABELS[w] || w}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="pt-layout-control">
                    <span className="pt-layout-control-label">Style</span>
                    <select
                        value={block.style}
                        onChange={(e) => onPatchBlock(block.type, { style: e.target.value })}
                    >
                        {ALLOWED_LAYOUT_STYLES.map((s) => (
                            <option key={s} value={s}>
                                {LAYOUT_STYLE_LABELS[s] || s}
                            </option>
                        ))}
                    </select>
                </label>

                {variants.length > 1 && (
                    <label className="pt-layout-control">
                        <span className="pt-layout-control-label">Variant</span>
                        <select
                            value={block.variant}
                            onChange={(e) => onPatchBlock(block.type, { variant: e.target.value })}
                        >
                            {variants.map((v) => (
                                <option key={v} value={v}>
                                    {titleCase(v)}
                                </option>
                            ))}
                        </select>
                    </label>
                )}
            </div>

            <div className="pt-layout-title-row">
                <label className="pt-layout-control pt-layout-title-field">
                    <span className="pt-layout-control-label">
                        Title
                        <span className="pt-layout-title-count" aria-hidden="true">
                            {(block.title || "").length}/{MAX_LAYOUT_TITLE_LENGTH}
                        </span>
                    </span>
                    <input
                        type="text"
                        value={block.title}
                        maxLength={MAX_LAYOUT_TITLE_LENGTH}
                        onChange={(e) => onPatchBlock(block.type, { title: e.target.value })}
                    />
                </label>
                {confirmReset ? (
                    <span className="pt-layout-reset-confirm" role="group" aria-label={`Reset ${label}?`}>
                        <button
                            type="button"
                            className="pt-layout-reset is-confirm"
                            onClick={() => {
                                onResetBlock(block.type);
                                setConfirmReset(false);
                            }}
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            className="pt-layout-reset-cancel"
                            onClick={() => setConfirmReset(false)}
                        >
                            Cancel
                        </button>
                    </span>
                ) : (
                    <button
                        type="button"
                        className="pt-layout-reset"
                        aria-label={`Reset ${label} to defaults`}
                        onClick={() => setConfirmReset(true)}
                    >
                        Reset
                    </button>
                )}
            </div>

            {contentSpec && (
                <div className="pt-content-disclosure">
                    <button
                        type="button"
                        className="pt-content-toggle-btn"
                        aria-expanded={showContent}
                        onClick={() => setShowContent((v) => !v)}
                    >
                        <span className={`pt-content-chevron${showContent ? " is-open" : ""}`} aria-hidden="true">
                            ▸
                        </span>
                        Content
                        {!showContent && (
                            <span className="pt-content-summary">
                                {getBlockContent(block).count} shown — tap to tune
                            </span>
                        )}
                    </button>
                    {showContent && (
                        <BlockContentControls
                            block={block}
                            spec={contentSpec}
                            onPatchContent={onPatchBlockContent}
                        />
                    )}
                </div>
            )}
        </Reorder.Item>
    );
};

/**
 * Layout panel — drag/reorder content containers and tune each one's width,
 * container style, variant, title and content controls. Hero/Header stays fixed;
 * hero sub-blocks (stats / bio / joined date) live in the Sections tab.
 */
const LayoutPanel = ({
    theme,
    onReorder,
    onMoveBlock,
    onToggleBlock,
    onPatchBlock,
    onPatchBlockContent,
    onResetBlock,
}) => {
    const blocks = getOrderedLayoutBlocks(theme).filter((b) =>
        RENDERABLE_LAYOUT_BLOCK_TYPES.includes(b.type)
    );
    const typeOrder = blocks.map((b) => b.type);

    // Reorder.Group works on stable primitive values (the block types). Map the
    // reordered types back to their block objects before handing off to the parent.
    const handleReorder = (nextTypes) => {
        const byType = new Map(blocks.map((b) => [b.type, b]));
        onReorder(nextTypes.map((t) => byType.get(t)).filter(Boolean));
    };

    return (
        <div className="pt-panel">
            <p className="pt-panel-hint">
                Drag the handle (or use ↑ ↓) to arrange your profile. Tune each container's
                width, style, look and content. Your header stays at the top.
            </p>

            <Reorder.Group axis="y" values={typeOrder} onReorder={handleReorder} className="pt-layout-list">
                {blocks.map((block, index) => (
                    <LayoutBlockCard
                        key={block.type}
                        block={block}
                        index={index}
                        total={blocks.length}
                        onMoveBlock={onMoveBlock}
                        onToggleBlock={onToggleBlock}
                        onPatchBlock={onPatchBlock}
                        onPatchBlockContent={onPatchBlockContent}
                        onResetBlock={onResetBlock}
                    />
                ))}
            </Reorder.Group>
        </div>
    );
};

export default LayoutPanel;
