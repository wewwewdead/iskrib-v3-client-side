import React, { useEffect, useState, useRef, use } from "react";
import { MoonLoader, BeatLoader } from "react-spinners";
import { motion, AnimatePresence,} from "framer-motion";
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import './postcards.css';
import { getJournals } from "../../../../API/Api";
import ParseContent from "./parseData";
import { useInView } from 'react-intersection-observer'

const PostCards = () => {
    const {ref, inView} = useInView({
        threshold: 0.1
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


    if(data?.length < 0) {
        return(
            <div className="postcards-parent-container">
                <div className="postcards-parent-container">No post availabe...</div>
            </div>     
        ) 
    }

    

    // if(isLoading) return <div className="loading-newsfeed-bg"><MoonLoader loading={isLoading} size={20} speedMultiplier={2}/></div>

    const journals = data?.pages?.flatMap((page) => page.data || []) || [];
    return(
        <>
        <div className="postcards-parent-container">
            
            {journals.map((journal, index) => {
                const parsedContent = ParseContent(journal.content)

                return(
                    <div className="cards" key={journal.id}>
                        <div className="card-content">
                            <p>{journal.users.name}</p>
                            {parsedContent.text.map((paragraph, pIndex) => (
                                <p key={pIndex}>{paragraph.substring(0, 100)}</p>
                            ))}
                            {parsedContent.images.length > 0 && (
                                <div className="card-image">
                                    <img src={parsedContent.firsImage.src} alt="Journal view image" className="jounral-view-image"/>
                                </div>
                            )}
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