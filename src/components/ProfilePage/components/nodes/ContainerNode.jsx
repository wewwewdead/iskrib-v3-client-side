import React, { useCallback, useEffect, useRef, useState } from "react";
import { DecoratorNode, createCommand } from "lexical";
import { uploadNotesImage } from "../../../../../API/Api";

export const INSERT_CONTAINER_COMMAND = createCommand("INSERT_CONTAINER_COMMAND");
export const REMOVE_CONTAINER_COMMAND = createCommand("REMOVE_CONTAINER_COMMAND");
const INLINE_HEADING_CLASS = {
    h1: "inner-inline-heading-h1",
    h2: "inner-inline-heading-h2",
};
const ALLOWED_RICH_TEXT_TAGS = new Set([
    "b",
    "strong",
    "i",
    "em",
    "u",
    "br",
    "span",
    "div",
    "p",
    "h1",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
]);
const ALLOWED_INLINE_CLASSES = new Set([INLINE_HEADING_CLASS.h1, INLINE_HEADING_CLASS.h2]);
const ALLOWED_INLINE_STYLE_RULES = {
    "font-weight": new Set(["bold", "700", "800", "900"]),
    "font-style": new Set(["italic"]),
    "text-decoration": new Set(["underline"]),
};

const escapeHtml = (value = "") =>
    value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#39;");

const sanitizeInlineRichTextHtml = (value = "") => {
    if (typeof window === "undefined") return value;

    const template = window.document.createElement("template");
    template.innerHTML = value;

    const sanitizeNode = (node) => {
        const children = Array.from(node.childNodes);
        children.forEach((child) => {
            if (child.nodeType === window.Node.COMMENT_NODE) {
                node.removeChild(child);
                return;
            }

            if (child.nodeType !== window.Node.ELEMENT_NODE) {
                return;
            }

            const tagName = child.tagName.toLowerCase();
            if (!ALLOWED_RICH_TEXT_TAGS.has(tagName)) {
                const fragment = window.document.createDocumentFragment();
                while (child.firstChild) {
                    fragment.appendChild(child.firstChild);
                }
                node.replaceChild(fragment, child);
                sanitizeNode(node);
                return;
            }

            Array.from(child.attributes).forEach((attribute) => {
                if (tagName === "span" && attribute.name === "class") {
                    const safeClasses = attribute.value
                        .split(/\s+/)
                        .filter((name) => ALLOWED_INLINE_CLASSES.has(name));
                    child.removeAttribute("class");
                    if (safeClasses.length > 0) {
                        child.setAttribute("class", safeClasses.join(" "));
                    }
                    return;
                }

                if (tagName === "span" && attribute.name === "style") {
                    const safeStyleDeclarations = attribute.value
                        .split(";")
                        .map((part) => part.trim())
                        .filter(Boolean)
                        .map((part) => {
                            const [rawName, rawValue] = part.split(":");
                            if (!rawName || !rawValue) return null;
                            const name = rawName.trim().toLowerCase();
                            const value = rawValue.trim().toLowerCase();
                            const allowedValues = ALLOWED_INLINE_STYLE_RULES[name];
                            if (!allowedValues || !allowedValues.has(value)) return null;
                            return `${name}:${value}`;
                        })
                        .filter(Boolean);

                    child.removeAttribute("style");
                    if (safeStyleDeclarations.length > 0) {
                        child.setAttribute("style", safeStyleDeclarations.join(";"));
                    }
                    return;
                }
                child.removeAttribute(attribute.name);
            });

            sanitizeNode(child);
        });
    };

    sanitizeNode(template.content);
    return template.innerHTML;
};

const normalizeTextContent = (value = "") => {
    const raw = typeof value === "string" ? value : "";
    const containsHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
    if (containsHtml) {
        return sanitizeInlineRichTextHtml(raw);
    }
    return escapeHtml(raw).replace(/\n/g, "<br>");
};

const isRichTextEmpty = (value = "") => {
    if (typeof window === "undefined") return !value?.trim();
    const div = window.document.createElement("div");
    div.innerHTML = value;
    const textValue = div.textContent?.replace(/\u00a0/g, " ").trim() || "";
    return textValue.length === 0 && div.querySelector("img, video, iframe") === null;
};

const placeCaretAtEnd = (element) => {
    if (typeof window === "undefined" || !element) return;
    const range = window.document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
};

const findClosestHeadingSpan = (node, editorRoot, headingClassName) => {
    let current = node?.nodeType === window.Node.ELEMENT_NODE ? node : node?.parentElement;
    while (current && current !== editorRoot) {
        if (
            current.nodeType === window.Node.ELEMENT_NODE &&
            current.tagName.toLowerCase() === "span" &&
            current.classList.contains(headingClassName)
        ) {
            return current;
        }
        current = current.parentElement;
    }
    return null;
};

const unwrapElementPreservingChildren = (element) => {
    if (!element?.parentNode) return [];
    const parent = element.parentNode;
    const movedChildren = Array.from(element.childNodes);
    movedChildren.forEach((child) => {
        parent.insertBefore(child, element);
    });
    parent.removeChild(element);
    return movedChildren;
};

const normalizeImageDimension = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        return null;
    }
    return Math.round(numericValue);
};

const normalizeImageOffset = (value) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return 0;
    }
    return Math.round(numericValue);
};

const buildImageLayouts = ({
    imageUrl,
    imageUrls,
    imageWidth,
    imageHeight,
    imageOffsetX,
    imageOffsetY,
    imageWidths,
    imageHeights,
    imageOffsetXs,
    imageOffsetYs,
}) => {
    const safeImageUrls = Array.isArray(imageUrls) && imageUrls.length > 0
        ? imageUrls.filter(Boolean)
        : (imageUrl ? [imageUrl] : []);

    const safeWidths = Array.isArray(imageWidths) ? imageWidths : null;
    const safeHeights = Array.isArray(imageHeights) ? imageHeights : null;
    const safeOffsetXs = Array.isArray(imageOffsetXs) ? imageOffsetXs : null;
    const safeOffsetYs = Array.isArray(imageOffsetYs) ? imageOffsetYs : null;

    const layouts = safeImageUrls.map((_, index) => ({
        width: normalizeImageDimension(safeWidths ? safeWidths[index] : (index === 0 ? imageWidth : null)),
        height: normalizeImageDimension(safeHeights ? safeHeights[index] : (index === 0 ? imageHeight : null)),
        offsetX: normalizeImageOffset(safeOffsetXs ? safeOffsetXs[index] : (index === 0 ? imageOffsetX : 0)),
        offsetY: normalizeImageOffset(safeOffsetYs ? safeOffsetYs[index] : (index === 0 ? imageOffsetY : 0)),
    }));

    return { safeImageUrls, layouts };
};

