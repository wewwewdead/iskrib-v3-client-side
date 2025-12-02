import { useEffect, useState } from 'react';
import { getBookmarks } from '../../../API/Api';
import { useAuth } from '../../Context/useAuth';
import './bookmarks.css';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import ParseContent from '../HomePage/postCards/parseData';
import { MoonLoader } from 'react-spinners';
import { motion, AnimatePresence } from 'framer-motion';
import { handleCLickContent, handleClickProfile } from '../../../helpers/handleClicks';
import { useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import { useRef } from 'react';

const Bookmarks = () =>{
    const {user, session} = useAuth();
    const userId = user?.userData?.[0].id
    const navigate = useNavigate();

    const {ref: inviewRef, inView} = useInView({
        threshold: 0.2
    });
    const timeOutRef = useRef();
    const scrollToTop = useRef();

    const [bookmarkIdSettings, setBookmarkIdSettings] = useState('');
    const [showHeaders, setShowHeaders] = useState(true);

    const handleclickUserProfile = handleClickProfile(navigate);

    const handleClickBookmarkSettings = (e, journalId) => {
        e.stopPropagation();
        console.log(journalId)
        setBookmarkIdSettings(journalId === bookmarkIdSettings ? null : journalId)
    }

    const handleBackLocation = (e) =>{
        e.stopPropagation();
        window.history.back();
    }

    const handleClick = handleCLickContent(navigate);
    const handleClickSettings = (e) =>{
        e.stopPropagation();
        console.log(e.target)
    }
    const queryClient = useQueryClient();
    const {data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ['getBookmarks', userId],
        queryFn: ({queryKey, pageParam = null}) => getBookmarks(pageParam, 5, queryKey[1]),
        getNextPageParam: (lastPage) => {
            if(lastPage?.hasMore){
                const lastBookmark = lastPage.bookmarks[lastPage?.bookmarks?.length - 1];
                return new Date(lastBookmark.created_at).toISOString();
            } else {
                return undefined;
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
    })

    useEffect(() =>{
        if(inView && hasNextPage && !isFetchingNextPage){
            console.log('fetching')
            fetchNextPage();
        }

    }, [hasNextPage, fetchNextPage, isFetchingNextPage, inView])

    useEffect(() =>{
        const scroll = () =>{
            setShowHeaders(false)
            if(timeOutRef.current){
                clearTimeout(timeOutRef.current)      
            }
            timeOutRef.current = setTimeout(() =>{
                setShowHeaders(true)
            }, 500)
        }

        document.addEventListener('scroll', scroll, true)
        return () =>{
             if(timeOutRef.current){
                clearTimeout(timeOutRef.current);
            }  
            document.removeEventListener('scroll', scroll, true)
        }
    }, [])

    const journals = data?.pages?.flatMap((journal) => journal.bookmarks|| []);
    const totalBookmarks = data?.pages?.flatMap((journal) => journal.totalBookmarks)

    // useEffect(() =>{
    //     console.log(data)
    // }, [data])

    // useEffect(() =>{
    //     if(journals){
    //         console.log(journals)
    //     }
    // }, [journals])

    useEffect(() => {
        if(!isLoading && scrollToTop.current){
            scrollToTop.current.scrollIntoView({behavior: 'smooth'});
        }
    }, [isLoading])

    if(isLoading){
        return(
            <>
            <div className='bookmark-loading-container'>
                <MoonLoader loading={isLoading} size={25}/>
            </div>
            </>
        )
    }
    if(journals?.length === 0){
        return(
            <>
            <div className='bookmark-parent-container'>
                <p>No bookmarks available</p>
            </div>
            </>
        )
    }

    
    return(
        <>
        <div ref={scrollToTop}/>
        <AnimatePresence>
        {showHeaders && (
            <motion.div 
            className='boomarks-header'
            initial={{opacity: 0}}
            animate={{opacity: 1, transition:{ type: 'spring', stiffness: 300, damping: 25, mass: 0.8}}}
            exit={{opacity:0, y: -20, transition:{duration: 0.2, ease: 'easeInOut'}}}
            >
                <div onClick={(e) => handleBackLocation(e)} className='back-button'>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
                </div>
            
                <p className='bookmarks-header-text'>Bookmarks <span style={{fontSize: '1.2rem', fontWeight: '700'}}>({totalBookmarks})</span></p>
            </motion.div>
        )}
        </AnimatePresence>

        <div className='bookmark-parent-container'>
            {/* create a bookmarks cards component here! */}
            {journals?.map((journal, index) => {
                const parsedContent = ParseContent(journal.journals.content);
                return(
                    <div className='cards' key={index}>
                        <div className='card-content'>

                            <div className="user-info">
                                <div className='user-info-child-container'>

                                    <div onClick={(e) => handleclickUserProfile(e, user?.userData?.[0].id, journal.journals.user_id)} className="user-avatar-container">
                                        <img loading='lazy' src={journal?.journals?.users?.image_url || '../../src/assets/profile.jpg'} className="user-info-avatar" alt="" />
                                    </div>
                                    <div onClick={(e) => handleclickUserProfile(e, user?.userData?.[0].id, journal.journals.user_id)} className="user-name-container">
                                        <p className="user-newsfeed-name">{journal?.journals?.users?.name}</p>
                                    </div>

                                    <div className="name-info-separator">
                                        •
                                    </div>

                                    <div className="user-info-email-container">
                                        <p className="user-info-email">{journal?.journals?.users?.user_email}</p>
                                    </div>

                                    <div className="name-info-separator">
                                        •
                                    </div>

                                    <div className="user-post-date-container">
                                        <p className="user-post-date">{new Date(journal.created_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                    })} </p>
                                    </div>

                                </div>
                                
                                <div className="user-post-settings">
                                    <svg onClick={(e) => handleClickBookmarkSettings(e, journal.journals.id)} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>
                                    {bookmarkIdSettings === journal.journals.id && (
                                        <motion.div 
                                        onClick={(e) => {handleClickSettings(e)}}
                                        initial={{opacity:0 ,scale:0}}
                                        animate={{opacity:1, scale:1, transition: {type: "tween", duration: 0.3}}}
                                        exit={{opacity:0, scale:0, transition: {type: "tween", duration: 0.3}}}
                                        className="setting-modal"
                                        >
                                            <p>{journal.journals.title}</p>
                                        </motion.div>
                                    )}
                                </div>

                            </div>

                            <div onClick={(e) => handleClick(
                                e,
                                journal.journals.content, 
                                parsedContent?.wholeText, 
                                journal.journals.title, 
                                journal.journals.user_id,
                                journal.journals.users.name, 
                                journal.journals.users.image_url, 
                                journal.journals.created_at,
                                journal.journals.id,
                                journal.journals.has_liked, 
                                journal.journals.comment_count?.[0].count, 
                                journal.journals.has_bookmarked,
                                journal.journals.like_count?.[0].count,
                                journal.journals.bookmark_count?.[0].count,)} 
                                className="content-container">

                                <div className='feed-text-content-container'>
                                    <div className='feed-title-content'>
                                        <h2 className="feed-title">{journal.journals.title.length > 40 ? `${journal.journals.title.substring(0, 40)}...` : journal.journals.title}</h2>
                                    </div>
                                    <p className="feed-text-content">{parsedContent.slicedText}</p>
                                </div>

                                <div className="feed-image-content-container">
                                    <img className="journal-image" src={parsedContent?.firstImage?.src || '../../src/assets/no-image.png'} alt="content thumbnail" />
                                </div>
                            </div>

                        </div>
                    </div>
                )
            })}
            <div ref={inviewRef} className='inview-container'>
            </div>
        </div>
        </>
    )
}
export default Bookmarks;