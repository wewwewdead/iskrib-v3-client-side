import { useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import { getOrderedLayoutBlocks } from "../profileThemeUtils";
import { LAYOUT_BLOCK_LABELS } from "../profileThemeConstants";
import { RENDERABLE_LAYOUT_BLOCK_TYPES } from "../../layout/profileLayoutUtils";
import { BlockStudioControls } from "./blockStudioControls";

/**
 * One draggable block card. Drag is initiated from the handle (pointer) OR via
 * the Up/Down buttons (keyboard accessible). All controls are labelled. The
 * per-container body (width/style/variant/title/content/design) is the shared
 * BlockStudioControls — the same editor the mobile in-canvas container uses.
 */
const LayoutBlockCard = ({
    block,
    index,
    total,
    onMoveBlock,
    onToggleBlock,
    onPatchBlock,
    onPatchBlockContent,
    onPatchBlockDesign,
    onResetBlock,
}) => {
    const dragControls = useDragControls();
    const label = LAYOUT_BLOCK_LABELS[block.type] || block.type;
    const visible = block.visible !== false;
    const [isDragging, setIsDragging] = useState(false);

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

            <BlockStudioControls
                block={block}
                label={label}
                onPatchBlock={onPatchBlock}
                onPatchBlockContent={onPatchBlockContent}
                onPatchBlockDesign={onPatchBlockDesign}
                onResetBlock={onResetBlock}
            />
        </Reorder.Item>
    );
};

/**
 * Layout panel — drag/reorder content containers and tune each one's width,
 * container style, variant, title, content and design. Hero/Header stays fixed;
 * hero sub-blocks (stats / bio / joined date) live in the Sections tab.
 */
const LayoutPanel = ({
    theme,
    onReorder,
    onMoveBlock,
    onToggleBlock,
    onPatchBlock,
    onPatchBlockContent,
    onPatchBlockDesign,
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
                Arrange your room: drag the handle (or use ↑ ↓) to reorder containers, then open
                <strong> Content</strong> and <strong>Design</strong> on any container to tune what it shows and
                how it looks. Your header stays at the top.
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
                        onPatchBlockDesign={onPatchBlockDesign}
                        onResetBlock={onResetBlock}
                    />
                ))}
            </Reorder.Group>
        </div>
    );
};

export default LayoutPanel;