const ContainerComponent = ({
    nodeKey,
    bgColor,
    borderColor,
    borderWidth,
    borderStyle,
    borderRadius,
    textContent,
    textAlign,
    fontWeight,
    fontSize,
    fontColor,
    fontStyle,
    textDecoration,
    containerWidth,
    containerHeight,
    imageUrl,
    imageUrls,
    imageWidth,
    imageHeight,
    imageOffsetX,
    imageOffsetY,
    imageWidths,
    imageHeights,
    imageOffsetXs,
    imageOffsetYs,
    textOffsetX,
    textOffsetY,
    offsetX,
    offsetY,
    isEditable,
    session,
    addUploadedImagePath,
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizingImage, setIsResizingImage] = useState(false);
    const [isDraggingImage, setIsDraggingImage] = useState(false);
    const [isDraggingText, setIsDraggingText] = useState(false);
    const [isImageSelected, setIsImageSelected] = useState(false);
    const [showStylePopup, setShowStylePopup] = useState(false);
    const [showToolbar, setShowToolbar] = useState(false);
    const [text, setText] = useState(normalizeTextContent(textContent || ""));
    const [{ safeImageUrls: initialImageUrls, layouts: initialImageLayouts }] = useState(() => (
        buildImageLayouts({
            imageUrl,
            imageUrls,
            imageWidth,
            imageHeight,
            imageOffsetX,
            imageOffsetY,
            imageWidths,
            imageHeights,
            imageOffsetXs,
            imageOffsetYs,
        })
    ));
    const [imgSrcList, setImgSrcList] = useState(initialImageUrls);
    const [imageLayouts, setImageLayouts] = useState(initialImageLayouts);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [imgLoading, setImgLoading] = useState(false);
    const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1024));
    const [styles, setStyles] = useState({
        bgColor,
        borderColor,
        borderWidth,
        borderStyle,
        borderRadius,
        textAlign,
        fontWeight,
        fontSize,
        fontColor,
        fontStyle,
        textDecoration,
        containerWidth,
        containerHeight,
        imageWidth,
        imageHeight,
        imageOffsetX,
        imageOffsetY,
        textOffsetX,
        textOffsetY,
        offsetX,
        offsetY,
    });
    const textEditorRef = useRef(null);
    const textDisplayRef = useRef(null);
    const containerRef = useRef(null);
    const toolbarRef = useRef(null);
    const controlsRef = useRef(null);
    const imageWrapRefs = useRef({});
    const dragRef = useRef(null);
    const imageResizeRef = useRef(null);
    const imageDragRef = useRef(null);
    const textDragRef = useRef(null);
    const stylesRef = useRef(styles);
    const imgSrcListRef = useRef(imgSrcList);
    const imageLayoutsRef = useRef(imageLayouts);

    useEffect(() => {
        stylesRef.current = styles;
    }, [styles]);

    useEffect(() => {
        imgSrcListRef.current = imgSrcList;
    }, [imgSrcList]);

    useEffect(() => {
        imageLayoutsRef.current = imageLayouts;
    }, [imageLayouts]);

    useEffect(() => {
        const { safeImageUrls, layouts } = buildImageLayouts({
            imageUrl,
            imageUrls,
            imageWidth,
            imageHeight,
            imageOffsetX,
            imageOffsetY,
            imageWidths,
            imageHeights,
            imageOffsetXs,
            imageOffsetYs,
        });

        setImgSrcList(safeImageUrls);
        setImageLayouts(layouts);
        setActiveImageIndex((prev) => (
            safeImageUrls.length === 0 ? 0 : Math.min(prev, safeImageUrls.length - 1)
        ));
    }, [imageHeight, imageHeights, imageOffsetX, imageOffsetXs, imageOffsetY, imageOffsetYs, imageUrl, imageUrls, imageWidth, imageWidths]);

    useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const handleOutsideImageClick = (e) => {
            const target = e.target;
            if (
                target instanceof Element &&
                containerRef.current?.contains(target) &&
                target.closest(".inner-container-img-wrap")
            ) {
                return;
            }
            setIsImageSelected(false);
        };

        document.addEventListener("pointerdown", handleOutsideImageClick);
        return () => document.removeEventListener("pointerdown", handleOutsideImageClick);
    }, []);

    useEffect(() => {
        if (!showToolbar) return;

        const handleOutsideToolbarClick = (e) => {
            const target = e.target;
            const clickedInsideAnyNoteInnerContainer =
                target instanceof Element &&
                !!target.closest(".inline-note-content-editable .note-inner-container, .readonly-note-content .note-inner-container");

            if (
                controlsRef.current?.contains(e.target) ||
                toolbarRef.current?.contains(e.target) ||
                clickedInsideAnyNoteInnerContainer
            ) {
                return;
            }
            setShowToolbar(false);
        };

        document.addEventListener("pointerdown", handleOutsideToolbarClick);
        return () => document.removeEventListener("pointerdown", handleOutsideToolbarClick);
    }, [showToolbar]);

    const dispatchUpdate = useCallback((updatedText, updatedStyles, updatedImgUrlOrList, updatedImageLayouts) => {
        const resolvedImageUrls = Array.isArray(updatedImgUrlOrList)
            ? updatedImgUrlOrList.filter(Boolean)
            : typeof updatedImgUrlOrList === "string"
                ? (updatedImgUrlOrList ? [updatedImgUrlOrList] : [])
                : imgSrcListRef.current;

        const baseLayouts = Array.isArray(updatedImageLayouts)
            ? updatedImageLayouts
            : imageLayoutsRef.current;

        const resolvedLayouts = resolvedImageUrls.map((_, index) => {
            const currentLayout = baseLayouts[index] || {};
            return {
                width: normalizeImageDimension(currentLayout.width),
                height: normalizeImageDimension(currentLayout.height),
                offsetX: normalizeImageOffset(currentLayout.offsetX),
                offsetY: normalizeImageOffset(currentLayout.offsetY),
            };
        });
        const firstLayout = resolvedLayouts[0] || { width: null, height: null, offsetX: 0, offsetY: 0 };

        const event = new CustomEvent("container-update", {
            detail: {
                nodeKey,
                text: updatedText,
                ...updatedStyles,
                imageUrl: resolvedImageUrls[0] || "",
                imageUrls: resolvedImageUrls,
                imageWidth: firstLayout.width,
                imageHeight: firstLayout.height,
                imageOffsetX: firstLayout.offsetX,
                imageOffsetY: firstLayout.offsetY,
                imageWidths: resolvedLayouts.map((layout) => layout.width),
                imageHeights: resolvedLayouts.map((layout) => layout.height),
                imageOffsetXs: resolvedLayouts.map((layout) => layout.offsetX),
                imageOffsetYs: resolvedLayouts.map((layout) => layout.offsetY),
            },
        });
        window.dispatchEvent(event);
    }, [nodeKey]);

    const handleTextSave = useCallback(() => {
        if (isEditing && textEditorRef.current) {
            const sanitizedHtml = sanitizeInlineRichTextHtml(textEditorRef.current.innerHTML || "");
            const nextText = isRichTextEmpty(sanitizedHtml) ? "" : sanitizedHtml;
            if (textEditorRef.current.innerHTML !== nextText) {
                textEditorRef.current.innerHTML = nextText;
            }
            setText(nextText);
            dispatchUpdate(nextText, stylesRef.current, imgSrcList);
        }
        setIsEditing(false);
    }, [dispatchUpdate, imgSrcList, isEditing]);

    const handleStyleChange = (key, value) => {
        const newStyles = { ...styles, [key]: value };
        setStyles(newStyles);
        dispatchUpdate(text, newStyles, imgSrcList);
    };

    const syncTextFromEditor = useCallback(() => {
        if (!textEditorRef.current) return;
        const sanitizedHtml = sanitizeInlineRichTextHtml(textEditorRef.current.innerHTML || "");
        const nextText = isRichTextEmpty(sanitizedHtml) ? "" : sanitizedHtml;
        if (textEditorRef.current.innerHTML !== nextText) {
            textEditorRef.current.innerHTML = nextText;
        }
        setText(nextText);
        dispatchUpdate(nextText, stylesRef.current, imgSrcList);
    }, [dispatchUpdate, imgSrcList]);

    useEffect(() => {
        if (!isEditing || !textEditorRef.current) return;
        const initialValue = text || "";
        textEditorRef.current.innerHTML = initialValue;
        textEditorRef.current.focus();
        placeCaretAtEnd(textEditorRef.current);
    }, [isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

    const runInlineTextCommand = useCallback((e, command) => {
        e.preventDefault();
        e.stopPropagation();
        if (!textEditorRef.current) {
            setIsEditing(true);
            return;
        }
        textEditorRef.current.focus();
        document.execCommand(command, false, null);
        syncTextFromEditor();
    }, [syncTextFromEditor]);

    const applyInlineHeading = useCallback((e, level) => {
        e.preventDefault();
        e.stopPropagation();

        const editorEl = textEditorRef.current;
        if (!editorEl) {
            setIsEditing(true);
            return;
        }

        editorEl.focus();

        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        if (!editorEl.contains(range.commonAncestorContainer)) return;

        const headingClassName = level === 1 ? INLINE_HEADING_CLASS.h1 : INLINE_HEADING_CLASS.h2;
        const activeStartHeading = findClosestHeadingSpan(range.startContainer, editorEl, headingClassName);
        const activeEndHeading = findClosestHeadingSpan(range.endContainer, editorEl, headingClassName);
        const shouldToggleOff = !!activeStartHeading && activeStartHeading === activeEndHeading;

        if (shouldToggleOff) {
            const movedChildren = unwrapElementPreservingChildren(activeStartHeading);
            if (movedChildren.length > 0) {
                const resetRange = window.document.createRange();
                if (range.collapsed) {
                    resetRange.setStartAfter(movedChildren[movedChildren.length - 1]);
                    resetRange.collapse(true);
                } else {
                    resetRange.setStartBefore(movedChildren[0]);
                    resetRange.setEndAfter(movedChildren[movedChildren.length - 1]);
                }
                selection.removeAllRanges();
                selection.addRange(resetRange);
            }
            syncTextFromEditor();
            return;
        }

        if (range.collapsed) return;

        const span = window.document.createElement("span");
        span.className = headingClassName;

        try {
            range.surroundContents(span);
        } catch {
            const fragment = range.extractContents();
            span.appendChild(fragment);
            range.insertNode(span);
        }

        selection.removeAllRanges();
        const updatedRange = window.document.createRange();
        updatedRange.selectNodeContents(span);
        selection.addRange(updatedRange);
        syncTextFromEditor();
    }, [syncTextFromEditor]);

    const handleEditorPaste = useCallback((e) => {
        e.stopPropagation();
        window.requestAnimationFrame(() => {
            syncTextFromEditor();
        });
    }, [syncTextFromEditor]);

    const getClientPosition = useCallback((event) => {
        if (event?.touches?.[0]) {
            return {
                clientX: event.touches[0].clientX,
                clientY: event.touches[0].clientY,
            };
        }
        if (event?.changedTouches?.[0]) {
            return {
                clientX: event.changedTouches[0].clientX,
                clientY: event.changedTouches[0].clientY,
            };
        }
        return {
            clientX: event.clientX,
            clientY: event.clientY,
        };
    }, []);

    const handleDragStart = useCallback((e) => {
        if (typeof e.button === "number" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        if (isEditing) {
            syncTextFromEditor();
        }
        const { clientX, clientY } = getClientPosition(e);
        dragRef.current = {
            startClientX: clientX,
            startClientY: clientY,
            startOffsetX: Number(stylesRef.current.offsetX) || 0,
            startOffsetY: Number(stylesRef.current.offsetY) || 0,
            pointerId: typeof e.pointerId === "number" ? e.pointerId : null,
        };
        setShowStylePopup(false);
        setIsEditing(false);
        setIsDragging(true);
    }, [getClientPosition, isEditing, syncTextFromEditor]);

    useEffect(() => {
        if (!isDragging) return undefined;

        const handleDragMove = (e) => {
            const dragState = dragRef.current;
            if (!dragState) return;
            if (dragState.pointerId !== null && e.pointerId !== dragState.pointerId) return;
            const { clientX, clientY } = getClientPosition(e);
            let nextOffsetX = dragState.startOffsetX + (clientX - dragState.startClientX);
            let nextOffsetY = dragState.startOffsetY + (clientY - dragState.startClientY);

            const nodeEl = containerRef.current;
            const boundsEl =
                nodeEl?.closest(".profile-note-container") ||
                nodeEl?.closest(".inline-note-content-editable");

            if (nodeEl && boundsEl) {
                const nodeRect = nodeEl.getBoundingClientRect();
                const boundsRect = boundsEl.getBoundingClientRect();
                const currentOffsetX = Number(stylesRef.current.offsetX) || 0;
                const currentOffsetY = Number(stylesRef.current.offsetY) || 0;

                // Compute movement limits from the node's un-translated base position.
                const baseLeft = nodeRect.left - currentOffsetX;
                const baseTop = nodeRect.top - currentOffsetY;
                const minOffsetX = boundsRect.left - baseLeft;
                const maxOffsetX = boundsRect.right - (baseLeft + nodeRect.width);
                const minOffsetY = boundsRect.top - baseTop;
                const maxOffsetY = boundsRect.bottom - (baseTop + nodeRect.height);

                nextOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, nextOffsetX));
                nextOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, nextOffsetY));
            }

            setStyles((prev) => {
                const updated = {
                    ...prev,
                    offsetX: nextOffsetX,
                    offsetY: nextOffsetY,
                };
                stylesRef.current = updated;
                return updated;
            });
        };

        const handleDragEnd = (e) => {
            if (!dragRef.current) return;
            if (dragRef.current.pointerId !== null && e?.pointerId !== undefined && e.pointerId !== dragRef.current.pointerId) {
                return;
            }
            dragRef.current = null;
            setIsDragging(false);
            dispatchUpdate(text, stylesRef.current, imgSrcList);
        };

        window.addEventListener("pointermove", handleDragMove);
        window.addEventListener("pointerup", handleDragEnd);
        window.addEventListener("pointercancel", handleDragEnd);

        return () => {
            window.removeEventListener("pointermove", handleDragMove);
            window.removeEventListener("pointerup", handleDragEnd);
            window.removeEventListener("pointercancel", handleDragEnd);
        };
    }, [isDragging, dispatchUpdate, text, imgSrcList, getClientPosition]);

    const handleTextDragStart = useCallback((e) => {
        if (typeof e.button === "number" && e.button !== 0) return;
        if (!textDisplayRef.current || isEditing) return;
        e.preventDefault();
        e.stopPropagation();

        const { clientX, clientY } = getClientPosition(e);
        textDragRef.current = {
            startClientX: clientX,
            startClientY: clientY,
            startOffsetX: Number(stylesRef.current.textOffsetX) || 0,
            startOffsetY: Number(stylesRef.current.textOffsetY) || 0,
            pointerId: typeof e.pointerId === "number" ? e.pointerId : null,
            hasMoved: false,
        };
        setIsDraggingText(true);
    }, [getClientPosition, isEditing]);

    useEffect(() => {
        if (!isDraggingText) return undefined;

        const handleTextDragMove = (e) => {
            const dragState = textDragRef.current;
            const textEl = textDisplayRef.current;
            if (!dragState || !textEl || !containerRef.current) return;
            if (dragState.pointerId !== null && e.pointerId !== dragState.pointerId) return;

            const { clientX, clientY } = getClientPosition(e);
            const dx = clientX - dragState.startClientX;
            const dy = clientY - dragState.startClientY;

            if (!dragState.hasMoved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
                dragState.hasMoved = true;
            }

            let nextOffsetX = dragState.startOffsetX + dx;
            let nextOffsetY = dragState.startOffsetY + dy;

            const textRect = textEl.getBoundingClientRect();
            const boundsRect = containerRef.current.getBoundingClientRect();
            const currentOffsetX = Number(stylesRef.current.textOffsetX) || 0;
            const currentOffsetY = Number(stylesRef.current.textOffsetY) || 0;
            const baseLeft = textRect.left - currentOffsetX;
            const baseTop = textRect.top - currentOffsetY;
            const minOffsetX = boundsRect.left - baseLeft;
            const maxOffsetX = boundsRect.right - (baseLeft + textRect.width);
            const minOffsetY = boundsRect.top - baseTop;
            const maxOffsetY = boundsRect.bottom - (baseTop + textRect.height);

            nextOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, nextOffsetX));
            nextOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, nextOffsetY));

            setStyles((prev) => {
                const updated = {
                    ...prev,
                    textOffsetX: Math.round(nextOffsetX),
                    textOffsetY: Math.round(nextOffsetY),
                };
                stylesRef.current = updated;
                return updated;
            });
        };

        const handleTextDragEnd = (e) => {
            const dragState = textDragRef.current;
            if (!dragState) return;
            if (dragState.pointerId !== null && e?.pointerId !== undefined && e.pointerId !== dragState.pointerId) {
                return;
            }

            const shouldOpenEditor = !dragState.hasMoved;
            textDragRef.current = null;
            setIsDraggingText(false);
            dispatchUpdate(text, stylesRef.current, imgSrcListRef.current, imageLayoutsRef.current);

            if (shouldOpenEditor) {
                setIsEditing(true);
            }
        };

        window.addEventListener("pointermove", handleTextDragMove);
        window.addEventListener("pointerup", handleTextDragEnd);
        window.addEventListener("pointercancel", handleTextDragEnd);

        return () => {
            window.removeEventListener("pointermove", handleTextDragMove);
            window.removeEventListener("pointerup", handleTextDragEnd);
            window.removeEventListener("pointercancel", handleTextDragEnd);
        };
    }, [dispatchUpdate, getClientPosition, isDraggingText, text]);

    const handleImageResizeStart = useCallback((direction, imageIndex, e) => {
        if (typeof e.button === "number" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        const wrapEl = imageWrapRefs.current[imageIndex];
        if (!wrapEl) return;
        setIsImageSelected(true);
        setActiveImageIndex(imageIndex);
        const { clientX, clientY } = getClientPosition(e);

        const currentLayout = imageLayoutsRef.current[imageIndex] || {};
        const rect = wrapEl.getBoundingClientRect();
        imageResizeRef.current = {
            imageIndex,
            direction,
            startClientX: clientX,
            startClientY: clientY,
            startWidth: normalizeImageDimension(currentLayout.width) || rect.width,
            startHeight: normalizeImageDimension(currentLayout.height) || rect.height,
            pointerId: typeof e.pointerId === "number" ? e.pointerId : null,
        };
        setIsResizingImage(true);
    }, [getClientPosition]);

    useEffect(() => {
        if (!isResizingImage) return undefined;

        const handleImageResizeMove = (e) => {
            const resizeState = imageResizeRef.current;
            if (!resizeState || !containerRef.current) return;
            if (resizeState.pointerId !== null && e.pointerId !== resizeState.pointerId) return;
            const imageIndex = resizeState.imageIndex;
            const currentLayout = imageLayoutsRef.current[imageIndex];
            if (!currentLayout) return;
            const { clientX, clientY } = getClientPosition(e);

            const dx = clientX - resizeState.startClientX;
            const dy = clientY - resizeState.startClientY;
            const editorEl = containerRef.current.closest(".inline-note-content-editable");
            const maxWidth = Math.max(80, containerRef.current.clientWidth - 24);
            const maxHeight = Math.max(120, editorEl ? editorEl.clientHeight * 2 : 800);
            let nextWidth = normalizeImageDimension(currentLayout.width) || resizeState.startWidth;
            let nextHeight = normalizeImageDimension(currentLayout.height) || resizeState.startHeight;

            if (resizeState.direction === "east") {
                nextWidth = resizeState.startWidth + dx;
            } else if (resizeState.direction === "west") {
                nextWidth = resizeState.startWidth - dx;
            } else if (resizeState.direction === "south") {
                nextHeight = resizeState.startHeight + dy;
            } else if (resizeState.direction === "north") {
                nextHeight = resizeState.startHeight - dy;
            } else if (resizeState.direction === "ne") {
                nextWidth = resizeState.startWidth + dx;
                nextHeight = resizeState.startHeight - dy;
            } else if (resizeState.direction === "nw") {
                nextWidth = resizeState.startWidth - dx;
                nextHeight = resizeState.startHeight - dy;
            } else if (resizeState.direction === "se") {
                nextWidth = resizeState.startWidth + dx;
                nextHeight = resizeState.startHeight + dy;
            } else if (resizeState.direction === "sw") {
                nextWidth = resizeState.startWidth - dx;
                nextHeight = resizeState.startHeight + dy;
            }

            nextWidth = Math.max(80, Math.min(maxWidth, nextWidth));
            nextHeight = Math.max(80, Math.min(maxHeight, nextHeight));

            setImageLayouts((prev) => {
                if (!prev[imageIndex]) return prev;
                const updatedLayouts = [...prev];
                updatedLayouts[imageIndex] = {
                    ...updatedLayouts[imageIndex],
                    width: Math.round(nextWidth),
                    height: Math.round(nextHeight),
                };
                return updatedLayouts;
            });
        };

        const handleImageResizeEnd = (e) => {
            if (!imageResizeRef.current) return;
            if (imageResizeRef.current.pointerId !== null && e?.pointerId !== undefined && e.pointerId !== imageResizeRef.current.pointerId) {
                return;
            }
            imageResizeRef.current = null;
            setIsResizingImage(false);
            dispatchUpdate(text, stylesRef.current, imgSrcListRef.current, imageLayoutsRef.current);
        };

        window.addEventListener("pointermove", handleImageResizeMove);
        window.addEventListener("pointerup", handleImageResizeEnd);
        window.addEventListener("pointercancel", handleImageResizeEnd);

        return () => {
            window.removeEventListener("pointermove", handleImageResizeMove);
            window.removeEventListener("pointerup", handleImageResizeEnd);
            window.removeEventListener("pointercancel", handleImageResizeEnd);
        };
    }, [isResizingImage, dispatchUpdate, text, getClientPosition]);

    const handleImageMoveStart = useCallback((e, imageIndex) => {
        if (typeof e.button === "number" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        setIsImageSelected(true);
        setActiveImageIndex(imageIndex);
        const currentLayout = imageLayoutsRef.current[imageIndex] || {};
        const { clientX, clientY } = getClientPosition(e);
        imageDragRef.current = {
            imageIndex,
            startClientX: clientX,
            startClientY: clientY,
            startOffsetX: normalizeImageOffset(currentLayout.offsetX),
            startOffsetY: normalizeImageOffset(currentLayout.offsetY),
            pointerId: typeof e.pointerId === "number" ? e.pointerId : null,
        };
        setIsDraggingImage(true);
    }, [getClientPosition]);

    useEffect(() => {
        if (!isDraggingImage) return undefined;

        const handleImageMove = (e) => {
            const dragState = imageDragRef.current;
            if (!dragState || !containerRef.current) return;
            if (dragState.pointerId !== null && e.pointerId !== dragState.pointerId) return;
            const imageIndex = dragState.imageIndex;
            const wrapEl = imageWrapRefs.current[imageIndex];
            if (!wrapEl) return;
            const { clientX, clientY } = getClientPosition(e);

            const dx = clientX - dragState.startClientX;
            const dy = clientY - dragState.startClientY;
            let nextOffsetX = dragState.startOffsetX + dx;
            let nextOffsetY = dragState.startOffsetY + dy;

            const wrapRect = wrapEl.getBoundingClientRect();
            const boundsRect = containerRef.current.getBoundingClientRect();
            const currentOffsetX = normalizeImageOffset((imageLayoutsRef.current[imageIndex] || {}).offsetX);
            const currentOffsetY = normalizeImageOffset((imageLayoutsRef.current[imageIndex] || {}).offsetY);

            // Clamp relative to the image's base (untranslated) position so it can move
            // anywhere inside the container, including upward over previously added images.
            const baseLeft = wrapRect.left - currentOffsetX;
            const baseTop = wrapRect.top - currentOffsetY;
            const minOffsetX = boundsRect.left - baseLeft;
            const maxOffsetX = boundsRect.right - (baseLeft + wrapRect.width);
            const minOffsetY = boundsRect.top - baseTop;
            const maxOffsetY = boundsRect.bottom - (baseTop + wrapRect.height);

            nextOffsetX = Math.max(minOffsetX, Math.min(maxOffsetX, nextOffsetX));
            nextOffsetY = Math.max(minOffsetY, Math.min(maxOffsetY, nextOffsetY));

            setImageLayouts((prev) => {
                if (!prev[imageIndex]) return prev;
                const updatedLayouts = [...prev];
                updatedLayouts[imageIndex] = {
                    ...updatedLayouts[imageIndex],
                    offsetX: Math.round(nextOffsetX),
                    offsetY: Math.round(nextOffsetY),
                };
                return updatedLayouts;
            });
        };

        const handleImageMoveEnd = (e) => {
            if (!imageDragRef.current) return;
            if (imageDragRef.current.pointerId !== null && e?.pointerId !== undefined && e.pointerId !== imageDragRef.current.pointerId) {
                return;
            }
            imageDragRef.current = null;
            setIsDraggingImage(false);
            dispatchUpdate(text, stylesRef.current, imgSrcListRef.current, imageLayoutsRef.current);
        };

        window.addEventListener("pointermove", handleImageMove);
        window.addEventListener("pointerup", handleImageMoveEnd);
        window.addEventListener("pointercancel", handleImageMoveEnd);

        return () => {
            window.removeEventListener("pointermove", handleImageMove);
            window.removeEventListener("pointerup", handleImageMoveEnd);
            window.removeEventListener("pointercancel", handleImageMoveEnd);
        };
    }, [isDraggingImage, dispatchUpdate, text, getClientPosition]);

    const handleRemove = (e) => {
        e.stopPropagation();
        const event = new CustomEvent("container-remove", { detail: { nodeKey } });
        window.dispatchEvent(event);
    };

    const uploadImageForContainer = useCallback(async ({ file }) => {
        const formdata = new FormData();
        formdata.append("image", file);

        try {
            const data = await uploadNotesImage(session?.access_token, formdata);
            if (!data?.img_url) {
                return null;
            }

            const filePath = data.img_url.split("/profile-notes-images/").pop();
            if (filePath && addUploadedImagePath) {
                addUploadedImagePath(filePath);
            }

            return data.img_url;
        } catch (err) {
            console.error("Container image upload failed:", err);
            return null;
        }
    }, [addUploadedImagePath, session]);

    const handleImageUpload = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.multiple = true;
        input.onchange = async (e) => {
            const selectedFiles = Array.from(e.target.files || []);
            if (selectedFiles.length === 0) return;

            const hadNoImage = imgSrcListRef.current.length === 0;
            const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));
            const mergedPreviewList = [...imgSrcListRef.current, ...previewUrls];
            const mergedLayouts = [
                ...imageLayoutsRef.current,
                ...previewUrls.map(() => ({ width: null, height: null, offsetX: 0, offsetY: 0 })),
            ];

            if (hadNoImage) {
                const nextStyles = {
                    ...stylesRef.current,
                    imageWidth: null,
                    imageHeight: null,
                    imageOffsetX: 0,
                    imageOffsetY: 0,
                };

                setStyles(nextStyles);
                stylesRef.current = nextStyles;
                setImgLoading(true);
            }

            setImgSrcList(mergedPreviewList);
            setImageLayouts(mergedLayouts);
            dispatchUpdate(text, stylesRef.current, mergedPreviewList, mergedLayouts);

            let workingUrls = [...mergedPreviewList];
            let workingLayouts = [...mergedLayouts];
            for (let i = 0; i < selectedFiles.length; i += 1) {
                const file = selectedFiles[i];
                const previewUrl = previewUrls[i];
                const uploadedUrl = await uploadImageForContainer({ file });
                const previewIndex = workingUrls.indexOf(previewUrl);
                if (previewIndex === -1) {
                    if (previewUrl.startsWith("blob:")) {
                        URL.revokeObjectURL(previewUrl);
                    }
                    continue;
                }

                if (uploadedUrl) {
                    workingUrls[previewIndex] = uploadedUrl;
                } else {
                    workingUrls.splice(previewIndex, 1);
                    workingLayouts.splice(previewIndex, 1);
                }

                setImgSrcList([...workingUrls]);
                setImageLayouts([...workingLayouts]);
                dispatchUpdate(text, stylesRef.current, workingUrls, workingLayouts);

                if (previewUrl.startsWith("blob:")) {
                    URL.revokeObjectURL(previewUrl);
                }
            }

            setActiveImageIndex((prev) => (
                workingUrls.length === 0 ? 0 : Math.min(prev, workingUrls.length - 1)
            ));
            if (hadNoImage) {
                setImgLoading(false);
            }
        };
        input.click();
    };

    const handleRemoveImage = (e, imageIndex = 0) => {
        e.stopPropagation();
        setIsImageSelected(false);
        if (imageIndex < 0 || imageIndex >= imgSrcListRef.current.length) {
            return;
        }

        const nextUrls = [...imgSrcListRef.current];
        const nextLayouts = [...imageLayoutsRef.current];
        const removedUrl = nextUrls[imageIndex];
        if (typeof removedUrl === "string" && removedUrl.startsWith("blob:")) {
            URL.revokeObjectURL(removedUrl);
        }
        nextUrls.splice(imageIndex, 1);
        nextLayouts.splice(imageIndex, 1);

        setImgSrcList(nextUrls);
        setImageLayouts(nextLayouts);
        setActiveImageIndex((prev) => (
            nextUrls.length === 0 ? 0 : Math.min(prev, nextUrls.length - 1)
        ));

        if (nextUrls.length === 0) {
            const resetStyles = {
                ...stylesRef.current,
                imageWidth: null,
                imageHeight: null,
                imageOffsetX: 0,
                imageOffsetY: 0,
            };
            setStyles(resetStyles);
            stylesRef.current = resetStyles;
            setImgLoading(false);
            dispatchUpdate(text, resetStyles, [], []);
            return;
        }

        dispatchUpdate(text, stylesRef.current, nextUrls, nextLayouts);
    };

    const rawOffsetX = Number(styles.offsetX) || 0;
    const rawOffsetY = Number(styles.offsetY) || 0;
    const isMobileViewport = viewportWidth <= 768;
    const effectiveOffsetX = isMobileViewport ? 0 : rawOffsetX;
    const effectiveOffsetY = isMobileViewport ? 0 : rawOffsetY;
    const resolvedMinHeight = Number(styles.containerHeight) > 0
        ? `${Number(styles.containerHeight)}px`
        : "28px";
    const resolvedContainerHeight = Number(styles.containerHeight) > 0
        ? `${Number(styles.containerHeight)}px`
        : "auto";

    const containerStyle = {
        backgroundColor: styles.bgColor || "transparent",
        borderColor: styles.borderColor || "transparent",
        borderWidth: `${styles.borderWidth || 0}px`,
        borderStyle: styles.borderStyle || "solid",
        borderRadius: `${styles.borderRadius || 8}px`,
        textAlign: styles.textAlign || "center",
        fontWeight: styles.fontWeight || "700",
        fontSize: `${styles.fontSize || 14}px`,
        color: styles.fontColor || "inherit",
        fontStyle: styles.fontStyle || "normal",
        textDecoration: styles.textDecoration || "none",
        width: styles.containerWidth ? `${styles.containerWidth}%` : "100%",
        height: resolvedContainerHeight,
        minHeight: resolvedMinHeight,
        overflow: "visible",
        padding: "0.5rem 0.75rem",
        marginTop: "6px",
        marginBottom: isMobileViewport ? "6px" : `${Math.max(0, 6 + rawOffsetY)}px`,
        position: "relative",
        transform: `translate(${effectiveOffsetX}px, ${effectiveOffsetY}px)`,
        cursor: isResizingImage ? "ns-resize" : isDraggingImage || isDragging ? "grabbing" : isEditable ? "pointer" : "default",
        transition: isDragging ? "none" : "all 0.15s ease",
    };

    const getImageWrapStyle = (imageIndex) => {
        const layout = imageLayouts[imageIndex] || {};
        const resolvedImageWidth = normalizeImageDimension(layout.width);
        const resolvedImageHeight = normalizeImageDimension(layout.height);
        const resolvedImageOffsetX = normalizeImageOffset(layout.offsetX);
        const resolvedImageOffsetY = normalizeImageOffset(layout.offsetY);

        return {
            width: resolvedImageWidth ? `${resolvedImageWidth}px` : "100%",
            height: resolvedImageHeight ? `${resolvedImageHeight}px` : "auto",
            maxWidth: "100%",
            minHeight: resolvedImageHeight ? `${resolvedImageHeight}px` : (imageIndex === 0 ? undefined : 0),
            transform: `translate(${resolvedImageOffsetX}px, ${resolvedImageOffsetY}px)`,
        };
    };

    const getImageStyle = (imageIndex) => {
        const layout = imageLayouts[imageIndex] || {};
        const resolvedImageHeight = normalizeImageDimension(layout.height);
        return {
            width: "100%",
            height: resolvedImageHeight ? "100%" : "auto",
            objectFit: resolvedImageHeight ? "fill" : "contain",
        };
    };

    const getTextStyle = ({ editable = false, draggable = false } = {}) => {
        const resolvedTextOffsetX = Number(styles.textOffsetX) || 0;
        const resolvedTextOffsetY = Number(styles.textOffsetY) || 0;

        return {
            transform: `translate(${resolvedTextOffsetX}px, ${resolvedTextOffsetY}px)`,
            cursor: editable ? "text" : (draggable ? (isDraggingText ? "grabbing" : "grab") : "inherit"),
            touchAction: editable ? "auto" : (draggable ? "none" : "auto"),
            userSelect: editable ? undefined : (draggable ? "none" : undefined),
        };
    };

    const toggleBold = (e) => {
        runInlineTextCommand(e, "bold");
    };

    const toggleItalic = (e) => {
        runInlineTextCommand(e, "italic");
    };

    const toggleUnderline = (e) => {
        runInlineTextCommand(e, "underline");
    };

    const setContainerHeading = (e, level) => {
        applyInlineHeading(e, level);
    };

    const setContainerAlign = (e, align) => {
        e.stopPropagation();
        handleStyleChange("textAlign", align);
    };

    // Read-only view
    if (!isEditable) {
        return (
            <div ref={containerRef} style={containerStyle} className="note-inner-container">
                {imgSrcList.map((src, index) => (
                    <div
                        key={`${src}-${index}`}
                        className="inner-container-img-wrap"
                        style={getImageWrapStyle(index)}
                    >
                        <img
                            src={src}
                            alt=""
                            className="inner-container-img"
                            style={getImageStyle(index)}
                        />
                    </div>
                ))}
                {isRichTextEmpty(text) ? (
                    <div className="inner-container-text-display" style={getTextStyle()}>&nbsp;</div>
                ) : (
                    <div
                        className="inner-container-text-display"
                        style={getTextStyle()}
                        dangerouslySetInnerHTML={{ __html: text }}
                    />
                )}
            </div>
        );
    }

    return (
        <div ref={containerRef} style={containerStyle} className={`note-inner-container${isDragging ? " is-dragging" : ""}`}>
            {/* Toggle button — always visible on hover */}
            <div ref={controlsRef} className="inner-container-controls" onClick={(e) => e.stopPropagation()}>
                <button
                    className={`inner-container-control-btn toolbar-toggle-btn${showToolbar ? " is-active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); setShowToolbar(!showToolbar); }}
                    title={showToolbar ? "Hide toolbar" : "Show toolbar"}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="currentColor">
                        <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-480H200v480Z" />
                    </svg>
                </button>
                {/* Delete button — always accessible */}
                <button
                    className="inner-container-control-btn inner-container-delete-btn"
                    onClick={handleRemove}
                    title="Remove container"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="currentColor">
                        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                    </svg>
                </button>
            </div>

            {/* Full toolbar — shown when toggled */}
            {showToolbar && (
                <div ref={toolbarRef} className="inline-note-toolbar" onClick={(e) => e.stopPropagation()}>
                    {/* Drag handle */}
                    <button
                        className="inner-container-control-btn inner-container-drag-btn"
                        onPointerDown={handleDragStart}
                        title="Drag container"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="currentColor">
                            <path d="M320-120q-33 0-56.5-23.5T240-200q0-33 23.5-56.5T320-280q33 0 56.5 23.5T400-200q0 33-23.5 56.5T320-120Zm0-280q-33 0-56.5-23.5T240-480q0-33 23.5-56.5T320-560q33 0 56.5 23.5T400-480q0 33-23.5 56.5T320-400Zm0-280q-33 0-56.5-23.5T240-760q0-33 23.5-56.5T320-840q33 0 56.5 23.5T400-760q0 33-23.5 56.5T320-680Zm320 560q-33 0-56.5-23.5T560-200q0-33 23.5-56.5T640-280q33 0 56.5 23.5T720-200q0 33-23.5 56.5T640-120Zm0-280q-33 0-56.5-23.5T560-480q0-33 23.5-56.5T640-560q33 0 56.5 23.5T720-480q0 33-23.5 56.5T640-400Zm0-280q-33 0-56.5-23.5T560-760q0-33 23.5-56.5T640-840q33 0 56.5 23.5T720-760q0 33-23.5 56.5T640-680Z" />
                        </svg>
                    </button>
                    <button
                        className="inner-container-control-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={toggleBold}
                        title="Bold"
                    >
                        <span style={{ fontSize: "9px", fontWeight: 700 }}>B</span>
                    </button>
                    <button
                        className="inner-container-control-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={toggleItalic}
                        title="Italic"
                    >
                        <span style={{ fontSize: "9px", fontStyle: "italic", fontWeight: 700 }}>I</span>
                    </button>
                    <button
                        className="inner-container-control-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={toggleUnderline}
                        title="Underline"
                    >
                        <span style={{ fontSize: "9px", textDecoration: "underline", fontWeight: 700 }}>U</span>
                    </button>
                    <button
                        className="inner-container-control-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => setContainerHeading(e, 1)}
                        title="Heading 1"
                    >
                        <span style={{ fontSize: "9px", fontWeight: 700 }}>H1</span>
                    </button>
                    <button
                        className="inner-container-control-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => setContainerHeading(e, 2)}
                        title="Heading 2"
                    >
                        <span style={{ fontSize: "9px", fontWeight: 700 }}>H2</span>
                    </button>
                    <button
                        className={`inner-container-control-btn${styles.textAlign === "left" ? " is-active" : ""}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => setContainerAlign(e, "left")}
                        title="Align left"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="10" viewBox="0 -960 960 960" width="10" fill="currentColor">
                            <path d="M120-120v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Z" />
                        </svg>
                    </button>
                    <button
                        className={`inner-container-control-btn${styles.textAlign === "center" ? " is-active" : ""}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => setContainerAlign(e, "center")}
                        title="Align center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="10" viewBox="0 -960 960 960" width="10" fill="currentColor">
                            <path d="M120-120v-80h720v80H120Zm160-160v-80h400v80H280ZM120-440v-80h720v80H120Zm160-160v-80h400v80H280ZM120-760v-80h720v80H120Z" />
                        </svg>
                    </button>
                    <button
                        className={`inner-container-control-btn${styles.textAlign === "right" ? " is-active" : ""}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => setContainerAlign(e, "right")}
                        title="Align right"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="10" viewBox="0 -960 960 960" width="10" fill="currentColor">
                            <path d="M120-120v-80h720v80H120Zm240-160v-80h480v80H360ZM120-440v-80h720v80H120Zm240-160v-80h480v80H360ZM120-760v-80h720v80H120Z" />
                        </svg>
                    </button>
                    {/* Style button */}
                    <button
                        className="inner-container-control-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => { e.stopPropagation(); setShowStylePopup(!showStylePopup); }}
                        title="Style container"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="currentColor">
                            <path d="M480-400q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm-240 0q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm480 0q-33 0-56.5-23.5T680-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z" />
                        </svg>
                    </button>
                    {/* Image button */}
                    <button
                        className="inner-container-control-btn"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={(e) => { e.stopPropagation(); handleImageUpload(); }}
                        title="Add image"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="12" viewBox="0 -960 960 960" width="12" fill="currentColor">
                            <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Z" />
                        </svg>
                    </button>
                </div>
            )}

            {showStylePopup && (
                <div className="inner-container-style-popup" onClick={(e) => e.stopPropagation()}>
                    <div className="icsp-row">
                        <label>BG</label>
                        <input type="color" value={styles.bgColor || "#ffffff"} onChange={(e) => handleStyleChange("bgColor", e.target.value)} />
                    </div>
                    <div className="icsp-row">
                        <label>Text</label>
                        <input type="color" value={styles.fontColor || "#000000"} onChange={(e) => handleStyleChange("fontColor", e.target.value)} />
                    </div>
                    <div className="icsp-row">
                        <label>Border</label>
                        <input type="color" value={styles.borderColor || "#cccccc"} onChange={(e) => handleStyleChange("borderColor", e.target.value)} />
                    </div>
                    <div className="icsp-row">
                        <label>Size</label>
                        <input type="range" min="10" max="28" value={styles.fontSize || 14} onChange={(e) => handleStyleChange("fontSize", Number(e.target.value))} />
                    </div>
                    <div className="icsp-row">
                        <label>Width</label>
                        <input type="range" min="20" max="100" value={styles.containerWidth || 100} onChange={(e) => handleStyleChange("containerWidth", Number(e.target.value))} />
                        <span className="icsp-value">{styles.containerWidth || 100}%</span>
                    </div>
                    <div className="icsp-row">
                        <label>Height</label>
                        <input type="range" min="0" max="500" value={styles.containerHeight || 0} onChange={(e) => handleStyleChange("containerHeight", Number(e.target.value))} />
                        <span className="icsp-value">{styles.containerHeight ? `${styles.containerHeight}px` : "Auto"}</span>
                    </div>
                    <div className="icsp-row">
                        <label>Radius</label>
                        <input type="range" min="0" max="30" value={styles.borderRadius || 8} onChange={(e) => handleStyleChange("borderRadius", Number(e.target.value))} />
                    </div>
                    <div className="icsp-row">
                        <label>Weight</label>
                        <select value={styles.fontWeight || "700"} onChange={(e) => handleStyleChange("fontWeight", e.target.value)}>
                            <option value="400">Normal</option>
                            <option value="500">Medium</option>
                            <option value="600">Semi</option>
                            <option value="700">Bold</option>
                            <option value="800">Extra</option>
                        </select>
                    </div>
                    <div className="icsp-row">
                        <label>Align</label>
                        <select value={styles.textAlign || "center"} onChange={(e) => handleStyleChange("textAlign", e.target.value)}>
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                        </select>
                    </div>
                    <div className="icsp-row">
                        <label>B.Width</label>
                        <input type="range" min="0" max="5" value={styles.borderWidth || 0} onChange={(e) => handleStyleChange("borderWidth", Number(e.target.value))} />
                    </div>
                    <button className="icsp-close" onClick={() => setShowStylePopup(false)}>Done</button>
                </div>
            )}

            {/* Image area */}
            {imgSrcList.length > 0 && (
                <>
                    {imgSrcList.map((src, index) => {
                        const isActiveImage = isImageSelected && activeImageIndex === index;
                        return (
                            <div
                                key={`${src}-${index}`}
                                ref={(node) => {
                                    if (node) {
                                        imageWrapRefs.current[index] = node;
                                    } else {
                                        delete imageWrapRefs.current[index];
                                    }
                                }}
                                className={`inner-container-img-wrap${isResizingImage && isActiveImage ? " resizing" : ""}${isDraggingImage && isActiveImage ? " dragging" : ""}${isActiveImage ? " is-selected" : ""}`}
                                style={getImageWrapStyle(index)}
                            >
                                <img
                                    src={src}
                                    alt=""
                                    className={`inner-container-img draggable${imgLoading && index === 0 ? " loading" : ""}`}
                                    style={getImageStyle(index)}
                                    onPointerDown={(e) => handleImageMoveStart(e, index)}
                                />
                                {isActiveImage && (
                                    <>
                                        <button
                                            type="button"
                                            className="inner-container-img-resize-handle north north-side-handle"
                                            onPointerDown={(e) => handleImageResizeStart("north", index, e)}
                                            title="Resize image height"
                                        />
                                        <button
                                            type="button"
                                            className="inner-container-img-resize-handle south south-side-handle"
                                            onPointerDown={(e) => handleImageResizeStart("south", index, e)}
                                            title="Resize image height"
                                        />
                                        <button
                                            type="button"
                                            className="inner-container-img-resize-handle east east-side-handle"
                                            onPointerDown={(e) => handleImageResizeStart("east", index, e)}
                                            title="Resize image width"
                                        />
                                        <button
                                            type="button"
                                            className="inner-container-img-resize-handle west west-side-handle"
                                            onPointerDown={(e) => handleImageResizeStart("west", index, e)}
                                            title="Resize image width"
                                        />
                                        <button
                                            type="button"
                                            className="inner-container-img-resize-handle ne ne-side-handle northeast-side-handle"
                                            onPointerDown={(e) => handleImageResizeStart("ne", index, e)}
                                            title="Resize image"
                                        />
                                        <button
                                            type="button"
                                            className="inner-container-img-resize-handle nw nw-side-handle northwest-side-handle"
                                            onPointerDown={(e) => handleImageResizeStart("nw", index, e)}
                                            title="Resize image"
                                        />
                                        <button
                                            type="button"
                                            className="inner-container-img-resize-handle se se-side-handle southeast-side-handle"
                                            onPointerDown={(e) => handleImageResizeStart("se", index, e)}
                                            title="Resize image"
                                        />
                                        <button
                                            type="button"
                                            className="inner-container-img-resize-handle sw sw-side-handle southwest-side-handle"
                                            onPointerDown={(e) => handleImageResizeStart("sw", index, e)}
                                            title="Resize image"
                                        />
                                    </>
                                )}
                                <button className="inner-container-img-remove" onClick={(e) => handleRemoveImage(e, index)} title="Remove image">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="10" viewBox="0 -960 960 960" width="10" fill="currentColor">
                                        <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </>
            )}

            {/* Text area */}
            {isEditing ? (
                <div
                    ref={textEditorRef}
                    className="inner-container-text-display"
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleTextSave}
                    onInput={syncTextFromEditor}
                    onPaste={handleEditorPaste}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === "Escape") {
                            e.preventDefault();
                            handleTextSave();
                            textEditorRef.current?.blur();
                        }
                    }}
                    style={{
                        ...getTextStyle({ editable: true }),
                        ...(imgSrcList.length === 0 ? { minHeight: "100%" } : {}),
                    }}
                />
            ) : (
                isRichTextEmpty(text) ? (
                    <div
                        ref={textDisplayRef}
                        onPointerDown={handleTextDragStart}
                        className="inner-container-text-display"
                        style={{
                            ...getTextStyle({ draggable: true }),
                            ...(imgSrcList.length === 0 ? { minHeight: "100%" } : {}),
                        }}
                    >
                        Click to add text...
                    </div>
                ) : (
                    <div
                        ref={textDisplayRef}
                        onPointerDown={handleTextDragStart}
                        className="inner-container-text-display"
                        style={{
                            ...getTextStyle({ draggable: true }),
                            ...(imgSrcList.length === 0 ? { minHeight: "100%" } : {}),
                        }}
                        dangerouslySetInnerHTML={{ __html: text }}
                    />
                )
            )}
        </div>
    );
};

