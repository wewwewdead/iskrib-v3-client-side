import { useEffect, useRef } from 'react';
import './mobilesidebarlink.css';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../Context/Authcontext';
import { useNavigate } from 'react-router-dom';

const MobileSidebarLink = ({onclose}) => {
    const {user, signOut} = useAuth();
    const navigate = useNavigate();

    const clickProfile = () =>{
        navigate('/profile')
    }

    const handleClose =(e) =>{
        e.stopPropagation();
        onclose();
    }
    return(
        <>
        <AnimatePresence>
        <div onClick={(e) => handleClose(e)} className="mobile-sidebar-bg">
            <motion.div 
            initial={{x: -30}}
            animate={{opacity: 1, x: 0, transition: {duration: 0.18, ease: 'easeOut'}}}
            exit={{x: -30, transition: {duration: 0.14, ease: 'easeIn'}}}
            onClick={(e) => e.stopPropagation()} className='mobile-sidebar-link-container'
            >
                <div className='sidebar-profile-container'>
                
                    <div onClick={(e) => clickProfile()} className='sidebar-profile-avatar-container'>
                        <img className='sidebar-profile-avatar' src={user?.userData?.[0].image_url || '/assets/profile.jpg'} alt="" />
                    </div>

                    <div onClick={signOut} className='sidebar-signout-bttn'>
                        Sign Out
                    </div>
                    
                </div>
                <div onClick={(e) => clickProfile()} className='sidebar-profile-metadata'>
                    <p>{user?.userData?.[0].name}</p>
                    <p style={{fontWeight: 500, fontSize: '0.8rem'}}>{user?.userData?.[0].user_email}</p>
                </div>

            </motion.div>
        </div>
        </AnimatePresence>
        </>
    )
}

export default MobileSidebarLink;