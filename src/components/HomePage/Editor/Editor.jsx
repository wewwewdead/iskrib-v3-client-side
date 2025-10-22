import './editor.css';
import { motion, AnimatePresence} from "framer-motion";
import { useEffect, useRef, useState } from 'react';
import RichTextEditor from './RichTextEditor.jsx';

const Editor=({onClose}) =>{
    const inputRef = useRef();

    const [title, setTitle] = useState('')
    const [imgUrl, setImgUrl] = useState('');

    const handleClickUploadPhoto = (e) => {
        e.stopPropagation();
        if(inputRef.current){
            inputRef.current.click()
            inputRef.current.value = ''
        }
    }

    const handleOnChange = (e) =>{
        e.stopPropagation();
        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onloadend = () => {
                setImgUrl(reader.result)
            }
            reader.readAsDataURL(file);
        }
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

                <RichTextEditor title={title}/>
            </motion.div>
        </div>
        </>
    )
}
export default Editor;