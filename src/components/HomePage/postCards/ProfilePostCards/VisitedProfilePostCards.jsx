import {useLocation, useNavigate } from 'react-router-dom';
import './profilepostcards.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { MoonLoader } from 'react-spinners';
import ParseContent from '../parseData';
import { useInView } from 'react-intersection-observer';
import { handleCLickContent } from '../../../../../helpers/handleClicks';
import { useAuth } from '../../../../Context/useAuth';
import { getVisitedUserJournals } from '../../../../../API/Api';

const VisitedProfilePostCards = () =>{
    const location = useLocation();
    const userData = location.state;
    const {user} = useAuth();

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

    useEffect(() =>{
        console.log(journalData)
    },[journalData])

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
                    <div key={index} className='profile-postcards'>
                        <div className='user-profile-card-content'>

                            <div className="user-info">
                                <div className='user-info-child-container'>
                                    <div className='user-avatar-container'>
                                        <img src={journal.users.image_url || '/assets/profile.jpg'} alt="user-profile" loading='lazy' className="user-info-avatar"/>
                                    </div>

                                    <div className="user-name-container">
                                        <p className="user-newsfeed-name"> {journal.users.name}</p>
                                    </div>

                                    <div className="name-info-separator">
                                        •
                                    </div>

                                    <div className="user-info-email-container">
                                        <p className="user-info-email"> {journal.users.user_email}</p>
                                    </div>

                                    <div className="name-info-separator">
                                        •
                                    </div>

                                    <div className="user-post-date-container">
                                        <p className="user-post-date">{new Date(journal.created_at).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                        </p>
                                    </div>
                                </div>

                                <div className="user-post-settings">
                                    <svg  xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>
                                </div>
                            </div>

                            <div onClick={(e) => clickContent(
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
                                        <h2 className="feed-title">{journal.title.length > 40 ? journal.title.substring(0, 40) : journal.title}</h2>
                                    </div>
                                    <p className="feed-text-content">{parsedContent?.slicedText}</p>
                                </div>  

                                <div className="feed-image-content-container">
                                    <img loading='lazy' className="journal-image" src={parsedContent?.firstImage?.src || '/assets/no-image.png'} alt="preview image" />
                                </div>

                            </div>
                        </div>
                    </div>
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