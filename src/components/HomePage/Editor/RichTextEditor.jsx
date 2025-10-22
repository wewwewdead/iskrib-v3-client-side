import React, { useCallback, useEffect, useState } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import {HeadingNode} from "@lexical/rich-text";
import CustomImagePlugin from "./nodes/Plugins/CustomImagePlugin";
import ImagePlugin from "./nodes/Plugins/ImagePlugin";


import ImageNode from "./nodes/ImageNode";
import ToolBar from "./Toolbar";
import { $getRoot } from "lexical";

import { saveJournal } from "../../../../API/Api";
import { useAuth } from "../../../Context/Authcontext";

// import {
//   $getRoot,
//   $getSelection,
//   $createParagraphNode,
//   $insertNodeToNearestRoot,
//   $isRangeSelection,
//   FORMAT_TEXT_COMMAND,
//   FORMAT_ELEMENT_COMMAND,
//   INDENT_CONTENT_COMMAND,
//   OUTDENT_CONTENT_COMMAND,
// } from "lexical";


class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return <div>Error: {this.state.error.message}</div>;
    }
    return this.props.children;
  }
}

/* theme for mapping css classes to lexical rols */
const theme = {
    paragraph: 'editor-paragraph',
    heading: 'editor-heading',
}

const EditorInner = ({title}) => {
    const [editor] = useLexicalComposerContext();
    const [editorState, setEditorState] = useState(null);
    const [textContent, setTextContent] = useState('')
    const [hasContent, setHasContent] = useState(false);

    const {session} = useAuth();

    const handleClickSave = async(e, title) =>{
        e.stopPropagation();
        // console.log(editorState);
        const formdata = new FormData();
        if(title && editorState){
            formdata.append('title', title)
            formdata.append('content', editorState)
        }
        const saveData = await saveJournal(session?.access_token, formdata)

        if(saveData){
            console.log(saveData)
        }
    }

    const onchange = useCallback((state) => {
        const jsonb = JSON.stringify(state.toJSON());
        setEditorState(jsonb)

        state.read(() => {
            const root = $getRoot();
            // const image_node = root.getChildren().find(type => type.__type === 'image')
            // console.log(image_node.__src)

            const text = root.getTextContent().trim();
            if(text){
                setTextContent(text)
            }

            const children = root.getChildren();

            const hasEnoughParagraphNodes = children.length > 1
            const hasParargraphSize = children[0]?.__size > 0

            const hasContent = hasParargraphSize || hasEnoughParagraphNodes
            console.log(hasContent)

            setHasContent(hasContent); //set the state boolean of hasContent depends on hasParargraphSize || hasEnoughParagraphNodes
        })
    }, [])

    return(
        <>
        <div className="editor-shell">

            <RichTextPlugin
            contentEditable={
            <ContentEditable 
            className="editor-input" 
            aria-placeholder="Write your thoughts here..." 
            placeholder={<div className="editor-placeholder">Write your thoughts here...</div>}/>
            }
            ErrorBoundary={LexicalErrorBoundary}
            />
            {/* <CustomImagePlugin/> */}
            <ImagePlugin/>
            <HistoryPlugin/>
            <OnChangePlugin onChange={onchange}/>

        </div>

        <div className='editor-lower-part-container'>
            <ToolBar/>
            <button disabled={!title || !hasContent} onClick={(e) => handleClickSave(e, title)} className={title && hasContent ? 'editor-save-bttn' : 'editor-save-bttn-disabled'}>
                Save
            </button>
        </div>
        </>
    )
}

const RichTextEditor = ({title}) =>{
    const initaConfig = {
        namespace: "MyLexicalEditor",
        theme,
        //register nodes
        nodes: [ImageNode, HeadingNode ],
        onError(error){
            throw error;
        },
    };

    return (
        <ErrorBoundary>
        <LexicalComposer initialConfig={initaConfig}>
            <EditorInner title={title}/>
        </LexicalComposer>
        </ErrorBoundary>
    )
}

export default RichTextEditor;