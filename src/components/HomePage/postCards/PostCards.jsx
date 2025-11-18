import React, { useEffect, useState, useRef, use } from "react";
import { MoonLoader, BeatLoader } from "react-spinners";
import { motion, AnimatePresence,} from "framer-motion";
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import './postcards.css';
import {getJournals,} from "../../../../API/Api";
import ParseContent from "./parseData";
import { useInView } from 'react-intersection-observer';
import CalculateText from "./calculateReadingTime";
import { useNavigate, } from "react-router-dom";

import { useAuth } from "../../../Context/Authcontext";
import { useBookMarkMutation, useLikeMutation } from "../../../utils/useMutation";
import formatCounts from "../../../../helpers/fomatCounts";
import debounce from "../../../../helpers/debounce";
import { handleClickProfile, handleCLickContent } from "../../../../helpers/handleClicks";


const PostCards = () => {
    const {session, user} = useAuth();
    const queryClient = useQueryClient();

    const navigate = useNavigate();
    const modalRef = useRef(null);
    const timeOutRef = useRef();
    const {ref, inView} = useInView({
        threshold: 0.2
    })
    const [postIdSettings, setPostIdSettings] = useState('');
    const [showHeaders, setShowHeaders] = useState(true);

    const handleClickUserProfile = handleClickProfile(navigate);
    const clickContent = handleCLickContent(navigate);


    const header_links = [
        {label: 'For You'},
        {label: 'Following'},
        {label: 'Trending'},
    ]

    const cardIcons = [
        {
            likeAction: (isLiked) => (<svg className="svg-like" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill={isLiked ? 'rgb(255, 116, 116)' : "#5e5e5eff"}><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>),
            className: 'like-button',
            action: (e, journalId) => {debounceClickLike(e, journalId)},
            countLike: (count) => <p style={{padding:'0', margin: '0', fontSize: '0.8rem'}}>{formatCounts(count)}</p>
        },
        {
            label: <svg className="svg-comment" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#5e5e5eff"><path d="M440-400h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>,
            className: 'comment-button',
            commentAction: (e, jsonbContent, wholeText, title, userId, name, avatar, created_at, journalId, isLiked, commentsCount, isBookmarked, likeCount, bookmarkCount) => clickContent(e, jsonbContent, wholeText, title, userId, name, avatar, created_at, journalId, isLiked, commentsCount, isBookmarked, likeCount, bookmarkCount ),
            countComments: (count) => <p style={{padding: '0', margin: '0', fontSize: '0.8rem'}}>{formatCounts(count)}</p>
        },
        {
            checkBookrmark: (isBookmarked) => <svg className="svg-bookmark" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill={isBookmarked ? 'rgb(72, 208, 135)' : "#5e5e5eff"}><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>,
            className: 'bookmark-button',
            bookmarkAction: (e, journalId) => debounceClickBookmark(e, journalId),
            countBookmarks: (count) => <p  style={{padding: '0', margin: '0', fontSize: '0.8rem'}}>{formatCounts(count)}</p>
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
        queryFn: ({pageParam = null}) => getJournals(pageParam, 5, user?.userData?.[0].id),
        getNextPageParam: (lastPage) => {
            if(lastPage?.hasMore) {
                const lastJournal = lastPage.data[lastPage?.data?.length - 1]; //get the last array of object using index 
                return new Date(lastJournal.created_at).toISOString();
            }
            return undefined;
        } ,
        enabled: !!user?.userData?.[0].id
    })

    const handleClickSettings = (e, postId) =>{
        e.stopPropagation();
        setPostIdSettings(postId === postIdSettings ? null : postId)
    }

    const mutationLike = useLikeMutation(session, user?.userData?.[0]?.id);

    const handleClickLike = async(e, journalId) => {
        e.stopPropagation();
        console.log(journalId)
        mutationLike.mutate({journalId}) //passing this into mutationFn {journalId: the id}
    }
    const debounceClickLike = debounce(handleClickLike, 300)


    const mutationBookmark = useBookMarkMutation(session, user?.userData?.[0]?.id);

    const handleClickBookmark = async(e, journalId,) =>{
        e.stopPropagation();
        console.log(journalId)
        mutationBookmark.mutate({journalId});
    }

    const debounceClickBookmark = debounce(handleClickBookmark, 100);

    useEffect(() =>{
        if(inView && !isFetchingNextPage && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, fetchNextPage, isFetchingNextPage, hasNextPage])


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

    useEffect(() =>{
        const scroll = (e) =>{
            setShowHeaders(!showHeaders)

            if(timeOutRef.current){
                clearTimeout(timeOutRef.current);
            }
            timeOutRef.current = setTimeout(() => {
                setShowHeaders(showHeaders)
            }, 500);
        }
        document.addEventListener('scroll', scroll, true);
        return() =>{
            if(timeOutRef.current){
                clearTimeout(timeOutRef.current);
            }
            document.removeEventListener('scroll', scroll, true)
        }
    }, [])

    useEffect(() =>{
        console.log(data)
    }, [data])

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
            {showHeaders && (
                <motion.div 
                className="newsfeed-header"
                initial={{opacity: 0}}
                animate={{opacity: 1, transition: {type: 'spring', stiffness: 300, damping: 25, mass: 0.8}}}
                exit={{ opacity: 0, y: -20,
                        transition: { 
                        duration: 0.2,
                        ease: "easeOut"
                        }
                }}
                >

                    {header_links.map((header_link, index) => (
                        <div key={index} className="header-links">
                            {header_link.label}
                        </div>
                    ))}

                </motion.div>
            )}
            </AnimatePresence>
        
        <AnimatePresence>
        <div className="postcards-parent-container">
            {journals.map((journal, index) => {
                const parsedContent = ParseContent(journal.content)
                const isLiked = journal?.has_liked;
                const isBookmarked = journal?.has_bookmarked;
                return(
                    <div className="cards" key={journal.id}>
                        <div className="card-content">

                            <div className="user-info">
                                <div className="user-info-child-container">
                                    <div onClick={(e) => handleClickUserProfile(e, user?.userData?.[0].id, journal.users.id)} className="user-avatar-container">
                                        <img loading="lazy" className="user-info-avatar" src={journal.users.image_url || '../../../src/assets/profile.jpg'} alt="" />
                                    </div>
                                    <div onClick={(e) => handleClickUserProfile(e, user?.userData?.[0].id, journal.users.id)} className="user-name-container">
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

                            <div onClick={(e) => clickContent(e, journal.content,parsedContent.wholeText, journal.title, journal.users.id, journal.users.name, journal.users.image_url, journal.created_at, journal.id, journal.has_liked, journal.comment_count?.[0]?.count, journal.has_bookmarked, journal.like_count?.[0].count, journal.bookmark_count?.[0].count)} className="content-container">

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
                                    <div key={index} className="icon-container">

                                        {icon.likeAction && (
                                            <div onClick={(e) => icon.action(e, journal.id)} id="card-icons" className={icon.className}>
                                                {icon.likeAction && icon.likeAction(isLiked)}
                                            </div>
                                        )}

                                        {icon.commentAction && (
                                            <div onClick={(e) => icon.commentAction(e, journal.content,parsedContent.wholeText, journal.title, journal.users.id, journal.users.name, journal.users.image_url, journal.created_at, journal.id, journal.has_liked, journal.comment_count?.[0]?.count, journal.has_bookmarked, journal.like_count?.[0].count, journal.bookmark_count?.[0].count)} id="card-icons" className={icon.className}>
                                                {icon.label} 
                                            </div>
                                        )}

                                        {icon.bookmarkAction && (
                                            <div onClick={(e) => icon.bookmarkAction(e, journal.id)} className={icon.className}>
                                                {icon.checkBookrmark(isBookmarked)} 
                                            </div>
                                        )}
                                        
                                        {icon.countLike && icon.countLike(journal.like_count?.[0].count)} 
                                        {icon.countComments && icon.countComments(journal.comment_count?.[0]?.count)}
                                        {icon.countBookmarks && icon.countBookmarks(journal.bookmark_count?.[0].count)}
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