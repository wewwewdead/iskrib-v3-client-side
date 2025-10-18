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
    const [showEditorState, setShowEditorState] = useState(null);

    const handleClickSave = (e, title) =>{
        e.stopPropagation();
        const currentState = editor.getEditorState();
        const jsonb = currentState.toJSON();
        setShowEditorState(jsonb)
        console.log(jsonb)
    }

    const onchange = useCallback((state) => {
        const jsonb = state.toJSON();
        // console.log(jsonb) //log the editor state for demo
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
            <div onClick={(e) => handleClickSave(e, title)} className={title ? 'editor-save-bttn' : 'editor-save-bttn-disabled'}>
                Save
            </div>
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