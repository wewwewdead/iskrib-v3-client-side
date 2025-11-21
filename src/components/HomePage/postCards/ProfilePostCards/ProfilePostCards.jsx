import './profilepostcards.css';
import { useAuth } from '../../../../Context/Authcontext';
import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteJournal, deleteJournalImage, getUserJournals } from '../../../../../API/Api';
import { useEffect, useRef } from 'react';
import { FadeLoader, MoonLoader } from 'react-spinners';
import ParseContent from '../parseData';
import { useInView } from 'react-intersection-observer';
import { useState } from 'react';
import { AnimatePresence, motion, scale } from 'framer-motion';
import { handleCLickContent } from '../../../../../helpers/handleClicks';
import { useNavigate } from 'react-router-dom';
import EditJournal from './editJournal';

const ProfilePostCards = () =>{
    const queryClient = useQueryClient();
    const {user, session}= useAuth();
    const navigate = useNavigate();

    const [showEditor, setShowEditor] = useState(null);

    const {ref, inView} = useInView({
        threshold: 0.2
    })

    const settingsList = [
        {
            label: 'Delete journal',
            className: 'delete-button',
            actionDelete: (e, journalId) => handleClickDeleteJournal(e, journalId),
            icon: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="rgb(255, 48, 48)"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>
        },
        {
            label: 'Edit journal',
            className: 'edit-button',
            actionEdit: (e, journalContent, journalId, journalTitle) => handleClickEdit(e, journalContent, journalId, journalTitle), // still in progress
            icon: <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z"/></svg>
        }
    ]

    const [showSettings, setShowSettings] = useState(null);
    const [showConfirmationBttn, setShowConfirmationBttn] = useState(null);
    const [journalData, setJournalData] = useState(null);
    const [isDeletingJournal, setIsDeletingJournal] = useState(false);
    const [journalIsDeleted, setJournalIsDeleted] = useState(false);
    
    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['userJournals', user?.userData?.[0].id],
        queryFn: ({queryKey, pageParam}) => getUserJournals(pageParam, 5, queryKey[1]),
        getNextPageParam: (lastPage) =>{
            if(lastPage.hasMore){
                const lastJournal = lastPage?.data[lastPage?.data.length - 1];
                return new Date(lastJournal.created_at).toISOString();
            } else {
                return undefined;
            }
        },
        enabled: !!user?.userData?.[0].id
    })
    
    const clickContent = handleCLickContent(navigate);

    const handleClickSettings = (e, journalId) =>{
        e.stopPropagation();
        setShowSettings(showSettings === journalId ? null : journalId)
    }

    const handleClickDeleteJournal = (e, journalId) =>{
        e.stopPropagation();
        setShowConfirmationBttn(showConfirmationBttn === journalId ? null : journalId)
        setShowSettings(null)
    }

    const handleConfirmDeleteJournal = async(e, journalId, token, image_url) =>{
        e.stopPropagation();

        const imageUrlArray = [image_url];
        // console.log({
        //     journalId: journalId,
        //     image_url: imageUrlArray,
        //     token: token
        // })

        try {
            setIsDeletingJournal(true);

            const deleteJournalPromise = deleteJournal(journalId, token,)
            const deleteImageJournalPromise = image_url ? deleteJournalImage(token, imageUrlArray) : Promise.resolve(null);

            const [deletePostJournal, deletePostJournalImage] = await Promise.allSettled([
                deleteJournalPromise,
                deleteImageJournalPromise,
            ])
            if(deletePostJournal || deletePostJournalImage){
                console.log({deletePostJournal: deletePostJournal, deletePostJournalImage: deletePostJournalImage})
            }

            setJournalIsDeleted(true)

            setTimeout(() =>{
                setIsDeletingJournal(false)
                setJournalIsDeleted(false)
                setShowConfirmationBttn(null)
                queryClient.invalidateQueries(['userJournals', user?.userData?.[0].id]);
            }, 1500)

        } catch (error) {
            console.error("Error deleting journal:", error);
        }
    }

    const handleClickEdit = (e, journalContent, journalId, journalTitle) =>{
        e.stopPropagation();
        setShowSettings(null)
        const data = {
            content: journalContent,
            id: journalId,
            title: journalTitle
        }
        setJournalData(data);
        setShowEditor(showEditor === journalId ? null : journalId);
    }

    const handleClickCloseEditor = () => {
        setShowEditor(null)
    }

    useEffect(() =>{
        console.log(data)
    }, [data])

    useEffect(() =>{
        const handleClickOutsideSettings = (e) => {
            e.stopPropagation();
            if(showSettings !== null && !e.target.closest('user-post-settings')){
                setShowSettings(null)
            }
        }
        
        document.addEventListener('click', handleClickOutsideSettings);

        return () => {
            document.removeEventListener('click', handleClickOutsideSettings)
        }
    }, [showSettings])


    const isLoadingMore = isFetchingNextPage || !hasNextPage
    useEffect(() =>{
        if(inView && !isLoadingMore){
            fetchNextPage();
        }
    }, [fetchNextPage, isLoadingMore, inView])


    const journals = data?.pages.flatMap((page) => page.data) || [];
    if(isLoading){
        return(
            <>
            <div className='profile-postcards-loading-container'>
                <MoonLoader loading={isLoading} size={20} speedMultiplier={0.5}/>
            </div>
            </>
        )
    }
    if(data && journals?.length === 0){
        return(
            <div className='profile-postcards-loading-container'>
                No post available!
            </div>
        )
    }
    return(
        <>
        <div className='profile-postcards-parent-container'>
            {journals.map((journal, index) => {
                const parsedContent =  ParseContent(journal?.content);
                return (
                    <div key={journal.id} className='profile-postcards-child-container'>
                    <div className='profile-postcards'>
                        {showEditor === journal.id && (
                            <EditJournal key={index} journalData={journalData ? journalData : {}} onClose={handleClickCloseEditor}/>
                        )}

                        {showConfirmationBttn === journal.id && (
                            <AnimatePresence>
                            <div className="confirmation-delete-bg">
                                
                                {journalIsDeleted && (
                                        <motion.div
                                        className='journal-is-deleted-message-container'
                                        initial={{opacity: 0, scale: 0}}
                                        animate={{opacity: 1, scale: 1, transition:{type: 'tween', duration: 0.1}}}
                                        exit={{y: -900, opacity: 0, transition:{type:'tween', duration: 0.5, ease: 'easeOut'}}}
                                        >
                                            Journal deleted successfuly! 
                                            <svg xmlns="http://www.w3.org/2000/svg" height="44px" viewBox="0 -960 960 960" width="44px" fill="#00d61dff"><path d="M268-240 42-466l57-56 170 170 56 56-57 56Zm226 0L268-466l56-57 170 170 368-368 56 57-424 424Zm0-226-57-56 198-198 57 56-198 198Z"/></svg>
                                        </motion.div>
                                )}


                                {isDeletingJournal && (
                                    <div className='delete-journal-loader-container'>
                                        <FadeLoader loading={isDeletingJournal} speedMultiplier={2}/>
                                        <p style={{margin: '0', padding: '0', fontWeight: 760}}>Deleting the journal...</p>
                                    </div>
                                )}
                                
                                    <motion.div
                                    className="confirmation-delete-container"
                                    initial={{opacity:0 ,scale:0}}
                                    animate={{opacity:1, scale:1, transition: {type: "tween", duration: 0.1}}}
                                    exit={{opacity:0, scale:0, transition: {type: "tween", duration: 0.1}}}
                                    >
                                        <div className="confirmation-delete-heading">
                                            Do you want to delete the journal?
                                        </div>
                                        <div className="confirm-buttons-container">
                                            <div onClick={(e) => handleConfirmDeleteJournal(e, journal.id, session?.access_token, parsedContent?.firstImage?.src)} className="confirm-buttons-yes">Yes</div>
                                            <div onClick={() => setShowConfirmationBttn(null)} className="confirm-buttons-cancel">Cancel</div>
                                        </div> 
                                    </motion.div>

                            </div>
                            </AnimatePresence>
                        )}
                        
                        <div className='user-profile-card-content'>

                            <div className="user-info">
                                <div className='user-info-child-container'>

                                    <div className="user-avatar-container">
                                        <img src={user?.userData?.[0].image_url || '../../../src/assets/profile.jpg'} alt="user-profile" loading='lazy' className="user-info-avatar" />
                                    </div>

                                    <div className="user-name-container">
                                        <p className="user-newsfeed-name">{user?.userData?.[0].name}</p>
                                    </div>

                                    <div className="name-info-separator">
                                        •
                                    </div>

                                    <div className="user-info-email-container">
                                        <p className="user-info-email"> {user?.userData?.[0].user_email}</p>
                                    </div>

                                    <div className="name-info-separator">
                                        •
                                    </div>

                                    <div className="user-post-date-container">
                                        <p className="user-post-date">{new Date(journal.created_at).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}</p>
                                    </div>

                                </div>

                                <div className="user-post-settings">
                                    <svg onClick={(e) => handleClickSettings(e, journal.id)}  xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>

                                    {showSettings === journal.id && (
                                        <AnimatePresence>
                                        <motion.div
                                        initial={{opacity:0 ,scale:0}}
                                        animate={{opacity:1, scale:1, transition: {type: "tween", duration: 0.1}}}
                                        exit={{opacity:0, scale:0, transition: {type: "tween", duration: 0.1}}}
                                        className='post-settings-container'
                                        
                                        >
                                            {settingsList.map((setting, index) => (
                                                <div className='setting-buttons' key={index}>
                                                    {setting.actionDelete && (
                                                        <div className={setting.className} onClick={(e) => setting.actionDelete(e, journal.id)}>
                                                            {setting.icon}
                                                            {setting.label}
                                                        </div>
                                                    )}
                                                    {setting.actionEdit && (
                                                        <div className={setting.className} onClick={(e) => setting.actionEdit(e, journal.content, journal.id, journal.title)}>
                                                            {setting.icon}
                                                            {setting.label}
                                                        </div>
                                                    )}   
                                                </div>
                                                
                                            ))}
                                        </motion.div>
                                        </AnimatePresence>
                                    )}
                                    
                                </div>

                            </div>

                            <div onClick={(e) => clickContent(
                                e, 
                                journal.content, 
                                parsedContent.wholeText, 
                                journal.title, 
                                journal.users.id, 
                                journal.users.name, 
                                journal.users.image_url, 
                                journal.created_at, 
                                journal.id, 
                                journal.has_liked, 
                                journal.comment_count?.[0].count, 
                                journal.has_bookmarked, 
                                journal.like_count?.[0].count, 
                                journal.bookmark_count?.[0].count)} 
                                className="content-container">

                                <div className='feed-text-content-container'>
                                    <div className='feed-title-content'>
                                        <h2  className="feed-title">{journal.title.length > 40 ? `${journal.title.substring(0, 40)}...` : journal.title}</h2>
                                    </div>
                                    <p className="feed-text-content">{parsedContent.slicedText}</p>
                                </div>

                                <div className="feed-image-content-container">
                                    <img loading='lazy' className="journal-image" src={parsedContent?.firstImage?.src || '../../../src/assets/no-image.png'} alt="preview image" />
                                </div>

                            </div>
                        </div>
                    </div>     
                    </ div> 
                )
                
            })}

            <div ref={ref} className='in-view-container'>
                {isFetchingNextPage && (
                    <MoonLoader loading={isFetchingNextPage} size={20}/>
                )}
                
            </div>
        </div>
        </>
    )
}

export default ProfilePostCards;