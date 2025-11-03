import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import ImageNode from "../Editor/nodes/ImageNode";
import { HeadingNode } from "@lexical/rich-text";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { useLocation } from "react-router-dom";
import './contentviewer.css'
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const ContentView =() =>{
    const [showBackButton, setShowBackButton] = useState(true);

    const theme = {
      paragraph: 'editor-paragraph',
      heading: 'editor-heading',
    }
    const location = useLocation();
    const postData = location.state;

    const handleBackLocation = (e) =>{
        e.stopPropagation();
        window.history.back();
    }

    useEffect(() => {
        let timeOut;
        const hideBackBttn = () =>{
            setShowBackButton(false);
            clearTimeout(timeOut);
            
            timeOut = setTimeout(() =>{
                setShowBackButton(true)
            }, 300)
        }

        document.addEventListener('scroll', hideBackBttn, true);
        return () =>{
            document.removeEventListener('scroll', hideBackBttn, true)
            clearTimeout(timeOut);
        }
    }, [])

    return(
        <>
        <div className="content-viewer-container">

            {showBackButton && (
                <AnimatePresence>
                <motion.div
                className="back-button-container"
                initial={{opacity: 0}}
                animate={{opacity: 1, transition: {type: 'spring', stiffness: 300, damping: 25, mass: 0.8}}}
                exit={{ opacity: 0, y: -20,
                    transition: { 
                        duration: 0.2,
                        ease: "easeOut"
                    }
                }}
                >
                    <div onClick={(e) => handleBackLocation(e)} className="back-button">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
                    </div>
                    <p style={{padding: '0', margin: '0', fontSize: '1.2rem', fontWeight: '600'}}>Post</p>
                </motion.div>
                </AnimatePresence>
            )}

            <div className="content-title">
                <p>{postData.title}</p>
            </div>

            <LexicalComposer initialConfig={{
                namespace: "ContentViewer",
                theme: theme,
                editable: false,
                editorState: postData?.content,
                nodes: [HeadingNode, ImageNode],
                onError(error){
                    throw error
                },
            }}>
                <RichTextPlugin
                contentEditable={<ContentEditable 
                    className="content"
                    />
                }
                ErrorBoundary={LexicalErrorBoundary}
                />
            </LexicalComposer>
        </div>
        </>
    )
}

export default ContentView;