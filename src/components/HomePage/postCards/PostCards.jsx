import React, { useEffect, useState, useRef, use } from "react";
import { MoonLoader, BeatLoader } from "react-spinners";
import { motion, AnimatePresence, pipe,} from "framer-motion";
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import './postcards.css';
import { getJournals } from "../../../../API/Api";
import ParseContent from "./parseData";
import { useInView } from 'react-intersection-observer';
import CalculateText from "./calculateReadingTime";
import { useNavigate } from "react-router-dom";

const PostCards = () => {
    const navigate = useNavigate();
    const modalRef = useRef(null);
    const {ref, inView} = useInView({
        threshold: 0.2
    })
    const [postIdSettings, setPostIdSettings] = useState('');
    const scrollRefTimeOut = useRef(null)

    const cardIcons = [
        {
            label: <svg className="svg-like" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#5e5e5eff"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>,
            className: 'like-button',
            action: (e) => handleClickLike(e)
        },
        {
            label:<svg className="svg-comment" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#5e5e5eff"><path d="M440-400h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>,
            className: 'comment-button',
            action: (e) => console.log('clicked-comment')
        },
        {
            label: <svg className="svg-bookmark" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#5e5e5eff"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>,
            className: 'bookmark-button',
            action: (e) => console.log('clicked bookmark')
        }
    ]

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['journals'],
        queryFn: ({pageParam = null}) => getJournals(pageParam, 5),
        getNextPageParam: (lastPage) => {
            if(lastPage?.data?.length > 0) {
                const lastJournal = lastPage.data[lastPage?.data?.length - 1]; //get the last array of object using index 
                return new Date(lastJournal.created_at).toISOString();;
            }
            return undefined;
        } 
    })

    const handleClickSettings = (e, postId) =>{
        e.stopPropagation();
        setPostIdSettings(postId === postIdSettings ? null : postId)
    }

    const handleClickLike = (e) => {
        e.stopPropagation();
        console.log('liked')
    }

    useEffect(() =>{
        if(inView && !isFetchingNextPage && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, fetchNextPage, isFetchingNextPage, hasNextPage])


    useEffect(() => {
        const handleScroll = () => {
            console.log('scrolling')
            clearTimeout(scrollRefTimeOut.current);
            
            scrollRefTimeOut.current = setTimeout(() => {
                console.log('not scrolling')
            }, 300);
        }

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll)
            clearTimeout(scrollRefTimeOut.current)
        }
    }, [])

    useEffect(() => {
       const handleClickOutside = (e) =>{
        if(modalRef.current && !modalRef.current.contains(e.target)){
            setPostIdSettings(null)
        }
       }
       window.addEventListener('click', handleClickOutside)

       return() => {
        window.removeEventListener('click', handleClickOutside)
       }
    }, [])
    

    // if(isLoading) return <div className="loading-newsfeed-bg"><MoonLoader loading={isLoading} size={20} speedMultiplier={2}/></div>

    const journals = data?.pages?.flatMap((page) => page.data || []) || [];

    if(isLoading) {
        return(
            <>
            <div className="postcards-parent-loading-container">
                <MoonLoader loading={isLoading} color="rgba(0, 0, 0, 1)" speedMultiplier={1} size={20}/>
            </div>
            </>
        )
    }

    if(journals?.length === 0) {
        return(
            <div className="postcards-parent-container">
                <div>No post availabe...</div>
            </div>     
        ) 
    }
    return(
        <>
        <AnimatePresence>
        <div className="postcards-parent-container">
            {journals.map((journal, index) => {
                const parsedContent = ParseContent(journal.content)

                return(
                    <div className="cards" key={journal.id}>
                        <div className="card-content">

                            <div className="user-info">
                                <div className="user-info-child-container">
                                    <div onClick={() => navigate('/profile')} className="user-avatar-container">
                                        <img loading="lazy" className="user-info-avatar" src={journal.users.imageUrl || '../../../src/assets/profile.jpg'} alt="" />
                                    </div>
                                    <div onClick={() => navigate('/profile')} className="user-name-container">
                                        <p className="user-newsfeed-name">{journal.users.name}</p>
                                    </div>

                                    <div className="name-info-separator">
                                        •
                                    </div>

                                    <div className="user-info-email-container">
                                        <p className="user-info-email">{journal.users.user_email}</p>
                                    </div>

                                    <div className="name-info-separator">
                                        •
                                    </div>

                                    <div className="user-post-date-container">
                                        <p className="user-post-date">{new Date(journal.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</p>
                                    </div>
                                </div>

                                <div className="user-post-settings">
                                    <svg onClick={(e) => handleClickSettings(e, journal.id)} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>
                                    {postIdSettings === journal.id && (
                                        <motion.div 
                                        initial={{opacity:0 ,scale:0}}
                                        animate={{opacity:1, scale:1, transition: {type: "tween", duration: 0.3}}}
                                        exit={{opacity:0, scale:0, transition: {type: "tween", duration: 0.3}}}
                                        ref={modalRef} className="setting-modal"
                                        >
                                            <p onClick={() => console.log('clicked')}>{journal.title}</p>
                                        </motion.div>
                                    )}
                                </div>
                                
                            </div>

                            <div className="content-container">

                                <div className="feed-text-content-container">
                                    <div className="feed-title-content">
                                        <h2 className="feed-title">{journal.title.length > 40 ? `${journal.title.substring(0, 40)}...` : journal.title}</h2>
                                    </div>
                                    <p className="feed-text-content">{parsedContent.slicedText}</p>
                                </div>

                                <div className="feed-image-content-container">
                                    <img className="journal-image" src={parsedContent.firstImage?.src || '../../../src/assets/no-image.png'} alt="journal image" />
                                </div>

                            </div>
                            
                        </div>

                        <div className="card-icons-container">
                            {cardIcons && (
                                cardIcons.map((icon, index) =>(
                                    <div onClick={icon.action} id="card-icons" key={index} className={icon.className}>
                                        {icon.label}
                                    </div>
                                ))
                            )}

                            <div className="reading-time-container">
                                <p className="reading-time-text">{CalculateText(parsedContent.wholeText)}</p>
                            </div>
                        </div>
                    </div>
                )
            })}

             <div className="inview" ref={ref}>
                <MoonLoader loading={isFetchingNextPage} color="rgba(255, 255, 255, 0.64)" speedMultiplier={1} size={20}/>
            </div>
        </div>
       </AnimatePresence>
        </>
    )
}

export default PostCards;