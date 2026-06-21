import { useRef, useState } from "react";
import { Reorder, useDragControls } from "framer-motion";
import formatCounts from "../../../../helpers/fomatCounts";
import VerifiedBadge from "../../Badge/VerifiedBadge";
import {
    FONT_STACK_BY_KEY,
    SCALE_MULTIPLIER_BY_KEY,
    HERO_ELEMENT_LABELS,
    HERO_ELEMENT_WIDTHS,
} from "../builder/profileThemeConstants";
import { getHeroOrder } from "../builder/profileThemeUtils";
import "./freeHero.css";

const SCALE_MIN = 0.5;
const SCALE_MAX = 2.5;

/**
 * One editable hero row. The ⠿ grip drags to REORDER (via dragControls), the
 * corner dot drags to RESIZE (scale, the element's overall size), the right-edge
 * bar drags to set WIDTH (x-axis, snapping full / wide / narrow), and clicking
 * the body selects it. Each needs its own useDragControls, so this is a component
 * (not inlined in a map).
 */
const HeroEditRow = ({
    keyName,
    label,
    className,
    style,
    selected,
    onSelect,
    onResizeStart,
    onResizeMove,
    onResizeEnd,
    onWidthResizeStart,
    onWidthResizeMove,
    onWidthResizeEnd,
    children,
}) => {
    const controls = useDragControls();
    return (
        <Reorder.Item
            as="div"
            value={keyName}
            className={className}
            style={style}
            dragListener={false}
            dragControls={controls}
            // The whole container body is a reorder drag zone: press anywhere to
            // select it AND start a drag. The resize handles stopPropagation on
            // their own pointer-down, so grabbing an edge never starts a reorder.
            onPointerDown={(e) => {
                onSelect(keyName);
                controls.start(e);
            }}
        >
            <span className="pt-freehero-tag" aria-hidden="true">
                ⠿ {label}
            </span>
            {children}
            {selected && (
                <>
                    {/* Right-edge bar → WIDTH (x-axis). Drag in/out to snap the
                        container full / wide / narrow without changing its size. */}
                    <span
                        className="pt-freehero-width-resize"
                        role="button"
                        aria-label={`Resize ${label} width`}
                        title="Drag to resize width"
                        onPointerDown={(e) => onWidthResizeStart(e, keyName)}
                        onPointerMove={onWidthResizeMove}
                        onPointerUp={onWidthResizeEnd}
                        onPointerCancel={onWidthResizeEnd}
                    />
                    {/* Bottom-right dot → SCALE (overall size). */}
                    <span
                        className="pt-freehero-resize"
                        role="button"
                        aria-label={`Resize ${label}`}
                        title="Drag to resize"
                        onPointerDown={(e) => onResizeStart(e, keyName)}
                        onPointerMove={onResizeMove}
                        onPointerUp={onResizeEnd}
                        onPointerCancel={onResizeEnd}
                    />
                </>
            )}
        </Reorder.Item>
    );
};

/**
 * Hero = a fixed vertical STACK of elements (avatar / name / stats / bio). The
 * order is drag-reorderable (editable mode), and each element keeps its isolated
 * style (alignment, card style, color, font, size). There is no free-canvas
 * positioning — elements always snap into the stack.
 */
