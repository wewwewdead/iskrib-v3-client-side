import React, { useEffect, useState, useRef, use } from "react";
import { MoonLoader, BeatLoader } from "react-spinners";
import { motion, AnimatePresence, pipe,} from "framer-motion";
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import './postcards.css';
import { getJournals } from "../../../../API/Api";
import ParseContent from "./parseData";
import { useInView } from 'react-intersection-observer';
import CalculateText from "./calculateReadingTime";

const PostCards = () => {
    const {ref, inView} = useInView({
        threshold: 0.2
    })

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

    useEffect(() =>{
        if(inView && !isFetchingNextPage && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, fetchNextPage, isFetchingNextPage, hasNextPage])


    

    

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
        <div className="postcards-parent-container">
            {journals.map((journal, index) => {
                const parsedContent = ParseContent(journal.content)

                return(
                    <div className="cards" key={journal.id}>
                        <div className="card-content">

                            <div className="user-info">
                                <div className="user-avatar-container">
                                    <img className="user-info-avatar" src={journal.users.imageUrl || '../../../src/assets/profile.jpg'} alt="" />
                                </div>
                                <div className="user-name-container">
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

                            <div className="content-container">

                                <div className="feed-text-content-container">
                                    <div className="feed-title-content">
                                        <h2 className="feed-title">{journal.title.length > 30 ? `${journal.title.substring(0, 30)}...` : journal.title}</h2>
                                    </div>
                                    <p className="feed-text-content">{parsedContent.slicedText}</p>
                                </div>

                                <div className="feed-image-content-container">
                                    <img className="journal-image" src={parsedContent.firstImage?.src || '../../../src/assets/no-image.png'} alt="journal image" />
                                </div>

                            </div>
                            
                        </div>

                        <div className="card-icons-container">
                            <div className="card-icons">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#5e5e5eff"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
                            </div>
                            <div className="card-icons">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#5e5e5eff"><path d="M440-400h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>
                            </div>
                            <div className="card-icons">
                                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#5e5e5eff"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>
                            </div>

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
       
        </>
    )
}

export default PostCards;