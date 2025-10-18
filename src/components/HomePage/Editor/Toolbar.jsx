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

const ToolBar = () =>{
    //bold and italic style are textFormatTypeStrings
    const [editor] = useLexicalComposerContext();


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
                    element = anchorNode.getKey() === 'root' //checking if anchorNode itselt is the root
                        ? anchorNode  //if not then use getTopLevelElement() method first then as a fallback use getTopLevelElementOrThrow() method
                        : anchorNode.getTopLevelElement() || anchorNode.getTopLevelElementOrThrow();
                } catch (e) {
                    console.error('Could not get top level element:', e);
                    return;
                }

                if (!element) return;

                const type = typeof element.getType === 'function' ? element.getType() : null; //check if elements have getType() === function sometimes nodes dont have getType
                // console.log('Element type:', type);

                if (type && type !== "paragraph" && type !== "heading") { //only proceed if element is paragraph or heading
                    return;
                }

                const isActive = $isHeadingNode(element) && element.getTag() === tag; //checking if element.getTag() === 'tag. returns a boolean

                //use $setBlocksType to change the block type
                //return paragraph if already active(toggle back) otherwise create heading
                $setBlocksType(selection, () => 
                    isActive ? $createParagraphNode() : $createHeadingNode(tag)
                );
            }
        })
    }

    //align element (left, center, right) using FORMAT_ELEMENT_COMMAND values 'left'|'center'|'right
    const setAlignment = (value) => {
        editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
    }

    //insert image
    const insertImageFromFile = () => {
        const handleOnChange = (e) => {
            const filedata = e.target.files?.[0];
            if(!filedata) return;

            const url = URL.createObjectURL(filedata)
            const reader = new FileReader()
                reader.onloadend = () => {
                    const imgUrl = reader.result
                    const image = new Image();

                    editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
                        src: imgUrl,
                        width: 500,
                        height: 500,
                    })
                }

            reader.readAsDataURL(filedata);
        }
        const input = document.createElement('input'); //create an input element
        input.type = 'file'
        input.accept = 'image/*';
        input.onchange = (e) => {handleOnChange(e)}

        input.click(); //initiliaze click to open the file selector
    };

    const toolbarLink = [
        {action: () => insertImageFromFile(), label: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M480-480ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm40-160h480L570-480 450-320l-90-120-120 160Zm440-320v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"/></svg>},
        {action: () => applyTextFormat('bold'), label: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-491q25 11 55.5 41t30.5 90q0 89-65 124.5T501-200H272Zm121-112h104q48 0 58.5-24.5T566-372q0-11-10.5-35.5T494-432H393v120Zm0-228h93q33 0 48-17t15-38q0-24-17-39t-44-15h-95v109Z"/></svg>},
        {action: () => applyTextFormat('italic'), label: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M200-200v-100h160l120-360H320v-100h400v100H580L460-300h140v100H200Z"/></svg>},
        {action: () => setHeading('h1'), label: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M200-280v-400h80v160h160v-160h80v400h-80v-160H280v160h-80Zm480 0v-320h-80v-80h160v400h-80Z"/></svg>},
        {action: () => setHeading('h2'), label: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-280v-400h80v160h160v-160h80v400h-80v-160H200v160h-80Zm400 0v-160q0-33 23.5-56.5T600-520h160v-80H520v-80h240q33 0 56.5 23.5T840-600v80q0 33-23.5 56.5T760-440H600v80h240v80H520Z"/></svg>},
        {action: () => setHeading('h3'), label: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-280v-400h80v160h160v-160h80v400h-80v-160H200v160h-80Zm400 0v-80h240v-80H600v-80h160v-80H520v-80h240q33 0 56.5 23.5T840-600v240q0 33-23.5 56.5T760-280H520Z"/></svg>},
        {action: () => setAlignment('left'), label: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-120v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Zm0-160v-80h480v80H120Zm0-160v-80h720v80H120Z"/></svg>},
        {action: () => setAlignment('center'), label: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-120v-80h720v80H120Zm160-160v-80h400v80H280ZM120-440v-80h720v80H120Zm160-160v-80h400v80H280ZM120-760v-80h720v80H120Z"/></svg>},
        {action: () => setAlignment('right'), label: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M120-760v-80h720v80H120Zm240 160v-80h480v80H360ZM120-440v-80h720v80H120Zm240 160v-80h480v80H360ZM120-120v-80h720v80H120Z"/></svg>}
    ]
    return(
        <>
        <div className="toolbar">
            <div className="group">
                {toolbarLink.map((link, index) => (
                    <div onMouseDown={(e) => e.preventDefault()} onClick={link.action} key={index} className="toolbar-bttns">
                        {link.label}
                    </div>
                ))}
            </div>
        </div>
        </>
    )
}
export default ToolBar;