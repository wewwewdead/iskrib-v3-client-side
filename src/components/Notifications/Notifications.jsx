import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import './notification.css';
import { useAuth } from '../../Context/Authcontext';
import { MoonLoader } from 'react-spinners';
import { useEffect, useRef, useState } from 'react';
import NotificationCards from './notificationsCards';
import { AnimatePresence, motion } from 'framer-motion';

const Notifications = () =>{
    const scrollRef = useRef();
    const {user, session} = useAuth();
    const [showHeader, setShowHeader] = useState(true);

    const handleClickBack = (e) =>{
        e.stopPropagation();
        window.history.back();
    }

    useEffect(() =>{
        const scroll = () =>{
            setShowHeader(false);
            if(scrollRef.current){
                clearTimeout(scrollRef.current);   
            }
            scrollRef.current = setTimeout(() => {
                setShowHeader(true)
            }, 500);
        }
        document.addEventListener('scroll', scroll, true);
        return () => {
            if(scrollRef.current){
                clearTimeout(scrollRef.current)
            }
            document.removeEventListener('scroll', scroll)
        }
    })

    return(
        <>
        {showHeader && (
            <AnimatePresence>
            <motion.div 
            className='notifications-header'
            initial={{opacity: 0}}
            animate={{opacity: 1, transition:{type: 'spring', stiffness: 300, damping: 25, mass: 0.8}}}
            exit={{ opacity: 0, y: -20,
                    transition: { 
                    duration: 0.2,
                    ease: "easeOut"
                    }
            }}
            >

                <div onClick={(e) => handleClickBack(e)} className='back-button'>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
                </div>
            
                <p className='notifications-header-text'>Notifications</p>
            </motion.div>
            </AnimatePresence>
        )}

        {/* create a notification cards component here! */}

        <NotificationCards/>
        </>
    )
}

export default Notifications;