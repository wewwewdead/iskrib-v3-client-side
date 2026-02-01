import { useCallback, useEffect, useState } from "react";

import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  $getRoot,
  $createRangeSelection,
  $setSelection,
} from "lexical";

import { $createHeadingNode, $isHeadingNode,} from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $insertNodeToNearestRoot } from '@lexical/utils';

import ImageNode, {$createImageNode, INSERT_IMAGE_COMMAND} from "./nodes/ImageNode";
import { saveJournalImage } from "../../../../API/Api";
import { useAuth } from "../../../Context/useAuth";

const ToolBar = ({addUploadedImagePath}) =>{
    const [editor] = useLexicalComposerContext();
    const {session} = useAuth();

    // Active state tracking
    const [activeStates, setActiveStates] = useState({
        bold: false,
        italic: false,
        underline: false,
        heading: null,   // 'h1' | 'h2' | 'h3' | null
        alignment: 'left',
    });

    // Register update listener for active state detection
    useEffect(() => {
        return editor.registerUpdateListener(({ editorState }) => {
            editorState.read(() => {
                const selection = $getSelection();
                if (!$isRangeSelection(selection)) return;

                const bold = selection.hasFormat('bold');
                const italic = selection.hasFormat('italic');
                const underline = selection.hasFormat('underline');

                const anchorNode = selection.anchor.getNode();
                let element;
                try {
                    element = anchorNode.getKey() === 'root'
                        ? anchorNode
                        : anchorNode.getTopLevelElement() || anchorNode.getTopLevelElementOrThrow();
                } catch (e) {
                    element = null;
                }

                let heading = null;
                let alignment = 'left';

                if (element) {
                    if ($isHeadingNode(element)) {
                        heading = element.getTag(); // 'h1', 'h2', 'h3'
                    }
                    const formatType = element.getFormatType?.();
                    if (formatType) {
                        alignment = formatType;
                    }
                }

                setActiveStates({ bold, italic, underline, heading, alignment });
            });
        });
    }, [editor]);


    const applyTextFormat = (format) => {
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
    }

    //heading node (H1, H2, H3)
    const setHeading = (tag) => {
        editor.update(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const anchorNode = selection.anchor.getNode();

                let element;
                try {
                    element = anchorNode.getKey() === 'root'
                        ? anchorNode
                        : anchorNode.getTopLevelElement() || anchorNode.getTopLevelElementOrThrow();
                } catch (e) {
                    console.error('Could not get top level element:', e);
                    return;
                }

                if (!element) return;

                const type = typeof element.getType === 'function' ? element.getType() : null;

                if (type && type !== "paragraph" && type !== "heading") {
                    return;
                }

                const isActive = $isHeadingNode(element) && element.getTag() === tag;

                $setBlocksType(selection, () =>
                    isActive ? $createParagraphNode() : $createHeadingNode(tag)
                );
            }
        })
    }

    //align element
    const setAlignment = (value) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
    }

    //insert image
    const insertImageFromFile = async() => {

        const handleOnChange = async(e) => {
            const filedata = e.target.files?.[0];
            if(!filedata) return;

            const blobUrl = URL.createObjectURL(filedata);

            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                src: blobUrl,
                width: 500,
                height: 500,
                loading: true,
            })

            const formdata = new FormData();
            formdata.append('image', filedata);

            try {
                const data_url = await saveJournalImage(session?.access_token, formdata);
                if(!data_url){
                    console.log('error: no image_url');
                    return;
                }

                const filePath = data_url.img_url.split('/journal-images/').pop();
                if (filePath && addUploadedImagePath) {
                    addUploadedImagePath(filePath);
                }

                editor.update(() => {
                    const root = editor.getEditorState()._nodeMap;
                    for (const [, node] of root) {
                        if (node.__type === 'image' && node.__src === blobUrl) {
                            node.getWritable().__src = data_url.img_url;
                            node.getWritable().__loading = false;
                            break;
                        }
                    }
                });

                URL.revokeObjectURL(blobUrl);
            } catch (err) {
                console.error('Image upload failed:', err);
            }
        }

        const input = document.createElement('input');
        input.type = 'file'
        input.accept = 'image/*';
        input.onchange = (e) => {handleOnChange(e)}

        input.click();
    };

    // Helper to get class name based on active state
    const getBtnClass = (isActive) => isActive ? 'is-active' : 'toolbar-bttns';

    return(
        <div className="toolbar">
            {/* Group 1: Image upload */}
            <div className="group">
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => insertImageFromFile()} className="toolbar-bttns" title="Insert image">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M480-480ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm40-160h480L570-480 450-320l-90-120-120 160Zm440-320v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"/></svg>
                </div>
            </div>

            <div className="toolbar-divider" />

            {/* Group 2: Text formatting */}
            <div className="group">
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => applyTextFormat('bold')} className={getBtnClass(activeStates.bold)} title="Bold">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-491q25 11 55.5 41t30.5 90q0 89-65 124.5T501-200H272Zm121-112h104q48 0 58.5-24.5T566-372q0-11-10.5-35.5T494-432H393v120Zm0-228h93q33 0 48-17t15-38q0-24-17-39t-44-15h-95v109Z"/></svg>
                </div>
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => applyTextFormat('italic')} className={getBtnClass(activeStates.italic)} title="Italic">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-200v-100h160l120-360H320v-100h400v100H580L460-300h140v100H200Z"/></svg>
                </div>
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => applyTextFormat('underline')} className={getBtnClass(activeStates.underline)} title="Underline">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-120v-80h560v80H200Zm280-160q-101 0-157-63t-56-167v-330h103v336q0 56 28 91t82 35q54 0 82-35t28-91v-336h103v330q0 104-56 167t-157 63Z"/></svg>
                </div>
            </div>

            <div className="toolbar-divider" />

            {/* Group 3: Headings */}
            <div className="group">
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => setHeading('h1')} className={getBtnClass(activeStates.heading === 'h1')} title="Heading 1">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M200-280v-400h80v160h160v-160h80v400h-80v-160H280v160h-80Zm480 0v-320h-80v-80h160v400h-80Z"/></svg>
                </div>
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => setHeading('h2')} className={getBtnClass(activeStates.heading === 'h2')} title="Heading 2">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M120-280v-400h80v160h160v-160h80v400h-80v-160H200v160h-80Zm400 0v-160q0-33 23.5-56.5T600-520h160v-80H520v-80h240q33 0 56.5 23.5T840-600v80q0 33-23.5 56.5T760-440H600v80h240v80H520Z"/></svg>
                </div>
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => setHeading('h3')} className={getBtnClass(activeStates.heading === 'h3')} title="Heading 3">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M120-280v-400h80v160h160v-160h80v400h-80v-160H200v160h-80Zm400 0v-80h240v-80H600v-80h160v-80H520v-80h240q33 0 56.5 23.5T840-600v240q0 33-23.5 56.5T760-280H520Z"/></svg>
                </div>
            </div>

            <div className="toolbar-divider" />

            {/* Group 4: Alignment */}
            <div className="group">
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => setAlignment('left')} className={getBtnClass(activeStates.alignment === 'left' || activeStates.alignment === '')} title="Align left">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M120-120v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Z"/></svg>
                </div>
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => setAlignment('center')} className={getBtnClass(activeStates.alignment === 'center')} title="Align center">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M120-120v-80h720v80H120Zm160-160v-80h400v80H280ZM120-440v-80h720v80H120Zm160-160v-80h400v80H280ZM120-760v-80h720v80H120Z"/></svg>
                </div>
                <div onMouseDown={(e) => e.preventDefault()} onClick={() => setAlignment('right')} className={getBtnClass(activeStates.alignment === 'right')} title="Align right">
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M120-760v-80h720v80H120Zm240 160v-80h480v80H360ZM120-440v-80h720v80H120Zm240 160v-80h480v80H360ZM120-120v-80h720v80H120Z"/></svg>
                </div>
            </div>
        </div>
    )
}
export default ToolBar;
