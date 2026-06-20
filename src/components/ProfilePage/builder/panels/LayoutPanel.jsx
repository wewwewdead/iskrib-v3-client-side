import { Reorder, useDragControls } from "framer-motion";
import { getOrderedLayoutBlocks } from "../profileThemeUtils";
import {
    LAYOUT_BLOCK_LABELS,
    ALLOWED_LAYOUT_WIDTHS,
    ALLOWED_LAYOUT_STYLES,
    ALLOWED_LAYOUT_VARIANTS_BY_TYPE,
    LAYOUT_WIDTH_LABELS,
    LAYOUT_STYLE_LABELS,
    MAX_LAYOUT_TITLE_LENGTH,
} from "../profileThemeConstants";
import { RENDERABLE_LAYOUT_BLOCK_TYPES } from "../../layout/profileLayoutUtils";

const titleCase = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

/**
 * One draggable block card. Drag is initiated from the handle (pointer) OR via
 * the Up/Down buttons (keyboard accessible). All controls are labelled.
 */
const LayoutBlockCard = ({ block, index, total, onMoveBlock, onToggleBlock, onPatchBlock, onResetBlock }) => {
    const dragControls = useDragControls();
    const label = LAYOUT_BLOCK_LABELS[block.type] || block.type;
    const variants = ALLOWED_LAYOUT_VARIANTS_BY_TYPE[block.type] || [];
    const visible = block.visible !== false;

    return (
        <Reorder.Item
            value={block.type}
            dragListener={false}
            dragControls={dragControls}
            className={`pt-layout-card${visible ? "" : " is-hidden"}`}
        >
            <div className="pt-layout-card-top">
                <button
                    type="button"
                    className="pt-layout-handle"
                    aria-label={`Drag to reorder ${label}`}
                    title="Drag to reorder"
                    onPointerDown={(e) => dragControls.start(e)}
                    style={{ touchAction: "none" }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <circle cx="8" cy="6" r="1.6" />
                        <circle cx="16" cy="6" r="1.6" />
                        <circle cx="8" cy="12" r="1.6" />
                        <circle cx="16" cy="12" r="1.6" />
                        <circle cx="8" cy="18" r="1.6" />
                        <circle cx="16" cy="18" r="1.6" />
                    </svg>
                </button>

                <span className="pt-layout-name">{label}</span>

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
                    <span className="pt-layout-control-label">Title</span>
                    <input
                        type="text"
                        value={block.title}
                        maxLength={MAX_LAYOUT_TITLE_LENGTH}
                        onChange={(e) => onPatchBlock(block.type, { title: e.target.value })}
                    />
                </label>
                <button
                    type="button"
                    className="pt-layout-reset"
                    onClick={() => onResetBlock(block.type)}
                >
                    Reset
                </button>
            </div>
        </Reorder.Item>
    );
};

/**
 * Layout panel — drag/reorder content containers and tune each one's width,
 * container style, variant and title. Hero/Header stays fixed; hero sub-blocks
 * (stats / bio / joined date) live in the Sections tab.
 */
const LayoutPanel = ({ theme, onReorder, onMoveBlock, onToggleBlock, onPatchBlock, onResetBlock }) => {
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
                width, style and look. Your header stays at the top.
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
                        onResetBlock={onResetBlock}
                    />
                ))}
            </Reorder.Group>
        </div>
    );
};

export default LayoutPanel;