export default class ContainerNode extends DecoratorNode {
    static getType() {
        return "container";
    }

    static clone(node) {
        return new ContainerNode(
            node.__bgColor, node.__borderColor, node.__borderWidth,
            node.__borderStyle, node.__borderRadius, node.__textContent,
            node.__textAlign, node.__fontWeight, node.__fontSize,
            node.__fontColor, node.__fontStyle, node.__textDecoration, node.__containerWidth, node.__containerHeight,
            node.__imageUrl, node.__imageWidth, node.__imageHeight, node.__imageOffsetX, node.__imageOffsetY, node.__offsetX, node.__offsetY, node.__imageUrls, node.__imageWidths, node.__imageHeights, node.__imageOffsetXs, node.__imageOffsetYs, node.__textOffsetX, node.__textOffsetY, node.__key
        );
    }

    constructor(bgColor = "#d4e8c2", borderColor = "#b5d49a", borderWidth = 1, borderStyle = "solid", borderRadius = 8, textContent = "", textAlign = "center", fontWeight = "700", fontSize = 14, fontColor = "#2d2d2d", fontStyle = "normal", textDecoration = "none", containerWidth = 100, containerHeight = 250, imageUrl = "", imageWidth = null, imageHeight = null, imageOffsetX = 0, imageOffsetY = 0, offsetX = 0, offsetY = 0, imageUrls = null, imageWidths = null, imageHeights = null, imageOffsetXs = null, imageOffsetYs = null, textOffsetX = 0, textOffsetY = 0, key) {
        super(key);
        this.__bgColor = bgColor;
        this.__borderColor = borderColor;
        this.__borderWidth = borderWidth;
        this.__borderStyle = borderStyle;
        this.__borderRadius = borderRadius;
        this.__textContent = textContent;
        this.__textAlign = textAlign;
        this.__fontWeight = fontWeight;
        this.__fontSize = fontSize;
        this.__fontColor = fontColor;
        this.__fontStyle = fontStyle;
        this.__textDecoration = textDecoration;
        this.__containerWidth = containerWidth;
        this.__containerHeight = containerHeight;
        this.__imageUrl = imageUrl;
        this.__imageWidth = imageWidth;
        this.__imageHeight = imageHeight;
        this.__imageOffsetX = imageOffsetX;
        this.__imageOffsetY = imageOffsetY;
        this.__offsetX = offsetX;
        this.__offsetY = offsetY;
        this.__textOffsetX = textOffsetX;
        this.__textOffsetY = textOffsetY;
        const { safeImageUrls, layouts } = buildImageLayouts({
            imageUrl,
            imageUrls,
            imageWidth,
            imageHeight,
            imageOffsetX,
            imageOffsetY,
            imageWidths,
            imageHeights,
            imageOffsetXs,
            imageOffsetYs,
        });
        this.__imageUrls = safeImageUrls;
        this.__imageWidths = layouts.map((layout) => layout.width);
        this.__imageHeights = layouts.map((layout) => layout.height);
        this.__imageOffsetXs = layouts.map((layout) => layout.offsetX);
        this.__imageOffsetYs = layouts.map((layout) => layout.offsetY);
        this.__imageUrl = safeImageUrls[0] || "";
        this.__imageWidth = this.__imageWidths[0] ?? null;
        this.__imageHeight = this.__imageHeights[0] ?? null;
        this.__imageOffsetX = this.__imageOffsetXs[0] ?? 0;
        this.__imageOffsetY = this.__imageOffsetYs[0] ?? 0;
    }

