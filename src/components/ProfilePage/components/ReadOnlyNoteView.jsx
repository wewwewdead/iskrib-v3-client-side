import React, { useCallback, useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import ImageNode from "../../HomePage/Editor/nodes/ImageNode";
import ContainerNode from "./nodes/ContainerNode";

const LoadContentPlugin = ({ content }) => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (content) {
            try {
                const parsed = typeof content === "string" ? JSON.parse(content) : content;
                const editorState = editor.parseEditorState(parsed);
                editor.setEditorState(editorState);
            } catch (err) {
                console.error("Failed to load note content:", err);
            }
        }
    }, [content, editor]);

    return null;
};

const theme = {
    paragraph: "editor-paragraph",
    heading: {
        h1: "editor-heading-h1",
        h2: "editor-heading-h2",
        h3: "editor-heading-h3",
    },
    quote: "editor-quote",
    text: {
        bold: "editor-text-bold",
        italic: "editor-text-italic",
        underline: "editor-text-underline",
    },
};

const ReadOnlyNoteView = ({ content, expandInnerContainerOnClick = false }) => {
    const contentEditableRef = useRef(null);

    const initialConfig = {
        namespace: "ReadOnlyNote",
        editable: false,
        nodes: [ImageNode, HeadingNode, QuoteNode, ContainerNode],
        theme,
        onError: (error) => console.error("ReadOnlyNote error:", error),
    };

    const collapseExpandedInnerContainers = useCallback(() => {
        document
            .querySelectorAll(".note-inner-container.is-visit-full-view")
            .forEach((element) => element.classList.remove("is-visit-full-view"));
        document.body.classList.remove("visit-note-fullview-active");
    }, []);

    const handleInnerContainerClick = useCallback(
        (event) => {
            if (!expandInnerContainerOnClick) return;

            const rawTarget = event.target;
            const targetElement =
                rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement || null;
            if (!targetElement) return;

            const targetContainer = targetElement.closest(".note-inner-container");
            if (!targetContainer) return;

            const shouldExpand = !targetContainer.classList.contains("is-visit-full-view");
            collapseExpandedInnerContainers();

            if (shouldExpand) {
                targetContainer.classList.add("is-visit-full-view");
                document.body.classList.add("visit-note-fullview-active");
            }
        },
        [collapseExpandedInnerContainers, expandInnerContainerOnClick]
    );

    useEffect(() => {
        if (!expandInnerContainerOnClick || !contentEditableRef.current) return undefined;

        const rootEl = contentEditableRef.current;
        const handleRootClick = (event) => handleInnerContainerClick(event);

        rootEl.addEventListener("click", handleRootClick);
        return () => {
            rootEl.removeEventListener("click", handleRootClick);
        };
    }, [expandInnerContainerOnClick, handleInnerContainerClick]);

    useEffect(() => {
        if (!expandInnerContainerOnClick) return undefined;

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                collapseExpandedInnerContainers();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            collapseExpandedInnerContainers();
        };
    }, [collapseExpandedInnerContainers, expandInnerContainerOnClick]);

    if (!content) {
        return <div className="readonly-note-placeholder">Empty note</div>;
    }

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin
                contentEditable={
                    <ContentEditable
                        ref={contentEditableRef}
                        className={`readonly-note-content${expandInnerContainerOnClick ? " visit-inner-expand-enabled" : ""}`}
                    />
                }
                placeholder={null}
                ErrorBoundary={LexicalErrorBoundary}
            />
            <LoadContentPlugin content={content} />
        </LexicalComposer>
    );
};

export default ReadOnlyNoteView;
