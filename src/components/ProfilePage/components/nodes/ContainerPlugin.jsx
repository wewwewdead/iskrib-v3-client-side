import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR } from "lexical";
import { $createContainerNode, INSERT_CONTAINER_COMMAND } from "./ContainerNode";

export default function ContainerPlugin() {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        const unregisterCommand = editor.registerCommand(
            INSERT_CONTAINER_COMMAND,
            (payload) => {
                const { bgColor, borderColor, borderWidth, borderStyle, borderRadius, textContent, textAlign, fontWeight, fontSize, fontColor, fontStyle, textDecoration, containerWidth, containerHeight, imageUrl, imageWidth, imageHeight, imageOffsetX, imageOffsetY, offsetX, offsetY } = payload || {};
                const containerNode = $createContainerNode(
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
                    offsetY ?? 0
                );
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
            const { nodeKey, text, bgColor, borderColor, borderWidth, borderStyle, borderRadius, textAlign, fontWeight, fontSize, fontColor, fontStyle, textDecoration, containerWidth, containerHeight, imageUrl, imageWidth, imageHeight, imageOffsetX, imageOffsetY, offsetX, offsetY } = e.detail;
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
                        if (imageWidth !== undefined) writable.__imageWidth = imageWidth;
                        if (imageHeight !== undefined) writable.__imageHeight = imageHeight;
                        if (imageOffsetX !== undefined) writable.__imageOffsetX = imageOffsetX;
                        if (imageOffsetY !== undefined) writable.__imageOffsetY = imageOffsetY;
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

        window.addEventListener("container-update", handleContainerUpdate);
        window.addEventListener("container-remove", handleContainerRemove);

        return () => {
            unregisterCommand();
            window.removeEventListener("container-update", handleContainerUpdate);
            window.removeEventListener("container-remove", handleContainerRemove);
        };
    }, [editor]);

    return null;
}