    createDOM() {
        const div = document.createElement("div");
        div.className = "container-node-wrapper";
        return div;
    }

    updateDOM() {
        return false;
    }

    exportJSON() {
        return {
            type: "container",
            version: 1,
            bgColor: this.__bgColor,
            borderColor: this.__borderColor,
            borderWidth: this.__borderWidth,
            borderStyle: this.__borderStyle,
            borderRadius: this.__borderRadius,
            textContent: this.__textContent,
            textAlign: this.__textAlign,
            fontWeight: this.__fontWeight,
            fontSize: this.__fontSize,
            fontColor: this.__fontColor,
            fontStyle: this.__fontStyle,
            textDecoration: this.__textDecoration,
            containerWidth: this.__containerWidth,
            containerHeight: this.__containerHeight,
            imageUrl: this.__imageUrl,
            imageUrls: this.__imageUrls,
            imageWidth: this.__imageWidth,
            imageHeight: this.__imageHeight,
            imageOffsetX: this.__imageOffsetX,
            imageOffsetY: this.__imageOffsetY,
            imageWidths: this.__imageWidths,
            imageHeights: this.__imageHeights,
            imageOffsetXs: this.__imageOffsetXs,
            imageOffsetYs: this.__imageOffsetYs,
            textOffsetX: this.__textOffsetX,
            textOffsetY: this.__textOffsetY,
            offsetX: this.__offsetX,
            offsetY: this.__offsetY,
        };
    }