const FreeHero = ({
    hero,
    name,
    username,
    bio,
    avatarUrl,
    badge,
    streak,
    followers,
    following,
    showStats = true,
    showBio = true,
    editable = false,
    onChange,
    selectedEl: selectedElProp,
    onSelectEl,
}) => {
    // Selection is controlled when the parent supplies onSelectEl (so a side
    // panel can edit the selected element); otherwise it's self-managed.
    const [internalSel, setInternalSel] = useState(null);
    const isControlled = typeof onSelectEl === "function";
    const selectedEl = isControlled ? selectedElProp ?? null : internalSel;
    const selectEl = isControlled ? onSelectEl : setInternalSel;

    const layout = hero?.layout || {};
    const order = getHeroOrder(hero);
    const visible = { avatar: true, name: true, stats: showStats, bio: showBio };
    // Only the kept-visible elements render (both in the builder and live), so the
    // preview matches the saved page. Reordering merges the hidden keys back.
    const keys = order.filter((k) => visible[k]);
    const reorder = (next) => onChange?.({ ...hero, order: [...next, ...order.filter((k) => !visible[k])] });

    // ── Corner-drag resize → per-element `scale` (avatar diameter + text size) ──
    const resizeRef = useRef(null);
    const baseScale = (el) =>
        Number.isFinite(el?.scale) ? el.scale : (el?.size && SCALE_MULTIPLIER_BY_KEY[el.size]) || 1;
    const onResizeStart = (e, key) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        resizeRef.current = { key, pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, base: baseScale(layout[key]) };
        selectEl(key);
    };
    const onResizeMove = (e) => {
        const st = resizeRef.current;
        if (!st) return;
        // Diagonal drag: outward = bigger. ~140px ≈ +1.0 scale.
        const delta = (e.clientX - st.startX + (e.clientY - st.startY)) / 2;
        const next = Math.min(SCALE_MAX, Math.max(SCALE_MIN, st.base + delta / 140));
        onChange?.({
            ...hero,
            layout: { ...layout, [st.key]: { ...(layout[st.key] || {}), scale: Math.round(next * 100) / 100 } },
        });
    };
    const onResizeEnd = (e) => {
        if (resizeRef.current) {
            e.currentTarget.releasePointerCapture?.(resizeRef.current.pointerId);
            resizeRef.current = null;
        }
    };

    // ── Right-edge drag → per-element `width` (x-axis only) ──────────────────
    // Left edge is fixed, so dragging the right edge out/in grows/shrinks the
    // container, snapping to the nearest discrete width (narrow → wide → full).
    const widthResizeRef = useRef(null);
    const widthForPointer = (clientX) => {
        const st = widthResizeRef.current;
        if (!st?.elEl || !st?.containerEl) return null;
        const elLeft = st.elEl.getBoundingClientRect().left;
        const containerWidth = st.containerEl.getBoundingClientRect().width;
        if (containerWidth === 0) return null;
        const fraction = (clientX - elLeft) / containerWidth;
        // Thresholds sit at the midpoints between narrow (46%), wide (70%), full.
        if (fraction >= 0.85) return "full";
        if (fraction >= 0.58) return "wide";
        return "narrow";
    };
    const onWidthResizeStart = (e, key) => {
        e.preventDefault();
        e.stopPropagation();
        const handleEl = e.currentTarget;
        const elEl = handleEl.closest(".pt-freehero-el");
        handleEl.setPointerCapture?.(e.pointerId);
        widthResizeRef.current = {
            key,
            pointerId: e.pointerId,
            elEl,
            containerEl: elEl?.parentElement || null,
        };
        selectEl(key);
    };
    const onWidthResizeMove = (e) => {
        const st = widthResizeRef.current;
        if (!st) return;
        const next = widthForPointer(e.clientX);
        if (!next || !HERO_ELEMENT_WIDTHS.includes(next)) return;
        const current = layout[st.key]?.width || "full";
        if (next === current) return;
        onChange?.({
            ...hero,
            layout: { ...layout, [st.key]: { ...(layout[st.key] || {}), width: next } },
        });
    };
    const onWidthResizeEnd = (e) => {
        if (widthResizeRef.current) {
            e.currentTarget.releasePointerCapture?.(widthResizeRef.current.pointerId);
            widthResizeRef.current = null;
        }
    };

    const elProps = (key) => {
        const el = layout[key] || {};
        const align = el.align || "left";
        const style = el.style || "none";
        const width = el.width || "full";
        const border = el.border || "none";
        const radius = el.radius || "soft";
        const divider = el.divider || "none";
        const fontStack = el.font && FONT_STACK_BY_KEY[el.font];
        // Continuous corner-drag `scale` wins; the Text-size preset is a fallback.
        const scaleVal = baseScale(el);
        // A "card" (padding + surface) is implied by any of: a style preset, a
        // custom background, or a border.
        const carded = style !== "none" || !!el.bgColor || border !== "none";
        const className =
            `pt-freehero-el pt-freehero-el--${key} pt-freehero-el--align-${align}` +
            ` pt-freehero-el--w-${width} pt-freehero-el--radius-${radius}` +
            (style !== "none" ? ` pl-block--${style}` : "") +
            (carded ? " pt-freehero-el--carded" : "") +
            (border !== "none" ? ` pt-freehero-el--border-${border}` : "") +
            (divider !== "none" ? ` pt-freehero-el--divider-${divider}` : "") +
            (fontStack ? " pt-freehero-el--fonted" : "") +
            (scaleVal !== 1 ? " pt-freehero-el--sized" : "") +
            (editable ? " is-editable" : "") +
            (editable && selectedEl === key ? " is-selected" : "");
        const style2 = {
            ...(el.color ? { color: el.color } : {}),
            ...(el.bgColor ? { background: el.bgColor } : {}),
            ...(fontStack ? { "--el-font": fontStack } : {}),
            ...(scaleVal !== 1 ? { "--el-fontscale": scaleVal } : {}),
        };
        return { className, style: style2 };
    };

    const content = (key) => {
        switch (key) {
            case "avatar":
                return (
                    <div
                        className={`profile-avatar-ring pt-freehero-avatar ${
                            badge === "legend" ? "badge-ring-legend" : badge === "og" ? "badge-ring-og" : ""
                        }`}
                    >
                        <img
                            className="my-profile-image"
                            src={avatarUrl || "/assets/profile.jpg"}
                            alt=""
                            draggable={false}
                        />
                    </div>
                );
            case "name":
                return (
                    <div className="pt-freehero-name">
                        <span className="pt-freehero-name-row">
                            <p className="profile-name">{name || "Your name"}</p>
                            <VerifiedBadge badge={badge} size={18} />
                            {badge && (
                                <span
                                    className={`badge-pill ${
                                        badge === "legend" ? "badge-pill-legend" : "badge-pill-og"
                                    }`}
                                >
                                    {badge === "legend" ? "Legend" : "OG"}
                                </span>
                            )}
                            {streak > 0 && <span className="pt-freehero-streak">🔥 {streak}</span>}
                        </span>
                        {username && <p className="profile-user-handle">@{username}</p>}
                    </div>
                );
            case "stats":
                return (
                    <div className="profile-stats-container pt-freehero-stats">
                        <div className="profile-stat-item">
                            <span className="stat-number">{formatCounts(followers)}</span>
                            <span className="stat-label">Followers</span>
                        </div>
                        <div className="profile-stat-item">
                            <span className="stat-number">{formatCounts(following)}</span>
                            <span className="stat-label">Following</span>
                        </div>
                    </div>
                );
            case "bio":
                return <p className="profile-bio pt-freehero-bio">{bio || "Your bio appears here."}</p>;
            default:
                return null;
        }
    };

    // Live (read-only): a plain vertical stack in the saved order.
    if (!editable) {
        return (
            <div className="pt-freehero pt-freehero--stack">
                {keys.map((key) => {
                    const { className, style } = elProps(key);
                    return (
                        <div key={key} className={className} style={style}>
                            {content(key)}
                        </div>
                    );
                })}
            </div>
        );
    }

    // Editable: drag a row up/down to reorder it within the stack.
    return (
        <Reorder.Group
            as="div"
            axis="y"
            values={keys}
            onReorder={reorder}
            className="pt-freehero pt-freehero--stack is-editable"
        >
            {keys.map((key) => {
                const { className, style } = elProps(key);
                return (
                    <HeroEditRow
                        key={key}
                        keyName={key}
                        label={HERO_ELEMENT_LABELS[key]}
                        className={className}
                        style={style}
                        selected={selectedEl === key}
                        onSelect={selectEl}
                        onResizeStart={onResizeStart}
                        onResizeMove={onResizeMove}
                        onResizeEnd={onResizeEnd}
                        onWidthResizeStart={onWidthResizeStart}
                        onWidthResizeMove={onWidthResizeMove}
                        onWidthResizeEnd={onWidthResizeEnd}
                    >
                        {content(key)}
                    </HeroEditRow>
                );
            })}
        </Reorder.Group>
    );
};

export default FreeHero;
