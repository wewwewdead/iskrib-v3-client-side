import './editor.css';
import { motion, AnimatePresence} from "framer-motion";
import React, { useEffect, useRef, useState } from 'react';
import RichTextEditor from './RichTextEditor.jsx';
import ImageNode from './nodes/ImageNode.jsx';
import {HeadingNode} from "@lexical/rich-text";
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import EditorInner from './RichTextEditor.jsx';


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

const Editor=({onClose}) =>{
    const inputRef = useRef();
    const [title, setTitle] = useState('')
    const [editor] = useLexicalComposerContext();

    /* theme for mapping css classes to lexical rols */
    const theme = {
        paragraph: 'editor-paragraph',
        heading: 'editor-heading',
    }

    const initaConfig = {
        namespace: "MyLexicalEditor",
        theme,
        //register nodes
        nodes: [ImageNode, HeadingNode ],
        onError(error){
            throw error;
        },
    }

    return(
        <>
        <div className='editor-parent-container'>

            <motion.div 
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1, transition: {type: 'tween', duration: 0.3}}}
            exit={{scale: 0, opacity: 0, transition:{ type: 'tween', duration: 0.3}}}
            className='editor-container'
            >
                <div className='editor-close-bttn-container'>
                    <svg onClick={onClose} className='editor-close-bttn' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </div>

                <input value={title} onChange={(e) => setTitle(e.target.value)} className='content-title-input' type="text" placeholder='Title' />

                {/* <RichTextEditor title={title}/> */}
                <ErrorBoundary>
                    {/* <LexicalComposer initialConfig={initaConfig}> */}
                    <EditorInner onclose={onClose} title={title}/>
                    {/* </LexicalComposer> */}
                </ErrorBoundary>
            </motion.div>
        </div>
        </>
    )
}
export default Editor;