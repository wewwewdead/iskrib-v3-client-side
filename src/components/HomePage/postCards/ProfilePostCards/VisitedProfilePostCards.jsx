import {useLocation, useNavigate } from 'react-router-dom';
import './profilepostcards.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MoonLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import ParseContent from '../parseData';
import { useInView } from 'react-intersection-observer';
import { handleCLickContent } from '../../../../../helpers/handleClicks';
import { useAuth } from '../../../../Context/useAuth';
import { getVisitedUserJournals } from '../../../../../API/Api';
import { useAddViewsMutation } from '../../../../utils/useMutation';
import VerifiedBadge from '../../../Badge/VerifiedBadge';

const VisitedProfilePostCards = () =>{
    const location = useLocation();
    const userData = location.state;
    const {user, session} = useAuth();

    const navigate = useNavigate();

    const {ref, inView} = useInView({
        threshold: 0.2
    })

    const {data: journalData, isLoading: isLoadingJournals, isFetchingNextPage, fetchNextPage, hasNextPage,} = useInfiniteQuery({
        queryKey: ['visitedProfileJournals', userData?.userId, user?.userData?.[0]?.id],
        queryFn: ({pageParam = null, queryKey}) => getVisitedUserJournals(pageParam, 5, queryKey[1], queryKey[2]),
        getNextPageParam: (lastPage) => {
            if(lastPage.hasMore){
                const lastJournal = lastPage?.data[lastPage?.data.length - 1]
                return new Date(lastJournal.created_at).toISOString();
            } else {
                return undefined
            }
        },
        enabled: !!userData?.userId,
        refetchOnWindowFocus: false
    })

    const clickContent = handleCLickContent(navigate);
    const mutateViews = useAddViewsMutation(session);
    const viewContent = (e, jsonbContent,wholeText, title, userId, name, avatar, created_at, journalId, isLiked, commentsCount, isBookmarked, likesCount, bookmarksCount) =>{
        const formadata = new FormData();
        formadata.append('journalId', journalId)
        mutateViews.mutate(formadata);

        clickContent(e, jsonbContent,wholeText, title, userId, name, avatar, created_at, journalId, isLiked, commentsCount, isBookmarked, likesCount, bookmarksCount);
    }

    useEffect(() =>{
        console.log(userData)
    },[userData])

    useEffect(() =>{
        if(!isFetchingNextPage && hasNextPage && inView){
            fetchNextPage();
        }
    }, [inView, fetchNextPage, isFetchingNextPage, hasNextPage,])

    const journals = journalData?.pages.flatMap((page) => page.data) || [];


   if(isLoadingJournals){
        return(
            <>
            <div className='profile-postcards-loading-container'>
                <MoonLoader loading={isLoadingJournals} size={20} speedMultiplier={0.5}/>
            </div>
            </>
        )
    }
    

    if(journalData && !journals?.length > 0){
        return (
            <div className='profile-postcards-loading-container'>
                No post available!
            </div>
        )
    }

    return(
        <>
        <div className='profile-postcards-parent-container'>
            {journals.map((journal, index) => {
                const parsedContent = ParseContent(journal.content);

                return(
                    <motion.div
                        key={journal.id || index}
                        className='profile-postcards'
                        initial={{opacity: 0, y: 12}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.3, ease: 'easeOut'}}
                    >
                        {parsedContent?.firstImage && (
                            <img
                                className="card-image-banner"
                                src={parsedContent.firstImage.src}
                                alt=""
                                loading="lazy"
                                onClick={(e) => viewContent(
                                    e,
                                    journal?.content,
                                    parsedContent?.wholeText,
                                    journal?.title,
                                    userData?.userId,
                                    journal?.users?.name,
                                    journal?.users?.image_url,
                                    journal?.created_at,
                                    journal?.id,
                                    journal?.has_liked,
                                    journal?.comment_count?.[0].count,
                                    journal?.has_bookmarked,
                                    journal?.like_count?.[0].count,
                                    journal?.bookmark_count?.[0].count )}
                            />
                        )}

                        <div className='user-profile-card-content'>
                            <div onClick={(e) => viewContent(
                                e,
                                journal?.content,
                                 parsedContent?.wholeText,
                                 journal?.title,
                                 userData?.userId,
                                 journal?.users?.name,
                                 journal?.users?.image_url,
                                 journal?.created_at,
                                 journal?.id,
                                 journal?.has_liked,
                                 journal?.comment_count?.[0].count,
                                 journal?.has_bookmarked,
                                 journal?.like_count?.[0].count,
                                 journal?.bookmark_count?.[0].count )} className="content-container">

                                <div className='feed-text-content-container'>
                                    <div className='feed-title-content'>
                                        <h2 className="feed-title-profile-page">{journal.title.length > 55 ? `${journal.title.substring(0, 55)}...` : journal.title}</h2>
                                    </div>
                                    <p className="feed-text-content-profile-page">{parsedContent?.slicedText}</p>
                                </div>
                            </div>

                            <div className="card-icons-container">
                                <div className='user-info-child-container'>
                                    <div className={`user-avatar-container ${journal.users.badge === 'legend' ? 'avatar-ring-legend' : journal.users.badge === 'og' ? 'avatar-ring-og' : ''}`}>
                                        <img src={journal.users.image_url || '/assets/profile.jpg'} alt="user-profile" loading='lazy' className="user-info-avatar"/>
                                    </div>
                                    <div className="user-name-container">
                                        <p className="user-newsfeed-name-profile-page">{journal.users.name}</p>
                                        <VerifiedBadge badge={journal.users.badge} size={14} />
                                    </div>
                                    <div className="name-info-separator">•</div>
                                    <p className="user-post-date">{new Date(journal.created_at).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}</p>

                                    <div className="user-post-settings">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
            })}

            <div ref={ref} className='in-view-container'>
                {isFetchingNextPage && (
                    <MoonLoader size={20} loading={isFetchingNextPage}/>
                )}
            </div>

        </div>
        </>
    )
}

export default VisitedProfilePostCards;