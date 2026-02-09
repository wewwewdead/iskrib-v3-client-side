import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from "lexical";
import { $createContainerNode, INSERT_CONTAINER_COMMAND } from "./ContainerNode";

export default function ContainerPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const createContainerFromPayload = (payload = {}) => {
            const {
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
            } = payload;

            return $createContainerNode(
                bgColor || "#d4e8c2",
                borderColor || "#b5d49a",
                borderWidth ?? 1,
                borderStyle || "solid",
                borderRadius ?? 8,
                textContent || "",
                textAlign || "center",
                fontWeight || "700",
                fontSize ?? 14,
                fontColor || "#2d2d2d",
                fontStyle || "normal",
                textDecoration || "none",
                containerWidth ?? 100,
                containerHeight ?? 250,
                imageUrl || "",
                imageWidth ?? null,
                imageHeight ?? null,
                imageOffsetX ?? 0,
                imageOffsetY ?? 0,
                offsetX ?? 0,
                offsetY ?? 0,
                imageUrls ?? null,
                imageWidths ?? null,
                imageHeights ?? null,
                imageOffsetXs ?? null,
                imageOffsetYs ?? null,
                textOffsetX ?? 0,
                textOffsetY ?? 0
            );
        };

        const unregisterCommand = editor.registerCommand(
            INSERT_CONTAINER_COMMAND,
            (payload) => {
                const containerNode = createContainerFromPayload(payload);
                const selection = $getSelection();

                if ($isRangeSelection(selection)) {
                    selection.insertNodes([containerNode]);
                } else {
                    const root = $getRoot();
                    root.append(containerNode);
                }

                return true;
            },
            COMMAND_PRIORITY_EDITOR
        );

        // Listen for style/text updates from ContainerComponent
        const handleContainerUpdate = (e) => {
            const { nodeKey, text, bgColor, borderColor, borderWidth, borderStyle, borderRadius, textAlign, fontWeight, fontSize, fontColor, fontStyle, textDecoration, containerWidth, containerHeight, imageUrl, imageUrls, imageWidth, imageHeight, imageOffsetX, imageOffsetY, imageWidths, imageHeights, imageOffsetXs, imageOffsetYs, textOffsetX, textOffsetY, offsetX, offsetY } = e.detail;
            editor.update(() => {
                const nodeMap = editor.getEditorState()._nodeMap;
                for (const [key, node] of nodeMap) {
                    if (key === nodeKey && node.__type === "container") {
                        const writable = node.getWritable();
                        if (text !== undefined) writable.__textContent = text;
                        if (bgColor !== undefined) writable.__bgColor = bgColor;
                        if (borderColor !== undefined) writable.__borderColor = borderColor;
                        if (borderWidth !== undefined) writable.__borderWidth = borderWidth;
                        if (borderStyle !== undefined) writable.__borderStyle = borderStyle;
                        if (borderRadius !== undefined) writable.__borderRadius = borderRadius;
                        if (textAlign !== undefined) writable.__textAlign = textAlign;
                        if (fontWeight !== undefined) writable.__fontWeight = fontWeight;
                        if (fontSize !== undefined) writable.__fontSize = fontSize;
                        if (fontColor !== undefined) writable.__fontColor = fontColor;
                        if (fontStyle !== undefined) writable.__fontStyle = fontStyle;
                        if (textDecoration !== undefined) writable.__textDecoration = textDecoration;
                        if (containerWidth !== undefined) writable.__containerWidth = containerWidth;
                        if (containerHeight !== undefined) writable.__containerHeight = containerHeight;
                        if (imageUrl !== undefined) writable.__imageUrl = imageUrl;
                        if (imageUrls !== undefined) {
                            writable.__imageUrls = imageUrls;
                            if (imageUrl === undefined) {
                                writable.__imageUrl = imageUrls?.[0] || "";
                            }
                        }
                        if (imageWidth !== undefined) writable.__imageWidth = imageWidth;
                        if (imageHeight !== undefined) writable.__imageHeight = imageHeight;
                        if (imageOffsetX !== undefined) writable.__imageOffsetX = imageOffsetX;
                        if (imageOffsetY !== undefined) writable.__imageOffsetY = imageOffsetY;
                        if (imageWidths !== undefined) writable.__imageWidths = imageWidths;
                        if (imageHeights !== undefined) writable.__imageHeights = imageHeights;
                        if (imageOffsetXs !== undefined) writable.__imageOffsetXs = imageOffsetXs;
                        if (imageOffsetYs !== undefined) writable.__imageOffsetYs = imageOffsetYs;
                        if (textOffsetX !== undefined) writable.__textOffsetX = textOffsetX;
                        if (textOffsetY !== undefined) writable.__textOffsetY = textOffsetY;
                        if (offsetX !== undefined) writable.__offsetX = offsetX;
                        if (offsetY !== undefined) writable.__offsetY = offsetY;
                        break;
                    }
                }
            });
        };

        // Listen for container removal
        const handleContainerRemove = (e) => {
            const { nodeKey } = e.detail;
            editor.update(() => {
                const nodeMap = editor.getEditorState()._nodeMap;
                for (const [key, node] of nodeMap) {
                    if (key === nodeKey && node.__type === "container") {
                        node.remove();
                        break;
                    }
                }
            });
        };

        const handleContainerInsert = (e) => {
            const { afterNodeKey, ...payload } = e.detail || {};
            let insertedNodeKey = null;

            editor.update(() => {
                const containerNode = createContainerFromPayload(payload);

                if (afterNodeKey) {
                    const nodeMap = editor.getEditorState()._nodeMap;
                    for (const [key, node] of nodeMap) {
                        if (key === afterNodeKey && node.__type === "container") {
                            node.insertAfter(containerNode);
                            insertedNodeKey = containerNode.getKey();
                            break;
                        }
                    }
                }

                if (!insertedNodeKey) {
                    const selection = $getSelection();
                    if ($isRangeSelection(selection)) {
                        selection.insertNodes([containerNode]);
                    } else {
                        const root = $getRoot();
                        root.append(containerNode);
                    }
                    insertedNodeKey = containerNode.getKey();
                }
            });

            if (e?.detail && insertedNodeKey) {
                e.detail.insertedNodeKey = insertedNodeKey;
            }
        };

        window.addEventListener("container-update", handleContainerUpdate);
        window.addEventListener("container-remove", handleContainerRemove);
        window.addEventListener("container-insert", handleContainerInsert);

        return () => {
            unregisterCommand();
            window.removeEventListener("container-update", handleContainerUpdate);
            window.removeEventListener("container-remove", handleContainerRemove);
            window.removeEventListener("container-insert", handleContainerInsert);
        };
    }, [editor]);

    return null;
}
