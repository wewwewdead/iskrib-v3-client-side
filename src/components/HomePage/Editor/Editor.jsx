import './editor.css';
import { motion, AnimatePresence} from "framer-motion";
import React, { useCallback, useEffect, useRef, useState } from 'react';
import RichTextEditor from './RichTextEditor.jsx';
import ImageNode from './nodes/ImageNode.jsx';
import {HeadingNode} from "@lexical/rich-text";
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import EditorInner from './RichTextEditor.jsx';
import { $getRoot } from 'lexical';
import { deleteJournalImage } from '../../../../API/Api.js';
import { useAuth } from '../../../Context/Authcontext.jsx';

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
    const {session} = useAuth();

    const [title, setTitle] = useState('')
    const [editor] = useLexicalComposerContext();
    const [uploadedImagePaths, setUploadedImagePaths] = useState([]);

    const addUploadedImagePath = useCallback((imagePath) =>{
      // console.log(imagePath)
      setUploadedImagePaths((prev) => [...prev, imagePath]);
    }, [])
    
    const handleCloseEditor = useCallback(async() => { 
      if(uploadedImagePaths.length > 0){
        console.log(uploadedImagePaths);
        const message = await deleteJournalImage(session?.access_token, uploadedImagePaths)
        if(message){
          console.log(message.message)
        }

      }
        editor.update(() => {
            const state = editor.getEditorState().toJSON();
            console.log(state)
            
            const root = $getRoot();
            root.clear();
            onClose();
        })
    }, [editor, onClose, uploadedImagePaths])

    const handleCloseEditorOnSave = useCallback(async() => {
      editor.update(() => {
            const state = editor.getEditorState().toJSON();
            console.log(state)
            
            const root = $getRoot();
            root.clear();
            onClose();
      })
    }, [onClose, editor])

    return(
        <>
        <div className='editor-parent-container'>

            <motion.div 
            initial={{scale: 0, opacity: 0.8}}
            animate={{scale: 1, opacity: 1}}
            exit={{scale: 0.8, opacity: 0,}}
            transition={{type: 'spring', stiffness: 260, damping: 25}}
            className='editor-container'
            >
                <div className='editor-close-bttn-container'>
                    <svg onClick={() => handleCloseEditor()} className='editor-close-bttn' xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                </div>

                <input value={title} onChange={(e) => setTitle(e.target.value)} className='content-title-input' type="text" placeholder='Title' />

                <ErrorBoundary>
                    {/*this area will be the text area of an text editor */}
                    <EditorInner addUploadImagesPath={addUploadedImagePath} onclose={handleCloseEditor} onCloseOnSave={handleCloseEditorOnSave} title={title}/>
                </ErrorBoundary>
            </motion.div>
        </div>
        </>
    )
}
export default Editor;