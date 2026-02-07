import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./myprofile.css";
import { useAuth } from "../../Context/useAuth";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../SideBar/Sidebar";
import { BarLoader } from "react-spinners";
import { saveProfileNoteImage, deleteProfileNoteImage, updateFontColor, updateProfileData } from "../../../API/Api";
import { AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import Editor from "../HomePage/Editor/Editor";
import getCroppedImage from "../../utils/getCroppedImage";
import extractDominantColors from "../../utils/extractDominantColors";
import MobileNavlink from "../mobileNavLink/MobileNavLink";
import MobileSidebarLink from "../MobileSidebarLink/MobileSidebarLink";
import WriteJournalButton from "../WriteJournalButton/WriteJournalButton";
import Loader from "../loadingComponent/BgLoader";
import ProfileBackgroundPicker from "./components/ProfileBackgroundPicker";
import ProfileEditModal from "./components/ProfileEditModal";
import ProfileFontColorSelector from "./components/ProfileFontColorSelector";
import ProfileHeroSection from "./components/ProfileHeroSection";
import ProfileLayoutCanvas from "./components/ProfileLayoutCanvas";
import ProfileTabList from "./components/ProfileTabList";
import {
    PROFILE_HERO_SECTION_IDS,
    PROFILE_SECTION_GRID_SIZE,
    PROFILE_SECTION_SIZES,
    PROFILE_WIDGET_GRID_SIZE,
    getDefaultSectionPosition,
    isPhotoNoteType,
} from "../../utils/profileLayout/constants";
import {
    estimateSectionHeight,
    estimateWidgetHeight,
} from "../../utils/profileLayout/layoutEstimators";
import { normalizeProfileLayout } from "../../utils/profileLayout/normalizeProfileLayout";
import { createDefaultBlock, createDefaultWidget } from "../../utils/profileLayout/widgetFactories";
import { PROFILE_GRADIENTS } from "./constants/profileGradients";
import { createProfileSidebarLinks } from "./constants/profileSidebarLinks";
import { PROFILE_TABS } from "./constants/profileTabs";

const DRAG_MOVE_LISTENER_OPTIONS = {passive: false};
const MOBILE_LAYOUT_BREAKPOINT = 768;
const MOBILE_LAYOUT_GUTTER = 12;
const MOBILE_WIDGET_STACK_GAP = 10;
const MOBILE_WIDGET_MIN_COLUMN_WIDTH = 280;
const MOBILE_WIDGET_MAX_COLUMNS = 2;
const FLOATING_WIDGET_COLLISION_GAP = 8;
const FLOATING_WIDGET_COLLISION_GUARD = 640;

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

const compareByCanvasPosition = (a, b) => {
    const yA = Number.isFinite(a?.y) ? a.y : 0;
    const yB = Number.isFinite(b?.y) ? b.y : 0;
    if(yA !== yB){
        return yA - yB;
    }
    const xA = Number.isFinite(a?.x) ? a.x : 0;
    const xB = Number.isFinite(b?.x) ? b.x : 0;
    if(xA !== xB){
        return xA - xB;
    }
    return String(a?.id || '').localeCompare(String(b?.id || ''));
};

const resolveSectionCardWidthBySize = (size) => {
    if(size === 'lg'){
        return 540;
    }
    if(size === 'sm'){
        return 280;
    }
    return 400;
};

const resolveWidgetCardWidthBySize = (size) => {
    if(size === 'lg'){
        return 520;
    }
    if(size === 'sm'){
        return 250;
    }
    return 320;
};

const resolveWidgetWidthForCanvas = (widget) => (
    Number.isFinite(widget?.width)
        ? widget.width
        : resolveWidgetCardWidthBySize(widget?.size)
);

const resolveMobileWidgetColumns = (canvasWidth) => {
    if(!Number.isFinite(canvasWidth) || canvasWidth <= 0){
        return 1;
    }
    const estimatedColumns = Math.floor(
        (canvasWidth + MOBILE_WIDGET_STACK_GAP)
        / (MOBILE_WIDGET_MIN_COLUMN_WIDTH + MOBILE_WIDGET_STACK_GAP)
    );
    return Math.max(1, Math.min(MOBILE_WIDGET_MAX_COLUMNS, estimatedColumns));
};

const resolveMobileWidgetSpan = (widget, columnWidth, columns) => {
    if(columns <= 1){
        return 1;
    }
    if(widget?.size === 'lg'){
        return Math.min(columns, 2);
    }
    return 1;
};

const packFloatingWidgetsForMobileGrid = (widgets, options = {}) => {
    const {
        movingWidgetId = null,
        canvasWidth = null,
        dragPoint = null,
    } = options;
    if(!Array.isArray(widgets) || widgets.length === 0){
        return [];
    }

    const normalizedCanvasWidth = Number.isFinite(canvasWidth) && canvasWidth > 0
        ? canvasWidth
        : 320;
    const columns = resolveMobileWidgetColumns(normalizedCanvasWidth);
    const totalGapsWidth = (columns - 1) * MOBILE_WIDGET_STACK_GAP;
    const columnWidth = Math.max(
        180,
        Math.floor((normalizedCanvasWidth - totalGapsWidth) / columns)
    );
    const columnStep = columnWidth + MOBILE_WIDGET_STACK_GAP;
    const rowStep = PROFILE_WIDGET_GRID_SIZE;

    const getCellKey = (columnIndex, rowIndex) => `${columnIndex}-${rowIndex}`;
    const occupiedCells = new Set();

    const markCells = (columnStart, rowStart, colSpan, rowSpan) => {
        for(let columnIndex = columnStart; columnIndex < (columnStart + colSpan); columnIndex += 1){
            for(let rowIndex = rowStart; rowIndex < (rowStart + rowSpan); rowIndex += 1){
                occupiedCells.add(getCellKey(columnIndex, rowIndex));
            }
        }
    };

    const canPlace = (columnStart, rowStart, colSpan, rowSpan) => {
        if(columnStart < 0 || rowStart < 0){
            return false;
        }
        if((columnStart + colSpan) > columns){
            return false;
        }

        for(let columnIndex = columnStart; columnIndex < (columnStart + colSpan); columnIndex += 1){
            for(let rowIndex = rowStart; rowIndex < (rowStart + rowSpan); rowIndex += 1){
                if(occupiedCells.has(getCellKey(columnIndex, rowIndex))){
                    return false;
                }
            }
        }
        return true;
    };

    const getColumnPreference = (targetColumn, colSpan) => {
        const maxStartColumn = Math.max(0, columns - colSpan);
        const clampedTargetColumn = Math.round(clampValue(targetColumn, 0, maxStartColumn));
        const candidates = [];
        for(let columnIndex = 0; columnIndex <= maxStartColumn; columnIndex += 1){
            candidates.push(columnIndex);
        }
        return candidates.sort((a, b) => (Math.abs(a - clampedTargetColumn) - Math.abs(b - clampedTargetColumn)));
    };

    const findFreeSlot = (targetColumn, targetRow, colSpan, rowSpan) => {
        const preferredColumns = getColumnPreference(targetColumn, colSpan);
        let rowCursor = Math.max(0, targetRow);

        for(let guard = 0; guard < 2400; guard += 1){
            for(const columnCandidate of preferredColumns){
                if(canPlace(columnCandidate, rowCursor, colSpan, rowSpan)){
                    return {column: columnCandidate, row: rowCursor};
                }
            }
            rowCursor += 1;
        }

        return {column: preferredColumns[0] || 0, row: Math.max(0, targetRow)};
    };

    const deriveGridPlacementTarget = (widget, colSpan) => {
        const maxStartColumn = Math.max(0, columns - colSpan);
        if(
            movingWidgetId
            && widget.id === movingWidgetId
            && Number.isFinite(dragPoint?.x)
            && Number.isFinite(dragPoint?.y)
        ){
            const dragColumn = Math.round(dragPoint.x / columnStep);
            const dragRow = Math.round(dragPoint.y / rowStep);
            return {
                targetColumn: Math.round(clampValue(dragColumn, 0, maxStartColumn)),
                targetRow: Math.max(0, dragRow)
            };
        }

        const baseX = Number.isFinite(widget?.x) ? widget.x : 0;
        const baseY = Number.isFinite(widget?.y) ? widget.y : 0;
        return {
            targetColumn: Math.round(clampValue(Math.round(baseX / columnStep), 0, maxStartColumn)),
            targetRow: Math.max(0, Math.round(baseY / rowStep))
        };
    };

    const resolveWidgetPlacementMetrics = (widget) => {
        const colSpan = resolveMobileWidgetSpan(widget, columnWidth, columns);
        const resolvedWidth = Math.round((colSpan * columnWidth) + ((colSpan - 1) * MOBILE_WIDGET_STACK_GAP));
        const widgetForHeight = {...widget, width: resolvedWidth};
        const rowSpan = Math.max(
            1,
            Math.ceil((estimateWidgetHeight(widgetForHeight) + MOBILE_WIDGET_STACK_GAP) / rowStep)
        );
        return {
            colSpan,
            rowSpan,
            resolvedWidth
        };
    };

    const sortedWidgets = [...widgets].sort(compareByCanvasPosition);
    const movingWidget = movingWidgetId
        ? sortedWidgets.find((widget) => widget.id === movingWidgetId)
        : null;
    const otherWidgets = sortedWidgets.filter((widget) => widget.id !== movingWidgetId);
    const placementOrder = movingWidget ? [movingWidget, ...otherWidgets] : otherWidgets;

    const placedWidgets = [];
    placementOrder.forEach((widget) => {
        const {colSpan, rowSpan, resolvedWidth} = resolveWidgetPlacementMetrics(widget);
        const {targetColumn, targetRow} = deriveGridPlacementTarget(widget, colSpan);
        const {column, row} = findFreeSlot(targetColumn, targetRow, colSpan, rowSpan);
        markCells(column, row, colSpan, rowSpan);
        placedWidgets.push({
            ...widget,
            x: Math.round(column * columnStep),
            y: Math.round(row * rowStep),
            width: resolvedWidth
        });
    });

    const placedWidgetMap = new Map(placedWidgets.map((widget) => [widget.id, widget]));
    return widgets.map((widget) => placedWidgetMap.get(widget.id) || widget);
};

const resolveWidgetHeightForCanvas = (widget) => (
    Number.isFinite(widget?.height)
        ? widget.height
        : estimateWidgetHeight(widget)
);

const doWidgetRectsOverlap = (rectA, rectB, gap = 0) => (
    rectA.x < (rectB.x + rectB.width + gap)
    && (rectA.x + rectA.width + gap) > rectB.x
    && rectA.y < (rectB.y + rectB.height + gap)
    && (rectA.y + rectA.height + gap) > rectB.y
);

const resolveFloatingWidgetPlacement = (widgets, options = {}) => {
    const {
        movingWidgetId,
        nextX = 0,
        nextY = 0,
        nextWidth = null,
        nextHeight = null,
        canvasWidth = null,
        collisionBehavior = 'push',
        fallbackX = null,
        fallbackY = null,
    } = options;
    const allWidgets = Array.isArray(widgets) ? widgets : [];
    const movingWidget = allWidgets.find((widget) => widget.id === movingWidgetId);
    if(!movingWidget){
        return {
            x: Math.max(0, Math.round(nextX)),
            y: Math.max(0, Math.round(nextY))
        };
    }

    const resolvedWidth = Math.max(
        180,
        Math.round(
            Number.isFinite(nextWidth)
                ? nextWidth
                : resolveWidgetWidthForCanvas(movingWidget)
        )
    );
    const resolvedHeight = Math.max(
        96,
        Math.round(
            Number.isFinite(nextHeight)
                ? nextHeight
                : resolveWidgetHeightForCanvas(movingWidget)
        )
    );

    const hasCanvasWidth = Number.isFinite(canvasWidth) && canvasWidth > 0;
    const maxX = hasCanvasWidth
        ? Math.max(0, Math.round(canvasWidth - resolvedWidth - 4))
        : null;

    let candidateX = Math.max(0, Math.round(nextX));
    if(hasCanvasWidth){
        candidateX = Math.round(clampValue(candidateX, 0, maxX));
    }

    let candidateY = Math.max(0, Math.round(Math.max(0, nextY)));

    const staticRects = allWidgets
        .filter((widget) => !widget?.pinned_section && widget.id !== movingWidgetId)
        .map((widget) => ({
            id: widget.id,
            x: Math.max(0, Math.round(Number.isFinite(widget?.x) ? widget.x : 0)),
            y: Math.max(0, Math.round(Number.isFinite(widget?.y) ? widget.y : 0)),
            width: Math.max(180, Math.round(resolveWidgetWidthForCanvas(widget))),
            height: Math.max(96, Math.round(resolveWidgetHeightForCanvas(widget)))
        }))
        .sort(compareByCanvasPosition);

    const movingRect = {
        x: candidateX,
        y: candidateY,
        width: resolvedWidth,
        height: resolvedHeight
    };

    if(collisionBehavior === 'block'){
        const hasCollision = staticRects.some((rect) => (
            doWidgetRectsOverlap(movingRect, rect, FLOATING_WIDGET_COLLISION_GAP)
        ));
        if(hasCollision){
            let resolvedFallbackX = Math.max(
                0,
                Math.round(Number.isFinite(fallbackX) ? fallbackX : movingRect.x)
            );
            if(hasCanvasWidth){
                resolvedFallbackX = Math.round(clampValue(resolvedFallbackX, 0, maxX));
            }
            const resolvedFallbackY = Math.max(
                0,
                Math.round(Number.isFinite(fallbackY) ? fallbackY : movingRect.y)
            );
            return {
                x: resolvedFallbackX,
                y: resolvedFallbackY
            };
        }
        return {
            x: movingRect.x,
            y: movingRect.y
        };
    }

    for(let guard = 0; guard < FLOATING_WIDGET_COLLISION_GUARD; guard += 1){
        const collisionRect = staticRects.find((rect) => (
            doWidgetRectsOverlap(movingRect, rect, FLOATING_WIDGET_COLLISION_GAP)
        ));
        if(!collisionRect){
            break;
        }

        const pushedY = Math.round(
            collisionRect.y + collisionRect.height + FLOATING_WIDGET_COLLISION_GAP
        );
        movingRect.y = pushedY > movingRect.y
            ? pushedY
            : (movingRect.y + 1);
    }

    return {
        x: movingRect.x,
        y: movingRect.y
    };
};

const resolveAllFloatingWidgetOverlaps = (widgets, canvasWidth, options = {}) => {
    const {priorityWidgetId = null} = options;
    let resolvedWidgets = [...widgets];
    const sortedFloatingWidgets = resolvedWidgets
        .filter((w) => !w.pinned_section)
        .sort(compareByCanvasPosition);
    const priorityWidget = priorityWidgetId
        ? sortedFloatingWidgets.find((widget) => widget.id === priorityWidgetId)
        : null;
    const floatingWidgets = priorityWidget
        ? [priorityWidget, ...sortedFloatingWidgets.filter((widget) => widget.id !== priorityWidgetId)]
        : sortedFloatingWidgets;

    for(const widget of floatingWidgets){
        const placement = resolveFloatingWidgetPlacement(resolvedWidgets, {
            movingWidgetId: widget.id,
            nextX: Number.isFinite(widget?.x) ? widget.x : 0,
            nextY: Number.isFinite(widget?.y) ? widget.y : 0,
            nextWidth: resolveWidgetWidthForCanvas(widget),
            nextHeight: resolveWidgetHeightForCanvas(widget),
            canvasWidth
        });
        resolvedWidgets = resolvedWidgets.map((w) =>
            w.id === widget.id ? {...w, x: placement.x, y: placement.y} : w
        );
    }
    return resolvedWidgets;
};

const getClientPointFromInput = (event) => {
    if(typeof event?.clientX === 'number' && typeof event?.clientY === 'number'){
        return {
            clientX: event.clientX,
            clientY: event.clientY
        };
    }
    const touch = event?.touches?.[0] || event?.changedTouches?.[0];
    if(!touch){
        return null;
    }
    return {
        clientX: touch.clientX,
        clientY: touch.clientY
    };
};

const preventDefaultIfCancelable = (event) => {
    if(event?.cancelable){
        event.preventDefault();
    }
};

const bindGlobalDragListeners = (onMove, onEnd) => {
    if(typeof window === 'undefined'){
        return () => {};
    }

    if('PointerEvent' in window){
        window.addEventListener('pointermove', onMove, DRAG_MOVE_LISTENER_OPTIONS);
        window.addEventListener('pointerup', onEnd);
        window.addEventListener('pointercancel', onEnd);

        return () => {
            window.removeEventListener('pointermove', onMove, DRAG_MOVE_LISTENER_OPTIONS);
            window.removeEventListener('pointerup', onEnd);
            window.removeEventListener('pointercancel', onEnd);
        };
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchmove', onMove, DRAG_MOVE_LISTENER_OPTIONS);
    window.addEventListener('touchend', onEnd);
    window.addEventListener('touchcancel', onEnd);

    return () => {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onEnd);
        window.removeEventListener('touchmove', onMove, DRAG_MOVE_LISTENER_OPTIONS);
        window.removeEventListener('touchend', onEnd);
        window.removeEventListener('touchcancel', onEnd);
    };
};

const MyProfile = () => {
    const {user, session, isLoading, notifCount, loading} = useAuth();

    const userData = user?.userData?.[0]

    const [showMobileSideBar, setShowMobileSideBar] = useState(false);
    
    const [showProfileEditor, setShowProfileEditor] = useState(false)
    const [editImagePreview, setEditImagePreview] = useState('')
    const [profileEditAvatar, setProfileEditAvatar] = useState(null)
    const [profileEditName, setProfileEditName] = useState('')
    const [profileEditBio, setProfileEditBio] = useState('')

    const [showEditor, setShowEditor] = useState(false);
    const [showBgPicker, setShowBgPicker] = useState(false);

    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({x: 0, y: 0});
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCropAreaPixels] = useState(null)
    const [gradientPicked, setGradientPicked] = useState(null);
    const [croppedImage, setCroppedImage] = useState({});

    const [showFontColorSelector, setShowFontColorSelector] = useState(false);
    const [fontColor, setFontColor] = useState('')

    const inputRef = useRef();
    const bgInputRef = useRef();
    const fontColorInputRef = useRef();
    const widgetImageInputRefs = useRef({});
    const sectionCanvasRef = useRef(null);
    const sectionResizeRafRef = useRef(null);
    const widgetResizeRafRef = useRef(null);
    const sectionHeightResizeRafRef = useRef(null);
    const widgetHeightResizeRafRef = useRef(null);
    const autoSaveTimerRef = useRef(null);
    const autoSaveRef = useRef(null);

    //for gradient effect based on the bg background
    const [dominantColors, setDominantColors] = useState('#ffffffff');
    const [secondaryColors, setSecondaryColors] = useState('#ffffffff')

    const [isUpdatingFont, setIsUpdatingFont] = useState(false);
    const [isUpdatingProfileConfig, setIsUpdatingProfileConfig] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [showLayoutBuilder, setShowLayoutBuilder] = useState(false);
    const [profileLayoutDraft, setProfileLayoutDraft] = useState(() => normalizeProfileLayout());
    const [layoutViewportWidth, setLayoutViewportWidth] = useState(0);
    const [isSavingLayout, setIsSavingLayout] = useState(false);
    const [draggingSectionId, setDraggingSectionId] = useState(null);
    const [draggingWidgetId, setDraggingWidgetId] = useState(null);
    const [widgetUploadingState, setWidgetUploadingState] = useState({});
    const [sectionResizeState, setSectionResizeState] = useState(null);
    const [widgetResizeState, setWidgetResizeState] = useState(null);
    const [widgetMoveState, setWidgetMoveState] = useState(null);
    const [sectionMoveState, setSectionMoveState] = useState(null);
    const [sectionHeightResizeState, setSectionHeightResizeState] = useState(null);
    const [widgetHeightResizeState, setWidgetHeightResizeState] = useState(null);
    const [sectionDropTarget, setSectionDropTarget] = useState(null);
    const [editingWidgetId, setEditingWidgetId] = useState(null);
    const editingWidgetSnapshotRef = useRef(null);
    const mobileLayoutScaleRef = useRef(1);
    const [activeSectionId, setActiveSectionId] = useState(null);
    const [activeWidgetId, setActiveWidgetId] = useState(null);
    const [widgetImageResizeState, setWidgetImageResizeState] = useState(null);
    const widgetImageResizeRafRef = useRef(null);
    const [blockImageResizeState, setBlockImageResizeState] = useState(null);
    const blockImageResizeRafRef = useRef(null);
    const [activeBlockImageState, setActiveBlockImageState] = useState(null);

    const [blockDragState, setBlockDragState] = useState(null);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [blockUploadingState, setBlockUploadingState] = useState({});
    const blockDragRafRef = useRef(null);
    const [blockResizeState, setBlockResizeState] = useState(null);
    const blockResizeRafRef = useRef(null);
    const blockColorInputRefs = useRef({});
    const blockImageInputRefs = useRef({});
    const widgetColorInputRefs = useRef({});

    const navigate = useNavigate();
    const navigatePath = (path) => {
        return navigate(path);
    }
    const location = useLocation();
    
    const queryClient = useQueryClient();
    
    const links = createProfileSidebarLinks({
        location,
        navigatePath,
        navigate,
        notifCount,
        setShowEditor,
    });
    const gradients = PROFILE_GRADIENTS;
    const tablists = PROFILE_TABS;
    const activeProfileLayout = profileLayoutDraft;
    const profileSections = activeProfileLayout.sections;
    const profileWidgets = activeProfileLayout.widgets;
    const getProfileSection = (sectionId) => profileSections.find((item) => item?.id === sectionId);
    const getProfileSectionSize = (sectionId) => {
        const section = getProfileSection(sectionId);
        return PROFILE_SECTION_SIZES.includes(section?.size) ? section.size : 'md';
    };
    const visibleProfileSections = profileSections.filter((section) => section.visible !== false);
    const pinnedWidgetsBySection = visibleProfileSections.reduce((accumulator, section) => {
        accumulator[section.id] = profileWidgets.filter((widget) => widget?.pinned_section === section.id);
        return accumulator;
    }, {});
    const floatingProfileWidgets = profileWidgets.filter((widget) => !widget?.pinned_section);
    const estimatePinnedWidgetStackHeight = (sectionId) => {
        const sectionWidgets = pinnedWidgetsBySection[sectionId] || [];
        if(sectionWidgets.length === 0){
            return 0;
        }

        const estimatedWidgetsHeight = sectionWidgets.reduce((total, widget) => (
            total + estimateWidgetHeight(widget)
        ), 0);
        const gapHeight = (sectionWidgets.length - 1) * 8;
        return estimatedWidgetsHeight + gapHeight;
    };
    const estimateSectionCardHeight = (section) => {
        const baseContentHeight = Number.isFinite(section?.content_height)
            ? section.content_height
            : estimateSectionHeight(section.id, getProfileSectionSize(section.id));
        const pinnedStackHeight = estimatePinnedWidgetStackHeight(section.id);
        const sectionInnerGap = pinnedStackHeight > 0 ? 8 : 0;
        return baseContentHeight + pinnedStackHeight + sectionInnerGap;
    };

    const resolvedLayoutViewportWidth = layoutViewportWidth > 0
        ? layoutViewportWidth
        : (typeof window !== 'undefined' ? window.innerWidth : 0);
    const isMobileLayoutViewport = resolvedLayoutViewportWidth > 0
        && resolvedLayoutViewportWidth <= MOBILE_LAYOUT_BREAKPOINT;

    const projectedLayoutForMobile = useMemo(() => {
        if(!isMobileLayoutViewport){
            return null;
        }

        const canvasWidth = Math.max(220, Math.floor(resolvedLayoutViewportWidth - MOBILE_LAYOUT_GUTTER));

        // Calculate the desktop content extent for proportional scaling
        let contentRightEdge = 0;
        for(const widget of floatingProfileWidgets){
            const x = Number.isFinite(widget?.x) ? widget.x : 0;
            const w = Number.isFinite(widget?.width) ? widget.width : resolveWidgetCardWidthBySize(widget?.size);
            contentRightEdge = Math.max(contentRightEdge, x + w);
        }
        for(const section of visibleProfileSections){
            const x = Number.isFinite(section?.x) ? section.x : getDefaultSectionPosition(section.id).x;
            const w = resolveSectionCardWidthBySize(section?.size);
            contentRightEdge = Math.max(contentRightEdge, x + w);
        }

        const referenceWidth = Math.max(canvasWidth, contentRightEdge + 8);
        const scale = canvasWidth / referenceWidth;

        const projectBlocksForWidget = (blocks, widgetWidth) => {
            if(!Array.isArray(blocks)){
                return blocks;
            }

            const maxBlockWidth = Math.max(80, widgetWidth - 18);
            return blocks.map((block) => {
                const baseWidth = Number.isFinite(block?.width) ? block.width : 160;
                const nextWidth = Math.round(clampValue(baseWidth * scale, 80, maxBlockWidth));
                const baseX = Number.isFinite(block?.x) ? block.x : 0;
                const maxX = Math.max(0, maxBlockWidth - nextWidth);
                const nextX = Math.round(clampValue(baseX * scale, 0, maxX));
                const nextImageWidth = Number.isFinite(block?.image_width)
                    ? Math.round(clampValue(block.image_width * scale, 56, Math.max(56, nextWidth - 16)))
                    : block?.image_width;

                return {
                    ...block,
                    x: nextX,
                    width: nextWidth,
                    image_width: nextImageWidth
                };
            });
        };

        const projectedSections = visibleProfileSections.map((section) => {
            const baseCardWidth = resolveSectionCardWidthBySize(section?.size);
            const nextCardWidth = Math.round(Math.max(220, baseCardWidth * scale));
            const baseX = Number.isFinite(section?.x) ? section.x : getDefaultSectionPosition(section.id).x;
            const nextX = Math.round(clampValue(baseX * scale, 0, Math.max(0, canvasWidth - nextCardWidth - 4)));
            const nextContentWidth = Number.isFinite(section?.content_width)
                ? Math.round(section.content_width * scale)
                : section?.content_width;

            return {
                ...section,
                x: nextX,
                content_width: nextContentWidth
            };
        });

        const projectedPinnedWidgetsBySection = visibleProfileSections.reduce((accumulator, section) => {
            accumulator[section.id] = (pinnedWidgetsBySection[section.id] || []).map((widget) => {
                const baseWidth = Number.isFinite(widget?.width) ? widget.width : resolveWidgetCardWidthBySize(widget?.size);
                const nextWidth = Math.round(Math.max(140, baseWidth * scale));
                const nextImageWidth = Number.isFinite(widget?.image_width)
                    ? Math.round(clampValue(widget.image_width * scale, 60, Math.max(60, nextWidth - 24)))
                    : widget?.image_width;
                return {
                    ...widget,
                    width: nextWidth,
                    image_width: nextImageWidth,
                    blocks: projectBlocksForWidget(widget?.blocks, nextWidth)
                };
            });
            return accumulator;
        }, {});

        const projectedFloatingWidgets = floatingProfileWidgets.map((widget) => {
            const baseX = Number.isFinite(widget?.x) ? widget.x : 0;
            const baseY = Number.isFinite(widget?.y) ? widget.y : 0;
            const baseWidth = Number.isFinite(widget?.width) ? widget.width : resolveWidgetCardWidthBySize(widget?.size);

            const nextWidth = Math.round(Math.max(140, baseWidth * scale));
            const nextX = Math.round(clampValue(baseX * scale, 0, Math.max(0, canvasWidth - nextWidth - 4)));
            const nextY = Math.round(Math.max(0, baseY * scale));

            const nextImageWidth = Number.isFinite(widget?.image_width)
                ? Math.round(clampValue(widget.image_width * scale, 60, Math.max(60, nextWidth - 24)))
                : widget?.image_width;

            return {
                ...widget,
                x: nextX,
                y: nextY,
                width: nextWidth,
                image_width: nextImageWidth,
                blocks: projectBlocksForWidget(widget?.blocks, nextWidth)
            };
        });

        const normalizedProjectedFloatingWidgets = projectedFloatingWidgets.map((widget) => {
            const safeWidth = Number.isFinite(widget?.width) ? widget.width : 280;
            return {
                ...widget,
                image_width: Number.isFinite(widget?.image_width)
                    ? Math.round(clampValue(widget.image_width, 60, Math.max(60, safeWidth - 24)))
                    : widget?.image_width,
                blocks: projectBlocksForWidget(widget?.blocks, safeWidth)
            };
        });

        return {
            canvasWidth,
            scale,
            sections: projectedSections,
            pinnedWidgetsBySection: projectedPinnedWidgetsBySection,
            floatingWidgets: normalizedProjectedFloatingWidgets
        };
    }, [
        floatingProfileWidgets,
        isMobileLayoutViewport,
        pinnedWidgetsBySection,
        resolvedLayoutViewportWidth,
        visibleProfileSections
    ]);

    mobileLayoutScaleRef.current = projectedLayoutForMobile?.scale || 1;

    const renderedVisibleProfileSections = projectedLayoutForMobile?.sections || visibleProfileSections;
    const renderedPinnedWidgetsBySection = projectedLayoutForMobile?.pinnedWidgetsBySection || pinnedWidgetsBySection;
    const renderedFloatingProfileWidgets = projectedLayoutForMobile?.floatingWidgets || floatingProfileWidgets;
    const renderedCanvasSections = renderedVisibleProfileSections.filter(
        (section) => !PROFILE_HERO_SECTION_IDS.includes(section.id)
    );
    const resolvedSectionCanvasHeight = Math.max(
        showLayoutBuilder ? 290 : 0,
        ...renderedCanvasSections.map((section) => (
            (Number.isFinite(section?.y) ? section.y : 0) + estimateSectionCardHeight(section)
        )),
        ...renderedFloatingProfileWidgets.map((widget) => (
            (Number.isFinite(widget?.y) ? widget.y : 0) + estimateWidgetHeight(widget)
        ))
    ) + (showLayoutBuilder ? 48 : 20);

    useEffect(() => {
        if(typeof window === 'undefined'){
            return undefined;
        }

        let animationFrameId = null;
        let resizeObserver = null;

        const measureLayoutViewport = () => {
            const canvasNode = sectionCanvasRef.current;
            const viewportNode = canvasNode?.parentElement || canvasNode;
            const measuredWidth = viewportNode?.getBoundingClientRect?.().width;
            if(!Number.isFinite(measuredWidth) || measuredWidth <= 0){
                return;
            }

            setLayoutViewportWidth((previousWidth) => (
                Math.abs(previousWidth - measuredWidth) < 1 ? previousWidth : measuredWidth
            ));
        };

        const scheduleMeasure = () => {
            if(animationFrameId){
                window.cancelAnimationFrame(animationFrameId);
            }
            animationFrameId = window.requestAnimationFrame(() => {
                animationFrameId = null;
                measureLayoutViewport();
            });
        };

        scheduleMeasure();
        window.addEventListener('resize', scheduleMeasure);

        if(typeof ResizeObserver !== 'undefined'){
            resizeObserver = new ResizeObserver(() => {
                scheduleMeasure();
            });

            const canvasNode = sectionCanvasRef.current;
            const viewportNode = canvasNode?.parentElement || canvasNode;
            if(viewportNode){
                resizeObserver.observe(viewportNode);
            }
        }

        return () => {
            if(animationFrameId){
                window.cancelAnimationFrame(animationFrameId);
            }
            window.removeEventListener('resize', scheduleMeasure);
            resizeObserver?.disconnect();
        };
    }, [showLayoutBuilder, profileSections.length, profileWidgets.length]);

    useEffect(() => {
        // console.log(user)
        if(userData?.background){
            const backgroundImage = userData?.background;
            setCroppedImage(backgroundImage)
            setFontColor(userData?.profile_font_color)
        }
        if(userData?.profile_layout){
            const normalized = normalizeProfileLayout(userData.profile_layout);
            if(isMobileLayoutViewport){
                setProfileLayoutDraft(normalized);
            } else {
                setProfileLayoutDraft({
                    ...normalized,
                    widgets: resolveAllFloatingWidgetOverlaps(normalized.widgets)
                });
            }
        }
    }, [user, userData, isMobileLayoutViewport])

    // open the richtext editor
    const opendRichTextEditor = () =>{
        setShowEditor(true)
    }

    // open the sidebar through boolean function
    const handleClickOpenSidebar = () =>{
        setShowMobileSideBar(!showMobileSideBar)
    }

    // close the sidebar through boolean function
    const handleCloseSidebar = () =>{
        setShowMobileSideBar(false)
    }
    const handleCloseLayoutBuilder = (e) =>{
        e?.stopPropagation?.();
        setProfileLayoutDraft(normalizeProfileLayout(userData?.profile_layout));
        setShowLayoutBuilder(false);
    }
    const handleStartSectionMove = (e, sectionId) => {
        e.preventDefault();
        e.stopPropagation();

        const section = profileLayoutDraft.sections.find((item) => item.id === sectionId);
        const sectionEl = sectionCanvasRef.current?.querySelector(`[data-section-id="${sectionId}"]`);
        const renderedX = Number.isFinite(sectionEl?.offsetLeft)
            ? sectionEl.offsetLeft
            : (Number.isFinite(section?.x) ? section.x : getDefaultSectionPosition(sectionId).x);
        const renderedY = Number.isFinite(sectionEl?.offsetTop)
            ? sectionEl.offsetTop
            : (Number.isFinite(section?.y) ? section.y : getDefaultSectionPosition(sectionId).y);
        setDraggingSectionId(sectionId);
        setSectionMoveState({
            sectionId,
            startX: e.clientX,
            startY: e.clientY,
            originX: renderedX,
            originY: renderedY
        });
    };
    const handleStartSectionContainerMove = (e, sectionId) => {
        if(!(e.target instanceof Element)){
            return;
        }
        if(
            e.target.closest('button, input, textarea, select, a, .profile-widget-card, .profile-side-resize-handle, .profile-vertical-resize-handle, .profile-widget-block, .profile-widget-block-editor, .profile-widget-image-wrapper, .profile-widget-block-image-wrapper')
        ){
            return;
        }
        if(showLayoutBuilder || activeSectionId === sectionId){
            handleStartSectionMove(e, sectionId);
        }
    };
    const handleStartSectionResize = (e, sectionId, side) => {
        e.preventDefault();
        e.stopPropagation();

        const section = profileLayoutDraft.sections.find((item) => item.id === sectionId);
        const sectionEl = sectionCanvasRef.current?.querySelector(`[data-section-id="${sectionId}"]`);
        const contentSelector = sectionId === 'stats' ? '.profile-stats-container'
            : sectionId === 'bio' ? '.profile-bio-container'
            : '.profile-joined-date';
        const contentEl = sectionEl?.querySelector(contentSelector);
        const measuredWidth = contentEl?.offsetWidth;
        const currentWidth = Number.isFinite(measuredWidth)
            ? measuredWidth
            : (Number.isFinite(section?.content_width) ? section.content_width : 300);
        setSectionResizeState({
            sectionId,
            side,
            startX: e.clientX,
            startWidth: currentWidth
        });
    };
    const handleStartSectionHeightResize = (e, sectionId) => {
        e.preventDefault();
        e.stopPropagation();

        const section = profileLayoutDraft.sections.find((item) => item.id === sectionId);
        const sectionEl = sectionCanvasRef.current?.querySelector(`[data-section-id="${sectionId}"]`);
        const contentSelector = sectionId === 'stats' ? '.profile-stats-container'
            : sectionId === 'bio' ? '.profile-bio-container'
            : '.profile-joined-date';
        const contentEl = sectionEl?.querySelector(contentSelector);
        const measuredHeight = contentEl?.offsetHeight;
        const currentHeight = Number.isFinite(measuredHeight)
            ? measuredHeight
            : (Number.isFinite(section?.content_height) ? section.content_height : 80);

        setSectionHeightResizeState({
            sectionId,
            startY: e.clientY,
            startHeight: currentHeight
        });
    };
    const handleAddWidget = () => {
        setProfileLayoutDraft((previousLayout) => ({
            ...previousLayout,
            widgets: [...previousLayout.widgets, createDefaultWidget(previousLayout.widgets.length)]
        }));
    };
    const handleRemoveWidget = (widgetId) => {
        setProfileLayoutDraft((previousLayout) => ({
            ...previousLayout,
            widgets: previousLayout.widgets.filter((widget) => widget.id !== widgetId)
        }));
        setActiveWidgetId((previousWidgetId) => (previousWidgetId === widgetId ? null : previousWidgetId));
        setEditingWidgetId((previousWidgetId) => (previousWidgetId === widgetId ? null : previousWidgetId));
    };
    const handleWidgetFieldChange = (widgetId, field, value) => {
        setProfileLayoutDraft((previousLayout) => ({
            ...previousLayout,
            widgets: previousLayout.widgets.map((widget) => (
                widget.id === widgetId
                    ? {...widget, [field]: value}
                    : widget
            ))
        }));
    };
    const handleToggleWidgetEdit = (e, widgetId) => {
        e.stopPropagation();
        setActiveWidgetId(widgetId);
        if(editingWidgetId === widgetId){
            setEditingWidgetId(null);
            editingWidgetSnapshotRef.current = null;
        } else {
            const widget = profileLayoutDraft.widgets.find((w) => w.id === widgetId);
            editingWidgetSnapshotRef.current = widget ? JSON.parse(JSON.stringify(widget)) : null;
            setEditingWidgetId(widgetId);
        }
    };
    const handleConfirmWidgetEdit = (e) => {
        e.stopPropagation();
        editingWidgetSnapshotRef.current = null;
        setEditingWidgetId(null);
        triggerAutoSave();
    };
    const handleCancelWidgetEdit = (e, widgetId) => {
        e.stopPropagation();
        const snapshot = editingWidgetSnapshotRef.current;
        if(snapshot){
            setProfileLayoutDraft((prev) => ({
                ...prev,
                widgets: prev.widgets.map((w) => w.id === widgetId ? snapshot : w)
            }));
        }
        editingWidgetSnapshotRef.current = null;
        setEditingWidgetId(null);
    };
    const handleStartWidgetImageResize = (e, widgetId, mode = 'bottom') => {
        e.preventDefault();
        e.stopPropagation();
        const widget = profileLayoutDraft.widgets.find((item) => item.id === widgetId);
        const wrapperEl = e.target.closest('.profile-widget-image-wrapper');
        const imgEl = wrapperEl?.querySelector('img');
        const measuredHeight = imgEl?.offsetHeight;
        const measuredWidth = imgEl?.offsetWidth;
        const currentHeight = Number.isFinite(measuredHeight)
            ? measuredHeight
            : (Number.isFinite(widget?.image_height) ? widget.image_height : 140);
        const currentWidth = Number.isFinite(measuredWidth)
            ? measuredWidth
            : (Number.isFinite(widget?.image_width) ? widget.image_width : 200);
        setWidgetImageResizeState({
            widgetId,
            mode,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: currentWidth,
            startHeight: currentHeight,
            aspectRatio: currentWidth / (currentHeight || 1)
        });
    };
    const handleStartBlockImageResize = (e, widgetId, blockId, mode = 'bottom') => {
        e.preventDefault();
        e.stopPropagation();
        const widget = profileLayoutDraft.widgets.find((item) => item.id === widgetId);
        const block = (widget?.blocks || []).find((item) => item.id === blockId);
        if(!block){
            return;
        }
        const wrapperEl = e.target.closest('.profile-widget-block-image-wrapper');
        const imgEl = wrapperEl?.querySelector('img');
        const measuredHeight = imgEl?.offsetHeight;
        const measuredWidth = imgEl?.offsetWidth;
        const currentHeight = Number.isFinite(measuredHeight)
            ? measuredHeight
            : (Number.isFinite(block?.image_height) ? block.image_height : 120);
        const currentWidth = Number.isFinite(measuredWidth)
            ? measuredWidth
            : (Number.isFinite(block?.image_width) ? block.image_width : 160);
        setActiveBlockImageState({widgetId, blockId});
        setBlockImageResizeState({
            widgetId,
            blockId,
            mode,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: currentWidth,
            startHeight: currentHeight,
            aspectRatio: currentWidth / (currentHeight || 1)
        });
    };
    const handleDeleteWidgetImage = async (widgetId, imageUrl) => {
        handleWidgetFieldChange(widgetId, 'image_url', '');
        handleWidgetFieldChange(widgetId, 'image_height', null);
        handleWidgetFieldChange(widgetId, 'image_width', null);
        triggerAutoSave();
        if(imageUrl && session?.access_token){
            try {
                await deleteProfileNoteImage(session.access_token, imageUrl);
            } catch {
                // silent fail for bucket delete
            }
        }
    };
    // --- Block handlers ---
    const handleAddBlock = (widgetId, blockType = 'text') => {
        const normalizedBlockType = blockType === 'image' ? 'image' : 'text';
        setProfileLayoutDraft((prev) => ({
            ...prev,
            widgets: prev.widgets.map((widget) => {
                if(widget.id !== widgetId) return widget;
                const blocks = Array.isArray(widget.blocks) ? widget.blocks : [];
                const newBlock = createDefaultBlock(normalizedBlockType, blocks.length);
                const nextY = blocks.reduce((maxBottom, block) => (
                    Math.max(
                        maxBottom,
                        (Number.isFinite(block?.y) ? block.y : 0) + (Number.isFinite(block?.height) ? block.height : 40)
                    )
                ), 0);
                return {
                    ...widget,
                    blocks: [
                        ...blocks,
                        {
                            ...newBlock,
                            x: 4,
                            y: blocks.length ? (nextY + 8) : 8
                        }
                    ]
                };
            })
        }));
        triggerAutoSave();
    };
    const handleRemoveBlock = (widgetId, blockId) => {
        setProfileLayoutDraft((prev) => ({
            ...prev,
            widgets: prev.widgets.map((widget) => {
                if(widget.id !== widgetId) return widget;
                return {...widget, blocks: (widget.blocks || []).filter((b) => b.id !== blockId)};
            })
        }));
        setSelectedBlockId((prev) => prev === blockId ? null : prev);
        triggerAutoSave();
    };
    const handleBlockFieldChange = (widgetId, blockId, field, value) => {
        setProfileLayoutDraft((prev) => ({
            ...prev,
            widgets: prev.widgets.map((widget) => {
                if(widget.id !== widgetId) return widget;
                return {
                    ...widget,
                    blocks: (widget.blocks || []).map((block) =>
                        block.id === blockId ? {...block, [field]: value} : block
                    )
                };
            })
        }));
    };
    const handleStartBlockDrag = (e, widgetId, blockId) => {
        e.preventDefault();
        e.stopPropagation();
        const widget = profileLayoutDraft.widgets.find((w) => w.id === widgetId);
        const block = (widget?.blocks || []).find((b) => b.id === blockId);
        if(!block) return;
        const widgetEl = sectionCanvasRef.current?.querySelector(`[data-widget-id="${widgetId}"]`);
        const blockEl = (e.currentTarget instanceof Element && e.currentTarget.classList.contains('profile-widget-block'))
            ? e.currentTarget
            : widgetEl?.querySelector(`[data-block-id="${blockId}"]`);
        const renderedX = Number.isFinite(blockEl?.offsetLeft)
            ? blockEl.offsetLeft
            : (Number.isFinite(block?.x) ? block.x : 0);
        const renderedY = Number.isFinite(blockEl?.offsetTop)
            ? blockEl.offsetTop
            : (Number.isFinite(block?.y) ? block.y : 0);
        setBlockDragState({
            widgetId,
            blockId,
            startX: e.clientX,
            startY: e.clientY,
            originX: renderedX,
            originY: renderedY
        });
    };
    const handleStartBlockResize = (e, widgetId, blockId, mode = 'corner-br') => {
        e.preventDefault();
        e.stopPropagation();
        const widget = profileLayoutDraft.widgets.find((w) => w.id === widgetId);
        const block = (widget?.blocks || []).find((b) => b.id === blockId);
        if(!block){
            return;
        }
        const widgetEl = sectionCanvasRef.current?.querySelector(`[data-widget-id="${widgetId}"]`);
        const blockEl = (e.currentTarget instanceof Element && e.currentTarget.classList.contains('profile-widget-block'))
            ? e.currentTarget
            : widgetEl?.querySelector(`[data-block-id="${blockId}"]`);
        const measuredWidth = blockEl?.offsetWidth;
        const measuredHeight = blockEl?.offsetHeight;
        setBlockResizeState({
            widgetId,
            blockId,
            mode,
            startX: e.clientX,
            startY: e.clientY,
            startWidth: Number.isFinite(measuredWidth)
                ? measuredWidth
                : (Number.isFinite(block?.width) ? block.width : 160),
            startHeight: Number.isFinite(measuredHeight)
                ? measuredHeight
                : (Number.isFinite(block?.height) ? block.height : 40)
        });
    };
    const handleOpenBlockColorPicker = (blockId) => {
        const input = blockColorInputRefs.current[blockId];
        if(input) input.click();
    };
    const handleBlockColorChange = (widgetId, blockId, color) => {
        handleBlockFieldChange(widgetId, blockId, 'bg_color', color || null);
        triggerAutoSave();
    };
    const handleOpenWidgetColorPicker = (widgetId) => {
        const input = widgetColorInputRefs.current[widgetId];
        if(input) input.click();
    };
    const handleWidgetColorChange = (widgetId, color) => {
        setProfileLayoutDraft((prev) => ({
            ...prev,
            widgets: prev.widgets.map((w) =>
                w.id === widgetId ? { ...w, bg_color: color || null } : w
            )
        }));
        triggerAutoSave();
    };
    const handleOpenBlockImagePicker = (blockId) => {
        const input = blockImageInputRefs.current[blockId];
        if(input){ input.value = ''; input.click(); }
    };
    const handleBlockImageUpload = async(widgetId, blockId, file) => {
        if(!file || !session?.access_token) return;
        setBlockUploadingState((prev) => ({...prev, [blockId]: true}));
        try {
            const formdata = new FormData();
            formdata.append('image', file);
            const data = await saveProfileNoteImage(session.access_token, formdata);
            if(data?.img_url){
                handleBlockFieldChange(widgetId, blockId, 'image_url', data.img_url);
            }
        } catch {
            // silent fail
        } finally {
            setBlockUploadingState((prev) => ({...prev, [blockId]: false}));
        }
    };
    const handleDeleteBlockImage = async(widgetId, blockId, imageUrl) => {
        handleBlockFieldChange(widgetId, blockId, 'image_url', '');
        handleBlockFieldChange(widgetId, blockId, 'image_width', null);
        handleBlockFieldChange(widgetId, blockId, 'image_height', null);
        triggerAutoSave();
        if(imageUrl && session?.access_token){
            try {
                await deleteProfileNoteImage(session.access_token, imageUrl);
            } catch {
                // silent fail for bucket delete
            }
        }
    };
    const handleResetBlockImageSize = (widgetId, blockId) => {
        setProfileLayoutDraft((prev) => ({
            ...prev,
            widgets: prev.widgets.map((widget) => {
                if(widget.id !== widgetId){
                    return widget;
                }
                return {
                    ...widget,
                    blocks: (widget.blocks || []).map((block) => (
                        block.id === blockId
                            ? {
                                ...block,
                                image_width: null,
                                image_height: null,
                                width: 200
                            }
                            : block
                    ))
                };
            })
        }));
        triggerAutoSave();
    };
    const handleConvertToBlocks = (widgetId) => {
        setProfileLayoutDraft((prev) => ({
            ...prev,
            widgets: prev.widgets.map((widget) => {
                if(widget.id !== widgetId) return widget;
                const blocks = [];
                let yOffset = 4;
                if(widget.title){
                    blocks.push({...createDefaultBlock('text', 0), content: widget.title, x: 4, y: yOffset, width: 200, height: 32});
                    yOffset += 36;
                }
                if(isPhotoNoteType(widget?.type) && widget.image_url){
                    blocks.push({...createDefaultBlock('image', blocks.length), image_url: widget.image_url, image_width: widget.image_width, image_height: widget.image_height, x: 4, y: yOffset, width: widget.image_width || 200, height: widget.image_height || 140});
                    yOffset += (widget.image_height || 140) + 4;
                }
                if(widget.note){
                    blocks.push({...createDefaultBlock('text', blocks.length), content: widget.note, x: 4, y: yOffset, width: 200, height: 60});
                }
                return {...widget, blocks};
            })
        }));
        triggerAutoSave();
    };
    const handleWidgetDragStart = (e, widgetId) => {
        if(!showLayoutBuilder){
            return;
        }
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/widget-id', widgetId);
        setDraggingWidgetId(widgetId);
    };
    const handleOpenWidgetImagePicker = (widgetId) => {
        const input = widgetImageInputRefs.current[widgetId];
        if(input){
            input.value = '';
            input.click();
        }
    };
    const handleWidgetImageUpload = async(widgetId, file) => {
        if(!file || !session?.access_token){
            return;
        }

        setWidgetUploadingState((previousState) => ({
            ...previousState,
            [widgetId]: true
        }));

        try {
            const formdata = new FormData();
            formdata.append('image', file);
            const data = await saveProfileNoteImage(session.access_token, formdata);
            if(data?.img_url){
                handleWidgetFieldChange(widgetId, 'image_url', data.img_url);
            }
        } catch {
            throw new Error('error uploading widget image');
        } finally {
            setWidgetUploadingState((previousState) => ({
                ...previousState,
                [widgetId]: false
            }));
        }
    };
    const handleStartWidgetMove = (e, widgetId) => {
        e.preventDefault();
        e.stopPropagation();

        const widget = profileLayoutDraft.widgets.find((item) => item.id === widgetId);
        const widgetEl = sectionCanvasRef.current?.querySelector(`[data-widget-id="${widgetId}"]`);
        const renderedX = Number.isFinite(widgetEl?.offsetLeft)
            ? widgetEl.offsetLeft
            : (Number.isFinite(widget?.x) ? widget.x : 16);
        const renderedY = Number.isFinite(widgetEl?.offsetTop)
            ? widgetEl.offsetTop
            : (Number.isFinite(widget?.y) ? widget.y : 16);
        setDraggingWidgetId(widgetId);
        setWidgetMoveState({
            widgetId,
            startX: e.clientX,
            startY: e.clientY,
            originX: renderedX,
            originY: renderedY
        });
    };
    const handleStartWidgetResize = (e, widgetId, side) => {
        e.preventDefault();
        e.stopPropagation();

        const widget = profileLayoutDraft.widgets.find((item) => item.id === widgetId);
        const widgetEl = sectionCanvasRef.current?.querySelector(`[data-widget-id="${widgetId}"]`);
        const measuredWidth = widgetEl?.offsetWidth;
        const currentWidth = Number.isFinite(measuredWidth)
            ? measuredWidth
            : (Number.isFinite(widget?.width) ? widget.width : 320);
        const renderedX = Number.isFinite(widgetEl?.offsetLeft)
            ? widgetEl.offsetLeft
            : (Number.isFinite(widget?.x) ? widget.x : 0);
        setWidgetResizeState({
            widgetId,
            side,
            startX: e.clientX,
            startWidth: currentWidth,
            startWidgetX: renderedX,
            isPinned: Boolean(widget?.pinned_section)
        });
    };
    const handleStartWidgetHeightResize = (e, widgetId, mode = 'bottom') => {
        e.preventDefault();
        e.stopPropagation();

        const widget = profileLayoutDraft.widgets.find((item) => item.id === widgetId);
        const widgetEl = sectionCanvasRef.current?.querySelector(`[data-widget-id="${widgetId}"]`);
        const measuredHeight = widgetEl?.offsetHeight;
        const currentHeight = Number.isFinite(measuredHeight)
            ? measuredHeight
            : (Number.isFinite(widget?.height) ? widget.height : estimateWidgetHeight(widget || {}));
        const renderedY = Number.isFinite(widgetEl?.offsetTop)
            ? widgetEl.offsetTop
            : (Number.isFinite(widget?.y) ? widget.y : 0);
        setWidgetHeightResizeState({
            widgetId,
            startY: e.clientY,
            startHeight: currentHeight,
            mode,
            startWidgetY: renderedY,
            isPinned: Boolean(widget?.pinned_section)
        });
    };
    const handleStartWidgetCornerResize = (e, widgetId, mode = 'side-right-corners') => {
        e.preventDefault();
        e.stopPropagation();
        const widget = profileLayoutDraft.widgets.find((item) => item.id === widgetId);
        const widgetEl = sectionCanvasRef.current?.querySelector(`[data-widget-id="${widgetId}"]`);
        const measuredWidth = widgetEl?.offsetWidth;
        const measuredHeight = widgetEl?.offsetHeight;
        const currentWidth = Number.isFinite(measuredWidth)
            ? measuredWidth
            : (Number.isFinite(widget?.width) ? widget.width : 320);
        const currentHeight = Number.isFinite(measuredHeight)
            ? measuredHeight
            : (Number.isFinite(widget?.height) ? widget.height : estimateWidgetHeight(widget || {}));
        const renderedX = Number.isFinite(widgetEl?.offsetLeft)
            ? widgetEl.offsetLeft
            : (Number.isFinite(widget?.x) ? widget.x : 0);
        const renderedY = Number.isFinite(widgetEl?.offsetTop)
            ? widgetEl.offsetTop
            : (Number.isFinite(widget?.y) ? widget.y : 0);
        const isTopCorner = mode === 'corner-tr' || mode === 'corner-tl';
        const heightMode = isTopCorner ? 'top' : 'bottom';
        const side = mode === 'corner-tl' || mode === 'corner-bl' ? 'left' : 'right';

        setWidgetResizeState({
            widgetId,
            side,
            startX: e.clientX,
            startWidth: currentWidth,
            startWidgetX: renderedX,
            isPinned: Boolean(widget?.pinned_section)
        });
        setWidgetHeightResizeState({
            widgetId,
            startY: e.clientY,
            startHeight: currentHeight,
            mode: heightMode,
            startWidgetY: renderedY,
            isPinned: Boolean(widget?.pinned_section)
        });
    };
    const handleStartWidgetContainerResize = (e, widgetId, options = {}) => {
        const { requireActive = true } = options;
        if(e.button !== 0){
            return;
        }
        if(!(e.target instanceof Element)){
            return;
        }
        if(
            e.target.closest('button, input, textarea, select, a, .profile-widget-block, .profile-widget-block-editor, .profile-widget-image-wrapper, .profile-widget-block-image-wrapper')
        ){
            return;
        }
        if(requireActive && activeWidgetId !== widgetId){
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const widget = profileLayoutDraft.widgets.find((item) => item.id === widgetId);
        const widgetEl = sectionCanvasRef.current?.querySelector(`[data-widget-id="${widgetId}"]`);
        const measuredWidth = widgetEl?.offsetWidth;
        const measuredHeight = widgetEl?.offsetHeight;
        const currentWidth = Number.isFinite(measuredWidth)
            ? measuredWidth
            : (Number.isFinite(widget?.width) ? widget.width : 320);
        const currentHeight = Number.isFinite(measuredHeight)
            ? measuredHeight
            : (Number.isFinite(widget?.height) ? widget.height : estimateWidgetHeight(widget || {}));

        setWidgetResizeState({
            widgetId,
            side: 'right',
            startX: e.clientX,
            startWidth: currentWidth
        });
        setWidgetHeightResizeState({
            widgetId,
            startY: e.clientY,
            startHeight: currentHeight
        });
    };
    const handleStartWidgetContainerInteraction = (e, widgetId, options = {}) => {
        const { requireActive = true } = options;
        if(!(e.target instanceof Element)){
            return;
        }
        if(
            e.target.closest('button, input, textarea, select, a, .profile-widget-block, .profile-widget-block-editor, .profile-widget-image-wrapper, .profile-widget-block-image-wrapper')
        ){
            return;
        }
        if(requireActive && activeWidgetId !== widgetId){
            return;
        }
        if(!showLayoutBuilder && editingWidgetId === widgetId){
            return;
        }

        const cardEl = e.currentTarget instanceof Element ? e.currentTarget : null;
        const rect = cardEl?.getBoundingClientRect();
        const nearBottomRightCorner = Boolean(rect) && ((rect.right - e.clientX) <= 18) && ((rect.bottom - e.clientY) <= 18);

        if(nearBottomRightCorner){
            handleStartWidgetContainerResize(e, widgetId, {requireActive: false});
            return;
        }

        handleStartWidgetMove(e, widgetId);
    };
    const handleDropWidgetToSection = (e, sectionId) => {
        e.preventDefault();
        e.stopPropagation();
        const widgetId = e.dataTransfer.getData('text/widget-id') || draggingWidgetId;
        if(!widgetId){
            return;
        }
        setProfileLayoutDraft((previousLayout) => ({
            ...previousLayout,
            widgets: previousLayout.widgets.map((widget) => (
                widget.id === widgetId
                    ? {...widget, pinned_section: sectionId}
                    : widget
            ))
        }));
        setSectionDropTarget(null);
        setDraggingWidgetId(null);
    };
    const handleUndockWidget = (widgetId) => {
        setProfileLayoutDraft((previousLayout) => ({
            ...previousLayout,
            widgets: previousLayout.widgets.map((widget) => (
                widget.id === widgetId
                    ? {...widget, pinned_section: null}
                    : widget
            ))
        }));
    };
    const handleSaveProfileLayout = async() =>{
        if(!session?.access_token || !userData?.name || !userData?.bio){
            return;
        }

        setIsSavingLayout(true);

        const currentBackground = (croppedImage && Object.keys(croppedImage).length > 0)
            ? croppedImage
            : (userData?.background || {});

        const formdata = new FormData();
        formdata.append('name', userData.name);
        formdata.append('bio', userData.bio);
        formdata.append('profileBg', JSON.stringify(currentBackground));
        formdata.append('dominantColors', userData?.dominant_colors || dominantColors);
        formdata.append('secondaryColors', userData?.secondary_colors || secondaryColors);
        formdata.append('profileLayout', JSON.stringify(profileLayoutDraft));

        try {
            await updateProfileData(formdata, session.access_token);
            queryClient.invalidateQueries({queryKey: ['userData']});
            setShowLayoutBuilder(false);
        } catch {
            throw new Error('error updating profile layout');
        } finally {
            setIsSavingLayout(false);
        }
    }

    autoSaveRef.current = async () => {
        if(!session?.access_token || !userData?.name || !userData?.bio){
            return;
        }
        const currentBackground = (croppedImage && Object.keys(croppedImage).length > 0)
            ? croppedImage
            : (userData?.background || {});
        const formdata = new FormData();
        formdata.append('name', userData.name);
        formdata.append('bio', userData.bio);
        formdata.append('profileBg', JSON.stringify(currentBackground));
        formdata.append('dominantColors', userData?.dominant_colors || dominantColors);
        formdata.append('secondaryColors', userData?.secondary_colors || secondaryColors);
        formdata.append('profileLayout', JSON.stringify(profileLayoutDraft));
        try {
            await updateProfileData(formdata, session.access_token);
            queryClient.invalidateQueries({queryKey: ['userData']});
        } catch {
            // silent fail for auto-save
        }
    };

    const triggerAutoSave = () => {
        if(autoSaveTimerRef.current){
            clearTimeout(autoSaveTimerRef.current);
        }
        autoSaveTimerRef.current = setTimeout(() => autoSaveRef.current?.(), 400);
    };

    useEffect(() => {
        if(!sectionResizeState){
            return;
        }

        let latestEvent = null;
        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            latestEvent = clientPoint;
            if(sectionResizeRafRef.current){
                return;
            }
            sectionResizeRafRef.current = window.requestAnimationFrame(() => {
                if(!latestEvent){
                    sectionResizeRafRef.current = null;
                    return;
                }
                const deltaX = latestEvent.clientX - sectionResizeState.startX;
                const directionalDelta = sectionResizeState.side === 'left' ? -deltaX : deltaX;
                const nextWidth = Math.max(120, Math.min(600, sectionResizeState.startWidth + directionalDelta));
                setProfileLayoutDraft((previousLayout) => ({
                    ...previousLayout,
                    sections: previousLayout.sections.map((section) => (
                        section.id === sectionResizeState.sectionId
                            ? {...section, content_width: nextWidth}
                            : section
                    ))
                }));
                sectionResizeRafRef.current = null;
            });
        };

        const handleMouseUp = () => {
            if(sectionResizeRafRef.current){
                window.cancelAnimationFrame(sectionResizeRafRef.current);
                sectionResizeRafRef.current = null;
            }
            setSectionResizeState(null);
            if(!showLayoutBuilder){
                triggerAutoSave();
            }
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);

        return () => {
            removeListeners();
        };
    }, [sectionResizeState, showLayoutBuilder]);

    useEffect(() => {
        if(!widgetResizeState){
            return;
        }

        let latestEvent = null;
        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            latestEvent = clientPoint;
            if(widgetResizeRafRef.current){
                return;
            }
            widgetResizeRafRef.current = window.requestAnimationFrame(() => {
                if(!latestEvent){
                    widgetResizeRafRef.current = null;
                    return;
                }
                const deltaX = latestEvent.clientX - widgetResizeState.startX;
                const directionalDelta = widgetResizeState.side === 'left' ? -deltaX : deltaX;
                const nextWidth = Math.max(180, Math.min(620, widgetResizeState.startWidth + directionalDelta));
                const roundedWidth = Math.round(nextWidth);
                const canvasWidth = sectionCanvasRef.current?.getBoundingClientRect?.().width;
                setProfileLayoutDraft((previousLayout) => {
                    const targetWidget = previousLayout.widgets.find(
                        (widget) => widget.id === widgetResizeState.widgetId
                    );
                    if(!targetWidget){
                        return previousLayout;
                    }

                    const proposedX = widgetResizeState.side === 'left' && !widgetResizeState.isPinned
                        ? Math.max(
                            0,
                            Math.round(widgetResizeState.startWidgetX + (widgetResizeState.startWidth - nextWidth))
                        )
                        : (Number.isFinite(targetWidget?.x) ? targetWidget.x : 0);
                    const proposedY = Number.isFinite(targetWidget?.y) ? targetWidget.y : 0;
                    const shouldResolveFloatingCollision = (
                        !isMobileLayoutViewport
                        && !targetWidget?.pinned_section
                    );
                    const resolvedPlacement = shouldResolveFloatingCollision
                        ? resolveFloatingWidgetPlacement(previousLayout.widgets, {
                            movingWidgetId: targetWidget.id,
                            nextX: proposedX,
                            nextY: proposedY,
                            nextWidth: roundedWidth,
                            nextHeight: resolveWidgetHeightForCanvas({...targetWidget, width: roundedWidth}),
                            canvasWidth
                        })
                        : null;

                    return {
                        ...previousLayout,
                        widgets: previousLayout.widgets.map((widget) => (
                            widget.id === widgetResizeState.widgetId
                                ? {
                                    ...widget,
                                    width: roundedWidth,
                                    x: resolvedPlacement ? resolvedPlacement.x : proposedX,
                                    y: resolvedPlacement ? resolvedPlacement.y : widget.y
                                }
                                : widget
                        ))
                    };
                });
                widgetResizeRafRef.current = null;
            });
        };

        const handleMouseUp = () => {
            if(widgetResizeRafRef.current){
                window.cancelAnimationFrame(widgetResizeRafRef.current);
                widgetResizeRafRef.current = null;
            }
            setWidgetResizeState(null);
            if(!showLayoutBuilder){
                triggerAutoSave();
            }
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);

        return () => {
            removeListeners();
        };
    }, [widgetResizeState, showLayoutBuilder, isMobileLayoutViewport]);

    useEffect(() => {
        if(!sectionHeightResizeState){
            return;
        }

        let latestEvent = null;
        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            latestEvent = clientPoint;
            if(sectionHeightResizeRafRef.current){
                return;
            }
            sectionHeightResizeRafRef.current = window.requestAnimationFrame(() => {
                if(!latestEvent){
                    sectionHeightResizeRafRef.current = null;
                    return;
                }
                const nextHeight = Math.max(40, Math.min(520, sectionHeightResizeState.startHeight + (latestEvent.clientY - sectionHeightResizeState.startY)));
                setProfileLayoutDraft((previousLayout) => ({
                    ...previousLayout,
                    sections: previousLayout.sections.map((section) => (
                        section.id === sectionHeightResizeState.sectionId
                            ? {...section, content_height: nextHeight}
                            : section
                    ))
                }));
                sectionHeightResizeRafRef.current = null;
            });
        };

        const handleMouseUp = () => {
            if(sectionHeightResizeRafRef.current){
                window.cancelAnimationFrame(sectionHeightResizeRafRef.current);
                sectionHeightResizeRafRef.current = null;
            }
            setSectionHeightResizeState(null);
            if(!showLayoutBuilder){
                triggerAutoSave();
            }
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);

        return () => {
            removeListeners();
        };
    }, [sectionHeightResizeState, showLayoutBuilder]);

    useEffect(() => {
        if(!widgetHeightResizeState){
            return;
        }

        let latestEvent = null;
        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            latestEvent = clientPoint;
            if(widgetHeightResizeRafRef.current){
                return;
            }
            widgetHeightResizeRafRef.current = window.requestAnimationFrame(() => {
                if(!latestEvent){
                    widgetHeightResizeRafRef.current = null;
                    return;
                }
                const deltaY = latestEvent.clientY - widgetHeightResizeState.startY;
                const nextHeight = widgetHeightResizeState.mode === 'top'
                    ? Math.max(96, Math.min(620, widgetHeightResizeState.startHeight - deltaY))
                    : Math.max(96, Math.min(620, widgetHeightResizeState.startHeight + deltaY));
                const roundedHeight = Math.round(nextHeight);
                const canvasWidth = sectionCanvasRef.current?.getBoundingClientRect?.().width;
                setProfileLayoutDraft((previousLayout) => {
                    const targetWidget = previousLayout.widgets.find(
                        (widget) => widget.id === widgetHeightResizeState.widgetId
                    );
                    if(!targetWidget){
                        return previousLayout;
                    }

                    const proposedX = Number.isFinite(targetWidget?.x) ? targetWidget.x : 0;
                    const proposedY = widgetHeightResizeState.mode === 'top' && !widgetHeightResizeState.isPinned
                        ? Math.max(
                            0,
                            Math.round(
                                widgetHeightResizeState.startWidgetY
                                + (widgetHeightResizeState.startHeight - roundedHeight)
                            )
                        )
                        : (Number.isFinite(targetWidget?.y) ? targetWidget.y : 0);
                    const shouldResolveFloatingCollision = (
                        !isMobileLayoutViewport
                        && !targetWidget?.pinned_section
                    );
                    const resolvedPlacement = shouldResolveFloatingCollision
                        ? resolveFloatingWidgetPlacement(previousLayout.widgets, {
                            movingWidgetId: targetWidget.id,
                            nextX: proposedX,
                            nextY: proposedY,
                            nextWidth: resolveWidgetWidthForCanvas(targetWidget),
                            nextHeight: roundedHeight,
                            canvasWidth
                        })
                        : null;

                    return {
                        ...previousLayout,
                        widgets: previousLayout.widgets.map((widget) => (
                            widget.id === widgetHeightResizeState.widgetId
                                ? {
                                    ...widget,
                                    height: roundedHeight,
                                    x: resolvedPlacement ? resolvedPlacement.x : widget.x,
                                    y: resolvedPlacement ? resolvedPlacement.y : proposedY
                                }
                                : widget
                        ))
                    };
                });
                widgetHeightResizeRafRef.current = null;
            });
        };

        const handleMouseUp = () => {
            if(widgetHeightResizeRafRef.current){
                window.cancelAnimationFrame(widgetHeightResizeRafRef.current);
                widgetHeightResizeRafRef.current = null;
            }
            setWidgetHeightResizeState(null);
            if(!showLayoutBuilder){
                triggerAutoSave();
            }
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);

        return () => {
            removeListeners();
        };
    }, [widgetHeightResizeState, showLayoutBuilder, isMobileLayoutViewport]);

    useEffect(() => {
        if(!widgetImageResizeState){
            return;
        }

        let latestEvent = null;
        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            latestEvent = clientPoint;
            if(widgetImageResizeRafRef.current){
                return;
            }
            widgetImageResizeRafRef.current = window.requestAnimationFrame(() => {
                if(!latestEvent){
                    widgetImageResizeRafRef.current = null;
                    return;
                }
                const { mode, startX, startY, startWidth, startHeight, aspectRatio, widgetId } = widgetImageResizeState;
                const deltaX = latestEvent.clientX - startX;
                const deltaY = latestEvent.clientY - startY;

                let nextWidth = startWidth;
                let nextHeight = startHeight;

                if(mode === 'bottom'){
                    nextHeight = Math.max(40, Math.min(500, startHeight + deltaY));
                } else if(mode === 'right'){
                    nextWidth = Math.max(60, Math.min(500, startWidth + deltaX));
                } else if(mode === 'left'){
                    nextWidth = Math.max(60, Math.min(500, startWidth - deltaX));
                } else if(mode === 'top'){
                    nextHeight = Math.max(40, Math.min(500, startHeight - deltaY));
                } else if(mode.startsWith('corner')){
                    const isRight = mode.includes('r');
                    const delta = isRight ? deltaX : -deltaX;
                    nextWidth = Math.max(60, Math.min(500, startWidth + delta));
                    nextHeight = Math.max(40, Math.min(500, Math.round(nextWidth / aspectRatio)));
                }

                setProfileLayoutDraft((prev) => ({
                    ...prev,
                    widgets: prev.widgets.map((w) => (
                        w.id === widgetId
                            ? {...w, image_width: Math.round(nextWidth), image_height: Math.round(nextHeight)}
                            : w
                    ))
                }));
                widgetImageResizeRafRef.current = null;
            });
        };

        const handleMouseUp = () => {
            if(widgetImageResizeRafRef.current){
                window.cancelAnimationFrame(widgetImageResizeRafRef.current);
                widgetImageResizeRafRef.current = null;
            }
            setWidgetImageResizeState(null);
            triggerAutoSave();
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);

        return () => {
            removeListeners();
        };
    }, [widgetImageResizeState]);

    useEffect(() => {
        if(!blockImageResizeState){
            return;
        }

        let latestEvent = null;
        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            latestEvent = clientPoint;
            if(blockImageResizeRafRef.current){
                return;
            }
            blockImageResizeRafRef.current = window.requestAnimationFrame(() => {
                if(!latestEvent){
                    blockImageResizeRafRef.current = null;
                    return;
                }
                const { mode, startX, startY, startWidth, startHeight, aspectRatio, widgetId, blockId } = blockImageResizeState;
                const deltaX = latestEvent.clientX - startX;
                const deltaY = latestEvent.clientY - startY;

                let nextWidth = startWidth;
                let nextHeight = startHeight;

                if(mode === 'bottom'){
                    nextHeight = Math.max(36, Math.min(420, startHeight + deltaY));
                } else if(mode === 'right'){
                    nextWidth = Math.max(56, Math.min(420, startWidth + deltaX));
                } else if(mode === 'left'){
                    nextWidth = Math.max(56, Math.min(420, startWidth - deltaX));
                } else if(mode === 'top'){
                    nextHeight = Math.max(36, Math.min(420, startHeight - deltaY));
                } else if(mode.startsWith('corner')){
                    const isRight = mode.includes('r');
                    const delta = isRight ? deltaX : -deltaX;
                    nextWidth = Math.max(56, Math.min(420, startWidth + delta));
                    const resolvedRatio = aspectRatio > 0 ? aspectRatio : 1;
                    nextHeight = Math.max(36, Math.min(420, Math.round(nextWidth / resolvedRatio)));
                }

                const finalWidth = Math.round(nextWidth);
                const finalHeight = Math.round(nextHeight);

                setProfileLayoutDraft((prev) => ({
                    ...prev,
                    widgets: prev.widgets.map((widget) => {
                        if(widget.id !== widgetId){
                            return widget;
                        }
                        return {
                            ...widget,
                            blocks: (widget.blocks || []).map((block) => (
                                block.id === blockId
                                    ? {
                                        ...block,
                                        image_width: finalWidth,
                                        image_height: finalHeight,
                                        width: Math.max(Number.isFinite(block?.width) ? block.width : 160, finalWidth + 16),
                                        height: Math.max(Number.isFinite(block?.height) ? block.height : 80, finalHeight + 18)
                                    }
                                    : block
                            ))
                        };
                    })
                }));
                blockImageResizeRafRef.current = null;
            });
        };

        const handleMouseUp = () => {
            if(blockImageResizeRafRef.current){
                window.cancelAnimationFrame(blockImageResizeRafRef.current);
                blockImageResizeRafRef.current = null;
            }
            setBlockImageResizeState(null);
            triggerAutoSave();
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);

        return () => {
            removeListeners();
        };
    }, [blockImageResizeState]);

    useEffect(() => {
        if(!blockResizeState){
            return;
        }

        let latestEvent = null;
        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            latestEvent = clientPoint;
            if(blockResizeRafRef.current){
                return;
            }
            blockResizeRafRef.current = window.requestAnimationFrame(() => {
                if(!latestEvent){
                    blockResizeRafRef.current = null;
                    return;
                }

                const { widgetId, blockId, mode, startX, startY, startWidth, startHeight } = blockResizeState;
                const deltaX = latestEvent.clientX - startX;
                const deltaY = latestEvent.clientY - startY;
                let nextWidth = startWidth;
                let nextHeight = startHeight;

                if(mode === 'right'){
                    nextWidth = startWidth + deltaX;
                } else if(mode === 'bottom'){
                    nextHeight = startHeight + deltaY;
                } else {
                    nextWidth = startWidth + deltaX;
                    nextHeight = startHeight + deltaY;
                }

                const finalWidth = Math.round(Math.max(80, Math.min(520, nextWidth)));
                const finalHeight = Math.round(Math.max(32, Math.min(620, nextHeight)));

                setProfileLayoutDraft((prev) => ({
                    ...prev,
                    widgets: prev.widgets.map((widget) => {
                        if(widget.id !== widgetId){
                            return widget;
                        }
                        return {
                            ...widget,
                            blocks: (widget.blocks || []).map((block) => (
                                block.id === blockId
                                    ? {
                                        ...block,
                                        width: finalWidth,
                                        height: finalHeight,
                                        image_width: block.type === 'image' ? Math.max(56, finalWidth - 16) : block.image_width,
                                        image_height: block.type === 'image' ? Math.max(36, finalHeight - 18) : block.image_height
                                    }
                                    : block
                            ))
                        };
                    })
                }));

                blockResizeRafRef.current = null;
            });
        };

        const handleMouseUp = () => {
            if(blockResizeRafRef.current){
                window.cancelAnimationFrame(blockResizeRafRef.current);
                blockResizeRafRef.current = null;
            }
            setBlockResizeState(null);
            triggerAutoSave();
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);

        return () => {
            removeListeners();
        };
    }, [blockResizeState]);

    useEffect(() => {
        if(!blockDragState) return;

        let latestEvent = null;
        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            latestEvent = clientPoint;
            if(blockDragRafRef.current) return;
            blockDragRafRef.current = window.requestAnimationFrame(() => {
                if(!latestEvent){ blockDragRafRef.current = null; return; }
                const rawX = blockDragState.originX + (latestEvent.clientX - blockDragState.startX);
                const rawY = blockDragState.originY + (latestEvent.clientY - blockDragState.startY);
                const snappedX = Math.max(0, Math.round(rawX / 4) * 4);
                const snappedY = Math.max(0, Math.round(rawY / 4) * 4);

                setProfileLayoutDraft((prev) => ({
                    ...prev,
                    widgets: prev.widgets.map((widget) => {
                        if(widget.id !== blockDragState.widgetId) return widget;
                        return {
                            ...widget,
                            blocks: (widget.blocks || []).map((block) =>
                                block.id === blockDragState.blockId
                                    ? {...block, x: snappedX, y: snappedY}
                                    : block
                            )
                        };
                    })
                }));
                blockDragRafRef.current = null;
            });
        };

        const handleMouseUp = () => {
            if(blockDragRafRef.current){
                window.cancelAnimationFrame(blockDragRafRef.current);
                blockDragRafRef.current = null;
            }
            setBlockDragState(null);
            triggerAutoSave();
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);
        return () => {
            removeListeners();
        };
    }, [blockDragState]);

    useEffect(() => {
        if(!widgetMoveState){
            return;
        }

        const shouldAllowSectionDocking = showLayoutBuilder && !isMobileLayoutViewport;
        let hoveredSectionId = null;
        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            const canvas = sectionCanvasRef.current;
            if(!canvas){
                return;
            }

            const canvasRect = canvas.getBoundingClientRect();
            const widgetNode = canvas.querySelector(`[data-widget-id="${widgetMoveState.widgetId}"]`);
            const mobileScale = isMobileLayoutViewport ? (mobileLayoutScaleRef.current || 1) : 1;
            const widgetWidth = widgetNode?.offsetWidth || 260;
            const maxX = Math.max(0, canvasRect.width - widgetWidth - 4);

            const rawX = Math.min(maxX, Math.max(0, widgetMoveState.originX + (clientPoint.clientX - widgetMoveState.startX)));
            const rawY = Math.max(0, widgetMoveState.originY + (clientPoint.clientY - widgetMoveState.startY));
            const screenX = Math.round(Math.min(maxX, rawX));
            const screenY = Math.round(Math.max(0, rawY));

            // Convert screen coordinates to real (unscaled) coordinates for storage
            const realX = Math.round(screenX / mobileScale);
            const realY = Math.round(screenY / mobileScale);

            if(isMobileLayoutViewport){
                setProfileLayoutDraft((previousLayout) => {
                    const movingWidget = previousLayout.widgets.find((widget) => widget.id === widgetMoveState.widgetId);
                    if(!movingWidget || movingWidget.pinned_section){
                        return previousLayout;
                    }

                    const realCanvasWidth = Math.round(canvasRect.width / mobileScale);
                    const realWidgetWidth = resolveWidgetWidthForCanvas(movingWidget);
                    const realMaxX = Math.max(0, Math.round(realCanvasWidth - realWidgetWidth - 4));
                    const clampedRealX = Math.round(clampValue(realX, 0, realMaxX));
                    const clampedRealY = Math.max(0, Math.round(realY));

                    return {
                        ...previousLayout,
                        widgets: previousLayout.widgets.map((widget) => (
                            widget.id === widgetMoveState.widgetId
                                ? {...widget, x: clampedRealX, y: clampedRealY}
                                : widget
                        ))
                    };
                });
            } else {
                setProfileLayoutDraft((previousLayout) => {
                    const movingWidget = previousLayout.widgets.find((widget) => widget.id === widgetMoveState.widgetId);
                    if(!movingWidget){
                        return previousLayout;
                    }

                    return {
                        ...previousLayout,
                        widgets: previousLayout.widgets.map((widget) => (
                            widget.id === widgetMoveState.widgetId
                                ? {...widget, x: screenX, y: screenY}
                                : widget
                        ))
                    };
                });
            }

            const sectionCanvas = sectionCanvasRef.current;
            if(shouldAllowSectionDocking && sectionCanvas){
                const sectionCards = sectionCanvas.querySelectorAll('[data-section-id]');
                let nextHoverSectionId = null;
                sectionCards.forEach((card) => {
                    const rect = card.getBoundingClientRect();
                    if(
                        clientPoint.clientX >= rect.left &&
                        clientPoint.clientX <= rect.right &&
                        clientPoint.clientY >= rect.top &&
                        clientPoint.clientY <= rect.bottom
                    ){
                        nextHoverSectionId = card.getAttribute('data-section-id');
                    }
                });
                hoveredSectionId = nextHoverSectionId;
                setSectionDropTarget(nextHoverSectionId);
            } else {
                hoveredSectionId = null;
                setSectionDropTarget(null);
            }
        };

        const handleMouseUp = () => {
            setProfileLayoutDraft((previousLayout) => {
                const updatedWidgets = previousLayout.widgets.map((widget) => (
                    widget.id === widgetMoveState.widgetId
                        ? {
                            ...widget,
                            pinned_section: shouldAllowSectionDocking
                                ? (hoveredSectionId || null)
                                : (widget?.pinned_section || null)
                        }
                        : widget
                ));

                if(!isMobileLayoutViewport){
                    const movedWidget = updatedWidgets.find((widget) => widget.id === widgetMoveState.widgetId);
                    const canvas = sectionCanvasRef.current;
                    const canvasWidth = canvas?.getBoundingClientRect?.().width;
                    const resolvedWidgets = movedWidget && !movedWidget.pinned_section
                        ? resolveAllFloatingWidgetOverlaps(updatedWidgets, canvasWidth, {
                            priorityWidgetId: widgetMoveState.widgetId
                        })
                        : updatedWidgets;
                    return {
                        ...previousLayout,
                        widgets: resolvedWidgets
                    };
                }

                return {
                    ...previousLayout,
                    widgets: updatedWidgets
                };
            });
            setWidgetMoveState(null);
            setDraggingWidgetId(null);
            setSectionDropTarget(null);
            if(!showLayoutBuilder){
                triggerAutoSave();
            }
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);

        return () => {
            removeListeners();
        };
    }, [widgetMoveState, showLayoutBuilder, isMobileLayoutViewport]);

    useEffect(() => {
        if(!sectionMoveState){
            return;
        }

        const handleMouseMove = (e) => {
            const clientPoint = getClientPointFromInput(e);
            if(!clientPoint){
                return;
            }
            preventDefaultIfCancelable(e);
            const canvas = sectionCanvasRef.current;
            if(!canvas){
                return;
            }

            const canvasRect = canvas.getBoundingClientRect();
            const sectionNode = canvas.querySelector(`[data-section-id="${sectionMoveState.sectionId}"]`);
            const sectionWidth = sectionNode?.offsetWidth || 260;
            const maxX = Math.max(0, canvasRect.width - sectionWidth - 4);

            const rawX = Math.min(maxX, Math.max(0, sectionMoveState.originX + (clientPoint.clientX - sectionMoveState.startX)));
            const rawY = Math.max(0, sectionMoveState.originY + (clientPoint.clientY - sectionMoveState.startY));
            const snappedX = Math.min(maxX, Math.round(rawX / PROFILE_SECTION_GRID_SIZE) * PROFILE_SECTION_GRID_SIZE);
            const snappedY = Math.max(0, Math.round(rawY / PROFILE_SECTION_GRID_SIZE) * PROFILE_SECTION_GRID_SIZE);

            setProfileLayoutDraft((previousLayout) => ({
                ...previousLayout,
                sections: previousLayout.sections.map((section) => (
                    section.id === sectionMoveState.sectionId
                        ? {...section, x: snappedX, y: snappedY}
                        : section
                ))
            }));
        };

        const handleMouseUp = () => {
            setSectionMoveState(null);
            setDraggingSectionId(null);
            if(!showLayoutBuilder){
                triggerAutoSave();
            }
        };

        const removeListeners = bindGlobalDragListeners(handleMouseMove, handleMouseUp);

        return () => {
            removeListeners();
        };
    }, [sectionMoveState, showLayoutBuilder]);

    //this fucntions are for the bg edit and profile edits

    const handleClickEdit = (e) => {
        e.stopPropagation();
        setShowFontColorSelector(false)
        setEditImagePreview(userData?.image_url)
        setProfileEditName(userData?.name)
        setProfileEditBio(userData?.bio)
        setShowProfileEditor(true)
    }

    const closeEditor = (e) => {
        e.stopPropagation();
        setEditImagePreview('')
        handleHideGradientPicker(e)
        setImageSrc(null)
        setProfileEditAvatar(null);
        setShowProfileEditor(false)
        
    }

    const handleCloseRichTextEditor = useCallback(() =>{
        setShowEditor(false);
    }, [])

    const handleImageOnChange = (e) => {
        const file = e.target.files[0];
        setProfileEditAvatar(file)
        if(file){
            setProfileEditAvatar(file)
            const reader = new FileReader();
            reader.onloadend = () =>{
                setEditImagePreview(reader.result)
            }

            reader.readAsDataURL(file)
        } else {
            setEditImagePreview('')
        }
    }

    const insertImageFromFile = (e) => {
        e.stopPropagation();
        if(inputRef.current){
            inputRef.current.click();
        }
    }

    const handleShowGradientPicker = (e) =>{
        e.stopPropagation();
        setShowBgPicker(true)
    }

    const handleHideGradientPicker = (e) =>{
        e.stopPropagation();
        setShowBgPicker(false)
        setCroppedImage(userData?.background)
        setImageSrc(null)
        setGradientPicked(null)
    }
    const handleSaveProfileEdit = async() =>{
        setIsSavingProfile(true)
        const data = {
            name: profileEditName,
            image: profileEditAvatar,
            bio: profileEditBio,
            profileBg: croppedImage,
            dominantColors: dominantColors,
            secondaryColors: secondaryColors,
        }

        try {
            const formdata = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if(value === undefined || value === null){
                    return;
                }
                if(typeof value === "object" && value !== null && !(value instanceof File)) {
                    formdata.append(key, JSON.stringify(value));
                    return
                }

                formdata.append(key, value)
            })

            await updateProfileData(formdata, session?.access_token)
        } catch {
            throw new Error('error saving update')
        } finally {
            setIsSavingProfile(false)
            setProfileEditAvatar(null)
            queryClient.invalidateQueries({queryKey: ['userData']});
            setShowProfileEditor(false)
        } 
    }

    const handleSaveProfileConfig = async() =>{
        
        try {
            setIsUpdatingProfileConfig(true)
            if(imageSrc){
                const croppedImageUrl = await getCroppedImage(imageSrc, croppedAreaPixels, userData.id);
                if(croppedImageUrl){
                    setCroppedImage({backgroundImage: `url(${croppedImageUrl?.url})`, backgroundSize: 'cover', backgroundPosition : 'center', backgroundRepeat: 'no-repeat'});
                }
            } else if(gradientPicked){
                setCroppedImage(gradientPicked)
            }
            
        } catch {
            throw new Error('error updating profile')
        } finally {
            setIsUpdatingProfileConfig(false)
            setGradientPicked(null);
            setImageSrc(null);
            setShowBgPicker(false)
            queryClient.invalidateQueries({queryKey: ['userData']});
        }   
        
    }

    
    const handleRemoveBgPreview = () =>{
        setImageSrc(null);
    }

    const handleSelectGradient = useCallback((gradient) => {
        setCroppedImage(null);
        setImageSrc(null)
        setGradientPicked(gradient);
    }, [])

    const handleInsertBgImage = (e) =>{
        e.stopPropagation();
        if(bgInputRef.current){
            bgInputRef.current.value = ''
            bgInputRef.current.click();
        }

    }
    const handleBgOnchange = (e) => {
        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.crossOrigin = "anonymous";

                img.src = reader.result;

                img.onload = () => {
                    const colors = extractDominantColors(img);
                    setDominantColors(colors.primary);
                    setSecondaryColors(colors.secondary);
                }
                
                setImageSrc(reader.result)
            }


            reader.readAsDataURL(file);
        } else {
            return setGradientPicked({});
        }
    }

    const handleClickFontColorSelector = (e) =>{
        e.stopPropagation()
        setShowFontColorSelector(true)
    }

    const handleClickInputColor = () =>{
        if(fontColorInputRef.current){
            fontColorInputRef.current.click();
        }
    }

    const handleClickSaveFontColor = async() => {
        setIsUpdatingFont(true)
        const formdata = new FormData();
        formdata.append('fontColor', fontColor)
        try {
            await updateFontColor(session?.access_token, formdata);
            queryClient.invalidateQueries({queryKey: ['userData']});
        } catch {
            throw new Error('error updating font')
        } finally {
            setIsUpdatingFont(false)
            setShowFontColorSelector(false)
        }          
    }

    const hancleClickCancelFontSelect = () => {
        setShowFontColorSelector(false)
        setFontColor('')
    }
    
    useEffect(() => {
            if(!session && !loading){
                return navigate('/login')
                //check if the user has user metadata on the users table database if not then show a UI that let them input there data and save to database
            }

    },[session, loading, navigate])

    useEffect(() => {
        return () => {
            if(autoSaveTimerRef.current){
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, []);
        
    if(isLoading){
        return(
           <Loader/>
        )
    }

    return(
        <>
        <ProfileFontColorSelector
            show={showFontColorSelector}
            fontColor={fontColor}
            fontColorInputRef={fontColorInputRef}
            setFontColor={setFontColor}
            handleClickInputColor={handleClickInputColor}
            hancleClickCancelFontSelect={hancleClickCancelFontSelect}
            handleClickSaveFontColor={handleClickSaveFontColor}
            isUpdatingFont={isUpdatingFont}
        />
        <ProfileBackgroundPicker
            show={showBgPicker}
            handleBgOnchange={handleBgOnchange}
            bgInputRef={bgInputRef}
            gradients={gradients}
            handleSelectGradient={handleSelectGradient}
            handleInsertBgImage={handleInsertBgImage}
            imageSrc={imageSrc}
            crop={crop}
            zoom={zoom}
            setCrop={setCrop}
            setZoom={setZoom}
            setCropAreaPixels={setCropAreaPixels}
            handleRemoveBgPreview={handleRemoveBgPreview}
            handleHideGradientPicker={handleHideGradientPicker}
            handleSaveProfileConfig={handleSaveProfileConfig}
            isUpdatingProfileConfig={isUpdatingProfileConfig}
        />
        <AnimatePresence>
            <ProfileEditModal
                showProfileEditor={showProfileEditor}
                closeEditor={closeEditor}
                croppedImage={croppedImage}
                gradientPicked={gradientPicked}
                insertImageFromFile={insertImageFromFile}
                handleImageOnChange={handleImageOnChange}
                inputRef={inputRef}
                editImagePreview={editImagePreview}
                userData={userData}
                handleShowGradientPicker={handleShowGradientPicker}
                profileEditName={profileEditName}
                setProfileEditName={setProfileEditName}
                profileEditBio={profileEditBio}
                setProfileEditBio={setProfileEditBio}
                handleSaveProfileEdit={handleSaveProfileEdit}
                isSavingProfile={isSavingProfile}
            />

            {showEditor && (
                <Editor key={'main-editor'} onClose={handleCloseRichTextEditor}/>
            )}
            

            <div
            className="profile-parent-container"
            style={croppedImage ? {background:`linear-gradient(135deg, ${dominantColors}0%, ${secondaryColors} 100%)`} : gradientPicked}
            onClick={() => {
                setActiveSectionId(null);
                setActiveWidgetId(null);
                setActiveBlockImageState(null);
            }}
            >
                {gradientPicked && (
                    <div className="blurred-gradient-bg" style={gradientPicked}/>
                )}

                {croppedImage && (
                    <div 
                        style={croppedImage} 
                        className="blurred-img-bg"
                    />
                )}
                
                    
                <div className="side-bar-holder-container">
                    <Sidebar links={links}/> {/*passing the setShowEditor to this component to be used as a state setter inside this component*/}
                </div>

                <div style={{color:fontColor || userData?.profile_font_color}} className="profile-center-bar-container">
                    <ProfileHeroSection
                        userData={userData}
                        user={user}
                        fontColor={fontColor}
                        handleClickEdit={handleClickEdit}
                        handleAddWidget={handleAddWidget}
                        showLayoutBuilder={showLayoutBuilder}
                        triggerAutoSave={triggerAutoSave}
                        handleClickFontColorSelector={handleClickFontColorSelector}
                        croppedImage={croppedImage}
                        gradientPicked={gradientPicked}
                    />

                    <ProfileLayoutCanvas
                        sectionCanvasRef={sectionCanvasRef}
                        showLayoutBuilder={showLayoutBuilder}
                        sectionCanvasHeight={resolvedSectionCanvasHeight}
                        visibleProfileSections={renderedVisibleProfileSections}
                        getProfileSectionSize={getProfileSectionSize}
                        draggingSectionId={draggingSectionId}
                        activeSectionId={activeSectionId}
                        activeWidgetId={activeWidgetId}
                        sectionDropTarget={sectionDropTarget}
                        floatingProfileWidgets={renderedFloatingProfileWidgets}
                        draggingWidgetId={draggingWidgetId}
                        widgetResizeState={widgetResizeState}
                        widgetHeightResizeState={widgetHeightResizeState}
                        blockResizeState={blockResizeState}
                        widgetUploadingState={widgetUploadingState}
                        selectedBlockId={selectedBlockId}
                        editingWidgetId={editingWidgetId}
                        blockUploadingState={blockUploadingState}
                        widgetImageResizeState={widgetImageResizeState}
                        blockImageResizeState={blockImageResizeState}
                        activeBlockImageState={activeBlockImageState}
                        pinnedWidgetsBySection={renderedPinnedWidgetsBySection}
                        isMobileLayoutViewport={isMobileLayoutViewport}
                        mobileCanvasWidth={projectedLayoutForMobile?.canvasWidth || null}
                        user={user}
                        userData={userData}
                        setActiveWidgetId={setActiveWidgetId}
                        setActiveSectionId={setActiveSectionId}
                        setSectionDropTarget={setSectionDropTarget}
                        setDraggingWidgetId={setDraggingWidgetId}
                        setSelectedBlockId={setSelectedBlockId}
                        setEditingWidgetId={setEditingWidgetId}
                        setActiveBlockImageState={setActiveBlockImageState}
                        widgetColorInputRefs={widgetColorInputRefs}
                        widgetImageInputRefs={widgetImageInputRefs}
                        blockColorInputRefs={blockColorInputRefs}
                        blockImageInputRefs={blockImageInputRefs}
                        handleDropWidgetToSection={handleDropWidgetToSection}
                        handleStartSectionContainerMove={handleStartSectionContainerMove}
                        handleStartSectionResize={handleStartSectionResize}
                        handleStartSectionHeightResize={handleStartSectionHeightResize}
                        handleWidgetDragStart={handleWidgetDragStart}
                        handleStartWidgetContainerInteraction={handleStartWidgetContainerInteraction}
                        handleUndockWidget={handleUndockWidget}
                        handleRemoveWidget={handleRemoveWidget}
                        handleStartWidgetHeightResize={handleStartWidgetHeightResize}
                        handleStartWidgetResize={handleStartWidgetResize}
                        handleStartWidgetCornerResize={handleStartWidgetCornerResize}
                        handleDeleteWidgetImage={handleDeleteWidgetImage}
                        handleStartWidgetImageResize={handleStartWidgetImageResize}
                        handleAddBlock={handleAddBlock}
                        handleConvertToBlocks={handleConvertToBlocks}
                        handleWidgetFieldChange={handleWidgetFieldChange}
                        handleOpenWidgetImagePicker={handleOpenWidgetImagePicker}
                        handleWidgetImageUpload={handleWidgetImageUpload}
                        handleRemoveBlock={handleRemoveBlock}
                        handleBlockFieldChange={handleBlockFieldChange}
                        handleOpenBlockColorPicker={handleOpenBlockColorPicker}
                        handleBlockColorChange={handleBlockColorChange}
                        handleOpenBlockImagePicker={handleOpenBlockImagePicker}
                        handleDeleteBlockImage={handleDeleteBlockImage}
                        handleBlockImageUpload={handleBlockImageUpload}
                        handleOpenWidgetColorPicker={handleOpenWidgetColorPicker}
                        handleWidgetColorChange={handleWidgetColorChange}
                        handleToggleWidgetEdit={handleToggleWidgetEdit}
                        handleConfirmWidgetEdit={handleConfirmWidgetEdit}
                        handleCancelWidgetEdit={handleCancelWidgetEdit}
                        handleStartBlockDrag={handleStartBlockDrag}
                        handleStartBlockResize={handleStartBlockResize}
                        handleResetBlockImageSize={handleResetBlockImageSize}
                        handleStartBlockImageResize={handleStartBlockImageResize}
                        triggerAutoSave={triggerAutoSave}
                    />
                    {showLayoutBuilder && (
                        <div className="profile-layout-builder-actions">
                            <div onClick={(e) => handleCloseLayoutBuilder(e)} className="cancel-button">Cancel</div>
                            <div onClick={() => handleSaveProfileLayout()} className="save-button">Save</div>
                        </div>
                    )}

                    {showLayoutBuilder && isSavingLayout && (
                        <BarLoader loading={isSavingLayout} width={'100%'} color="rgb(40, 115, 255)" speedMultiplier={0.7}/>
                    )}
                    <ProfileTabList tablists={tablists} navigate={navigate} location={location} />

                    <Outlet/>
                </div>

                <div className="profile-sidebar-right-holder-container">
                    {/* Log out */}
                </div>

                {/* hide and show sidebar through boolean */}
                {showMobileSideBar && ( 
                    <MobileSidebarLink onclose={handleCloseSidebar}/>
                )}

                <MobileNavlink clickOpenSidebar={handleClickOpenSidebar}/>
                <WriteJournalButton onOpen={opendRichTextEditor}/>
            </div>
        </AnimatePresence>
        </>
    )
}
export default MyProfile;
