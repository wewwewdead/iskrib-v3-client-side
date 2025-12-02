import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import './notification.css';
import { useAuth } from '../../Context/useAuth';
import { MoonLoader } from 'react-spinners';
import { useEffect, useRef, useState } from 'react';
import NotificationCards from './notificationsCards';
import { AnimatePresence, motion } from 'framer-motion';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

const Notifications = () =>{
    const scrollRef = useRef();
    const navigate = useNavigate();
    const location = useLocation();

    const {user, session} = useAuth();
    const [showHeader, setShowHeader] = useState(true);

    const notificationLinks =[
        {
            className: 'all-notification-container',
            label: 'All',
            pathname: '/home/notifications',
            action: () => navigate('/home/notifications')
        },
        {
            className: 'unread-notification-container',
            label: 'Unread notifications',
            pathname: '/home/notifications/unreadNotification',
            action: () => navigate('/home/notifications/unreadNotification')
        }
    ]

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
            document.removeEventListener('scroll', scroll, true)
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
                <div className='first-container'>
                    <div onClick={(e) => handleClickBack(e)} className='back-button'>
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
                    </div>
            
                    <p className='notifications-header-text'>Notifications</p>
                </div> 

                <div className='second-container'>
                    {notificationLinks.map((link, index) => (
                        <div onClick={() => link.action()} key={index} className={link.className}>
                            <p style={{margin: 0, padding: 0, fontWeight: 560}}>{link.label}</p>
                            <div className={location.pathname === link.pathname ? 'tab-indicator' : ''}>

                            </div>
                        </div>
                    ))}
                    
                </div>
            </motion.div>
            </AnimatePresence>
        )}

        {/* create a notification cards component here! */}

        <Outlet/>
        </>
    )
}

export default Notifications;