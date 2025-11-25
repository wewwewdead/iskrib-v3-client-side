import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import './notification.css';
import { useAuth } from '../../Context/Authcontext';
import { MoonLoader } from 'react-spinners';
import { useEffect } from 'react';
import NotificationCards from './notificationsCards';

const Notifications = () =>{
    const {user, session} = useAuth();

    const handleClickBack = (e) =>{
        e.stopPropagation();
        window.history.back();
    }


    return(
        <>
        <div className='notifications-header'>

            <div onClick={(e) => handleClickBack(e)} className='back-button'>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
            </div>
            
            <p className='notifications-header-text'>Notifications</p>
        </div>

        {/* create a notification cards component here! */}

        <NotificationCards/>
        </>
    )
}

export default Notifications;