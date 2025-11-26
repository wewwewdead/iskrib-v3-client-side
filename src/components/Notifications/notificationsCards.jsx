import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "../../Context/Authcontext";
import { useInView } from "react-intersection-observer";
import { MoonLoader } from "react-spinners";
import { getNotifications } from "../../../API/Api";
import { useEffect, useRef } from "react";
import FormatNotificationType from "../../../helpers/formatNoficationType";
import ParseContent from "../HomePage/postCards/parseData";
import formatPostDate from "../../../helpers/formatDateString";

const NotificationCards = () =>{
    const {user, session} = useAuth();
    const {ref, inView} = useInView({
        threshold: 0.2
    })

    const scrollToTop = useRef();

    const iconArray = [
        {
            type: 'like', 
            icon: 
            <svg className="svg-like" xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 24 24" fill="none">
                <g id="style=fill">
                <g id="like">
                <path id="Subtract" fillRule="evenodd" clipRule="evenodd" d="M15.9977 5.63891C16.2695 4.34931 15.433 3.00969 14.2102 2.59462C13.6171 2.37633 12.9892 2.4252 12.4662 2.60499C11.9449 2.78419 11.4461 3.12142 11.1369 3.58441L11.136 3.58573L7.49506 9.00272C8.05104 9.29585 8.43005 9.87954 8.43005 10.5518V21.3018H6.91003V21.3018H16.6801C18.2938 21.3018 19.2028 20.2977 19.8943 19.202C20.6524 18.0009 21.1453 16.7211 21.5116 15.5812C21.6808 15.0546 21.8252 14.5503 21.9547 14.0984L21.9863 13.9881C22.126 13.5007 22.2457 13.0904 22.366 12.7549C22.698 11.8292 22.5933 10.9072 22.067 10.2072C21.5476 9.5166 20.7005 9.15175 19.76 9.15175H15.76C15.6702 9.15175 15.6017 9.11544 15.5599 9.06803C15.5238 9.02716 15.4831 8.95058 15.502 8.81171L15.9977 5.63891Z" fill={'rgb(255, 116, 116)'}/>
                <path id="rec" d="M2.18005 10.6199C2.18005 10.03 2.62777 9.55176 3.18005 9.55176H6.68005C7.23234 9.55176 7.68005 10.03 7.68005 10.6199V21.3018H3.18005C2.62777 21.3018 2.18005 20.8235 2.18005 20.2336V10.6199Z" fill={'rgb(255, 116, 116)'}/>
                </g>
                </g>
            </svg>,
        },
        {
            type: 'comment',
            icon:
            <svg className="svg-comment" xmlns="http://www.w3.org/2000/svg" width="30px" height="30px" viewBox="0 0 24 24" fill="#5e5e5eff">
                <g id="style=fill">
                <g id="comment">
                <path id="Subtract" fillRule="evenodd" clipRule="evenodd" d="M11.9862 0.763672C6.07454 0.763672 1.23621 5.36133 1.23621 11.1034C1.23621 13.5057 2.10188 15.7237 3.55066 17.4735C5.46882 19.8566 8.48271 21.3843 11.8522 21.4238L11.8878 21.4367C11.9902 21.4735 12.1385 21.5265 12.3236 21.5916C12.6936 21.7216 13.2115 21.9001 13.8035 22.0941C14.9799 22.4797 16.4767 22.9358 17.6892 23.1894C18.303 23.3178 18.9306 23.1718 19.4096 22.8608C19.8872 22.5507 20.3019 22.0126 20.3019 21.3173C20.3019 20.9046 20.1354 20.4987 19.9732 20.1857C19.8007 19.8529 19.5794 19.5251 19.371 19.2448C19.2691 19.1076 19.1676 18.9782 19.0724 18.8609C21.3193 16.9815 22.7362 14.2061 22.7362 11.1034C22.7362 7.55126 20.8865 4.4319 18.073 2.58609C16.3321 1.4227 14.2426 0.763672 11.9862 0.763672ZM18.3637 6.03728C18.1546 5.67972 17.6953 5.55937 17.3377 5.76847C16.9801 5.97757 16.8598 6.43694 17.0689 6.7945C17.8131 8.0671 18.2362 9.53599 18.2362 11.1034C18.2362 12.6662 17.8138 14.1316 17.0693 15.4016C16.8598 15.7589 16.9797 16.2184 17.337 16.4279C17.6943 16.6374 18.1538 16.5175 18.3633 16.1602C19.2385 14.6673 19.7362 12.941 19.7362 11.1034C19.7362 9.26158 19.238 7.53236 18.3637 6.03728Z" fill="rgb(47, 154, 255)"/>
                </g>
                </g>
            </svg>,
        }
    ]

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

    useEffect(() =>{
        if(scrollToTop.current && !isLoading){
            scrollToTop.current.scrollIntoView({behavior: 'smooth'});
        }
    }, [isLoading])

    useEffect(() =>{
        if(hasNextPage && !isFetchingNextPage && inView){
            console.log(hasNextPage)
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, inView, fetchNextPage])

    const notifications = data?.pages?.flatMap((page) => page?.data) || [];

    useEffect(() =>{
        console.log(notifications)
    }, [notifications])

    if(notifications.length === 0 && !isLoading){
        return(
            <div className='notification-loading-container'>
                No notifications availabe
            </div>
        )
    }
    if(isLoading){
        return(
            <div className="notification-loading-container">
                <MoonLoader size={25} loading={isLoading}/>
            </div>
        )
    }

    return(
        <>
        <div ref={scrollToTop}/>
        <div className="notifications-container">
            {notifications?.map((notification) => {
                const parsedContent = ParseContent(notification?.journals.content)

                return(
                <div key={notification.id} className={notification.read ? "notification-cards" : "notification-cards-unread"}>
                    
                    <div className="notification-cards-child-container">

                        <div className="notification-icon-container">
                            {iconArray.map((icon, index) => (
                                <div className="notification-icon" key={index}>
                                    {icon.type === notification.type ? icon.icon : null}
                                </div>
                            ))}
                        </div>

                        <div className="notification-contents-container">
                            <div className="notification-sender-user-metadata">
                                <div className="notif-sender-profilepic-container">
                                    <img loading="lazy" className="notif-sender-profilepic" src={notification?.sender_image_url || '../../src/assets/profile.jpg'} alt="notificataion sender profile picture" />
                                </div>

                                <div className="notif-sender-name-container">
                                    <p className="notif-sender-name">{notification.sender_name}</p>
                                    <p className="notif-type">{FormatNotificationType(notification?.type)}</p>
                                </div>

                                <div className="notification-date-container">
                                    <p className="notification-date">{formatPostDate(notification?.created_at)}</p>
                                </div>
                                
                            </div>
                            <div className="notification-content">
                                <div className="notification-content-text">
                                    <p className="notif-content-title">{notification?.journals.title}</p>
                                    <p className="notif-content-sliced-text">{parsedContent?.slicedText}</p>
                                </div>
                                <div className="notif-content-image-container">
                                        <img loading="lazy" className="notif-content-image" src={parsedContent?.firstImage.src || '../../src/assets/no-image.png'} alt="" />
                                </div>
                            </div>
                        </div>
                        
                    </div>

                </div>
                )
            })}
            <div className="notification-inview-container" ref={ref}>
                {isFetchingNextPage && (
                    <MoonLoader size={20}/>
                )}
                
            </div>
        </div>
        </>
    )
}

export default NotificationCards;