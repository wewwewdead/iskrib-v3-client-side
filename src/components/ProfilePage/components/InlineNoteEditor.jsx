import React, { useCallback, useEffect, useRef, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode, $createHeadingNode, $isHeadingNode } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
    $getRoot,
    $getSelection,
    $isRangeSelection,
} from "lexical";

import ImageNode from "../../HomePage/Editor/nodes/ImageNode";
import ImagePlugin from "../../HomePage/Editor/nodes/Plugins/ImagePlugin";
import ContainerNode, { INSERT_CONTAINER_COMMAND, $createContainerNode } from "./nodes/ContainerNode";
import ContainerPlugin from "./nodes/ContainerPlugin";
import { useAuth } from "../../../Context/useAuth";

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

const InlineToolbar = ({ addUploadedImagePath }) => {
    const [editor] = useLexicalComposerContext();

    const [activeStates, setActiveStates] = useState({
        bold: false,
        italic: false,
        underline: false,
        heading: null,
    });

    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                const bold = selection.hasFormat("bold");
                const italic = selection.hasFormat("italic");
                const underline = selection.hasFormat("underline");

                const anchorNode = selection.anchor.getNode();
                let element;
                try {
                    element =
                        anchorNode.getKey() === "root"
                            ? anchorNode
                            : anchorNode.getTopLevelElement() || anchorNode.getTopLevelElementOrThrow();
                } catch {
                    element = null;
                }

                let heading = null;
                if (element && $isHeadingNode(element)) {
                    heading = element.getTag();
                }

                setActiveStates({ bold, italic, underline, heading });
            });
        });
    }, [editor]);

    const applyTextFormat = (format) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    };

    const setAlignment = (value) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
    };

    const setHeading = (tag) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();
                let element;
                try {
                    element =
                        anchorNode.getKey() === "root"
                            ? anchorNode
                            : anchorNode.getTopLevelElement() || anchorNode.getTopLevelElementOrThrow();
                } catch {
                    return;
                }
                if (!element) return;

                const isActive = $isHeadingNode(element) && element.getTag() === tag;
                $setBlocksType(selection, () => (isActive ? $createParagraphNode() : $createHeadingNode(tag)));
            }
        });
    };

    const insertContainer = () => {
        editor.dispatchCommand(INSERT_CONTAINER_COMMAND, {});
    };

    const getBtnClass = (isActive) => (isActive ? "inline-toolbar-btn is-active" : "inline-toolbar-btn");

    return (
        <div className="inline-note-toolbar">
            {/* Container */}
            <div onMouseDown={(e) => e.preventDefault()} onClick={insertContainer} className="inline-toolbar-btn" title="Insert container">
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                    <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Z" />
                </svg>
            </div>
            <div className="inline-toolbar-divider" />
            {/* Text formatting */}
            <div onMouseDown={(e) => e.preventDefault()} onClick={() => applyTextFormat("bold")} className={getBtnClass(activeStates.bold)} title="Bold">
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                    <path d="M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-491q25 11 55.5 41t30.5 90q0 89-65 124.5T501-200H272Zm121-112h104q48 0 58.5-24.5T566-372q0-11-10.5-35.5T494-432H393v120Zm0-228h93q33 0 48-17t15-38q0-24-17-39t-44-15h-95v109Z" />
                </svg>
            </div>
            <div onMouseDown={(e) => e.preventDefault()} onClick={() => applyTextFormat("italic")} className={getBtnClass(activeStates.italic)} title="Italic">
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                    <path d="M200-200v-100h160l120-360H320v-100h400v100H580L460-300h140v100H200Z" />
                </svg>
            </div>
            <div onMouseDown={(e) => e.preventDefault()} onClick={() => applyTextFormat("underline")} className={getBtnClass(activeStates.underline)} title="Underline">
                <svg xmlns="http://www.w3.org/2000/svg" height="16" viewBox="0 -960 960 960" width="16" fill="currentColor">
                    <path d="M200-120v-80h560v80H200Zm280-160q-101 0-157-63t-56-167v-330h103v336q0 56 28 91t82 35q54 0 82-35t28-91v-336h103v330q0 104-56 167t-157 63Z" />
                </svg>
            </div>
            <div className="inline-toolbar-divider" />
            {/* Headings */}
            <div onMouseDown={(e) => e.preventDefault()} onClick={() => setHeading("h1")} className={getBtnClass(activeStates.heading === "h1")} title="Heading 1">
                <span style={{ fontSize: "12px", fontWeight: 700 }}>H1</span>
            </div>
            <div onMouseDown={(e) => e.preventDefault()} onClick={() => setHeading("h2")} className={getBtnClass(activeStates.heading === "h2")} title="Heading 2">
                <span style={{ fontSize: "12px", fontWeight: 700 }}>H2</span>
            </div>
            <div className="inline-toolbar-divider" />
            {/* Alignment */}
            <div onMouseDown={(e) => e.preventDefault()} onClick={() => setAlignment("left")} className="inline-toolbar-btn" title="Align left">
                <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                    <path d="M120-120v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Z" />
                </svg>
            </div>
            <div onMouseDown={(e) => e.preventDefault()} onClick={() => setAlignment("center")} className="inline-toolbar-btn" title="Align center">
                <svg xmlns="http://www.w3.org/2000/svg" height="14" viewBox="0 -960 960 960" width="14" fill="currentColor">
                    <path d="M120-120v-80h720v80H120Zm160-160v-80h400v80H280ZM120-440v-80h720v80H120Zm160-160v-80h400v80H280ZM120-760v-80h720v80H120Z" />
                </svg>
            </div>
        </div>
    );
};