    static importJSON(serializedNode) {
        return $createContainerNode(
            serializedNode.bgColor, serializedNode.borderColor,
            serializedNode.borderWidth, serializedNode.borderStyle,
            serializedNode.borderRadius, serializedNode.textContent,
            serializedNode.textAlign, serializedNode.fontWeight,
            serializedNode.fontSize, serializedNode.fontColor, serializedNode.fontStyle, serializedNode.textDecoration,
            serializedNode.containerWidth, serializedNode.containerHeight,
            serializedNode.imageUrl, serializedNode.imageWidth, serializedNode.imageHeight, serializedNode.imageOffsetX, serializedNode.imageOffsetY, serializedNode.offsetX, serializedNode.offsetY, serializedNode.imageUrls, serializedNode.imageWidths, serializedNode.imageHeights, serializedNode.imageOffsetXs, serializedNode.imageOffsetYs, serializedNode.textOffsetX, serializedNode.textOffsetY
        );
    }

    setProperty(key, value) {
        const writable = this.getWritable();
        writable[`__${key}`] = value;
    }

    decorate(editor) {
        const isEditable = editor.isEditable();
        return (
            <ContainerComponent
                nodeKey={this.getKey()}
                bgColor={this.__bgColor}
                borderColor={this.__borderColor}
                borderWidth={this.__borderWidth}
                borderStyle={this.__borderStyle}
                borderRadius={this.__borderRadius}
                textContent={this.__textContent}
                textAlign={this.__textAlign}
                fontWeight={this.__fontWeight}
                fontSize={this.__fontSize}
                fontColor={this.__fontColor}
                fontStyle={this.__fontStyle}
                textDecoration={this.__textDecoration}
                containerWidth={this.__containerWidth}
                containerHeight={this.__containerHeight}
                imageUrl={this.__imageUrl}
                imageUrls={this.__imageUrls}
                imageWidth={this.__imageWidth}
                imageHeight={this.__imageHeight}
                imageOffsetX={this.__imageOffsetX}
                imageOffsetY={this.__imageOffsetY}
                imageWidths={this.__imageWidths}
                imageHeights={this.__imageHeights}
                imageOffsetXs={this.__imageOffsetXs}
                imageOffsetYs={this.__imageOffsetYs}
                textOffsetX={this.__textOffsetX}
                textOffsetY={this.__textOffsetY}
                offsetX={this.__offsetX}
                offsetY={this.__offsetY}
                isEditable={isEditable}
                session={window.__notesEditorSession}
                addUploadedImagePath={window.__notesEditorAddImagePath}
            />
        );
    }
}

export function $createContainerNode(bgColor, borderColor, borderWidth, borderStyle, borderRadius, textContent, textAlign, fontWeight, fontSize, fontColor, fontStyle, textDecoration, containerWidth, containerHeight, imageUrl, imageWidth, imageHeight, imageOffsetX, imageOffsetY, offsetX, offsetY, imageUrls, imageWidths, imageHeights, imageOffsetXs, imageOffsetYs, textOffsetX, textOffsetY) {
    return new ContainerNode(bgColor, borderColor, borderWidth, borderStyle, borderRadius, textContent, textAlign, fontWeight, fontSize, fontColor, fontStyle, textDecoration, containerWidth, containerHeight, imageUrl, imageWidth, imageHeight, imageOffsetX, imageOffsetY, offsetX, offsetY, imageUrls, imageWidths, imageHeights, imageOffsetXs, imageOffsetYs, textOffsetX, textOffsetY);
}
