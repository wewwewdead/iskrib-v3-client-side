import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import './notification.css';
import { useAuth } from '../../Context/Authcontext';
import { getNotifications } from '../../../API/Api';
import { MoonLoader } from 'react-spinners';
import { useEffect } from 'react';

const Notifications = () =>{
    const queryClient = useQueryClient();
    const {user, session} = useAuth();

    const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ['getNotifications', user?.userData?.[0].id],
        queryFn: ({pageParam = null, queryKey}) => getNotifications(queryKey[1], pageParam, 5),
        getNextPageParam: (lastpage) =>{
            if(lastpage?.hasMore){
                const lastNotification = lastpage?.data[lastpage?.data.length - 1];
                return new Date(lastNotification.created_at).toISOString();

            }
            return undefined;
        },
        enabled: !!user?.userData?.[0].id,
        refetchOnWindowFocus: false
    })

    const handleClickBack = (e) =>{
        e.stopPropagation();
        window.history.back();
    }


    const notifications = data?.pages?.flatMap((page) => page?.data) || [];

    if(notifications.length === 0 && !isLoading){
        return(
            <div className='notification-loading-container'>
                No notifications availabe
            </div>
        )
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

        <div className='notifications-container'>
            hello
        </div>
        </>
    )
}

export default Notifications;