const LoadInitialContent = ({ initialContent }) => {
    const [editor] = useLexicalComposerContext();
    const hasLoaded = useRef(false);

    useEffect(() => {
        if (initialContent && !hasLoaded.current) {
            hasLoaded.current = true;
            try {
                const parsed = typeof initialContent === "string" ? JSON.parse(initialContent) : initialContent;
                const editorState = editor.parseEditorState(parsed);
                editor.setEditorState(editorState);
            } catch (err) {
                console.error("Failed to load initial content:", err);
            }
        }
    }, [initialContent, editor]);

    return null;
};

const EnsureDefaultContainer = ({ initialContent }) => {
    const [editor] = useLexicalComposerContext();
    const hasEnsuredRef = useRef(false);

    useEffect(() => {
        if (initialContent || hasEnsuredRef.current) return;

        editor.update(() => {
            const root = $getRoot();
            const children = root.getChildren();
            const hasContainer = children.some((node) => node?.__type === "container");
            if (hasContainer) return;

            root.clear();
            root.append($createContainerNode());
            hasEnsuredRef.current = true;
        });
    }, [editor, initialContent]);

    return null;
};

const InlineAddContainerButton = () => {
    const [editor] = useLexicalComposerContext();

    const handleInsertContainer = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        editor.dispatchCommand(INSERT_CONTAINER_COMMAND, {});
    }, [editor]);

    return (
        <button
            type="button"
            className="inline-note-add-container-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleInsertContainer}
            title="Add container"
        >
            + Container
        </button>
    );
};

const InlineNoteEditor = ({ initialContent, onSave, onExplicitSave, hasUnsavedChanges, isSaving }) => {
    const debounceRef = useRef(null);
    const editorShellRef = useRef(null);
    const { session } = useAuth();
    const [showInlineSaveButton, setShowInlineSaveButton] = useState(false);

    const [uploadedImagePaths, setUploadedImagePaths] = useState([]);
    const addUploadedImagePath = useCallback((imagePath) => {
        setUploadedImagePaths((prev) => [...prev, imagePath]);
    }, []);

    // Expose session and addUploadedImagePath to ContainerNode via window globals
    useEffect(() => {
        window.__notesEditorSession = session;
        window.__notesEditorAddImagePath = addUploadedImagePath;
        return () => {
            delete window.__notesEditorSession;
            delete window.__notesEditorAddImagePath;
        };
    }, [session, addUploadedImagePath]);

    const initialConfig = {
        namespace: "InlineNote",
        editable: true,
        nodes: [ImageNode, HeadingNode, QuoteNode, ContainerNode],
        theme,
        onError: (error) => console.error("InlineNote error:", error),
    };

    const handleChange = useCallback(
        (editorState) => {
            const jsonStr = JSON.stringify(editorState.toJSON());

            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(() => {
                if (onSave) onSave(jsonStr);
            }, 1500);
        },
        [onSave]
    );

    useEffect(() => {
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, []);

    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!editorShellRef.current?.contains(e.target)) {
                setShowInlineSaveButton(false);
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const handleInlineSave = useCallback(async () => {
        if (!onExplicitSave) return;
        const saved = await onExplicitSave();
        if (saved) {
            setShowInlineSaveButton(false);
        }
    }, [onExplicitSave]);

    return (
        <div className="inline-note-editor-wrapper">
            <LexicalComposer initialConfig={initialConfig}>
                <div className="inline-note-editor-shell" ref={editorShellRef}>
                    <RichTextPlugin
                        contentEditable={
                            <div className="inline-note-content-editable-container">
                                <ContentEditable
                                    className={`inline-note-content-editable${showInlineSaveButton ? " with-inline-save" : ""}`}
                                    onFocus={() => setShowInlineSaveButton(true)}
                                    onClick={() => setShowInlineSaveButton(true)}
                                />
                                {showInlineSaveButton && <InlineAddContainerButton />}
                                {showInlineSaveButton && onExplicitSave && (
                                    <button
                                        type="button"
                                        className="inline-note-inline-save-btn"
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={handleInlineSave}
                                        disabled={isSaving || !hasUnsavedChanges}
                                    >
                                        {isSaving ? "Saving..." : hasUnsavedChanges ? "Save Notes" : "Saved"}
                                    </button>
                                )}
                            </div>
                        }
                        placeholder={<div className="inline-note-placeholder">Write something...</div>}
                        ErrorBoundary={LexicalErrorBoundary}
                    />
                    <ImagePlugin addUploadedImagePath={addUploadedImagePath} />
                    <ContainerPlugin />
                    <HistoryPlugin />
                    <OnChangePlugin onChange={handleChange} />
                </div>
                <LoadInitialContent initialContent={initialContent} />
                <EnsureDefaultContainer initialContent={initialContent} />
            </LexicalComposer>
        </div>
    );
};

export default InlineNoteEditor;
