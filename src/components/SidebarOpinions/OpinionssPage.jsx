import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { addOpinion, getOpinions } from "../../../API/Api";
import { useAuth } from "../../Context/useAuth";
import { FadeLoader } from "react-spinners";
import { useInView } from "react-intersection-observer";
import { useMediaQuery } from "react-responsive";
import OpinionEditor from "./OpinionsEditor";

const OpinionsPage = () =>{
    const [showHeaders, setShowHeaders] = useState(true);
    const [showWriteContainer, setShowWriteContainer] = useState(true);
    const {ref, inView} = useInView({threshold: 0.5, rootMargin: '200px'});

    const isMobile = useMediaQuery({query: '(max-width: 480px'});

    const timeoutRef = useRef();
    const {user, session, openAuthModal} = useAuth();
    const queryClient = useQueryClient();

    const [opinion, setOpinion] = useState('')
    const [isSendingOpinion, setIsSendingOpinion] = useState(false);
    const [openOpinionEditor, setOpenOpinionEditor] = useState(false);

    const {isLoading, data, fetchNextPage, isFetchingNextPage, hasNextPage} = useInfiniteQuery({
        queryKey: ['getOpinions'],
        queryFn:({pageParam = null}) => getOpinions(pageParam, 5),
        getNextPageParam: (lastPage) => {
            if(lastPage.hasMore){
                const lastOpinion = lastPage?.data[lastPage?.data.length - 1];
                return lastOpinion.id;
            } else {
                return undefined;
            }
        },
        refetchOnWindowFocus: false,
    })

    useEffect(() =>{
        console.log(data);
    }, [data])

    const links = [
        {label: 'Writings', path: '/home'},
        {label: 'Opinions', path: '/home/opinions'}
    ]
    const location = useLocation();
    const navigate = useNavigate();

    const handleClickLinks = (path) => {
        navigate(path);
    }

    const handleClickWriteOpinion = (e) =>{
        e.stopPropagation();
        if(!session) return openAuthModal();
        setOpenOpinionEditor(true)
    }

    const closeOpinionEditor = () =>{
        setOpenOpinionEditor(false);
    }

    const sendOpinion = async(e) =>{
        e.stopPropagation();
        const formdata = new FormData();
        formdata.append('opinion', opinion)
        if(isSendingOpinion){
            return;
        }
        setIsSendingOpinion(true);
        try {
            const message = await addOpinion(formdata, session?.access_token);
            if(message){
                console.log(message);
            }

            setIsSendingOpinion(false);
            setOpinion('')
            queryClient.invalidateQueries(['getOpinions']);
        } catch (error) {
            setIsSendingOpinion(false);
            setOpinion('')
            throw new Error('error uploading data')   
        }
    }

    useEffect(() =>{
        const scroll = () =>{
            setShowHeaders(false);
            setShowWriteContainer(false)
            if(timeoutRef.current){
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() =>{
                setShowHeaders(true)
                setShowWriteContainer(true)
            }, 500)
        }
        document.addEventListener('scroll', scroll, true)
        return () =>{
            document.removeEventListener('scroll', scroll)
            if(timeoutRef.current){
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    useEffect(() =>{
        if(inView && hasNextPage && !isFetchingNextPage){
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const opinions = data?.pages.flatMap((page) => page.data) || [];

    if(opinions.length === 0 && !isLoading) {
        return (
            <AnimatePresence>
            <>
                {openOpinionEditor && (
                    <OpinionEditor onClose={closeOpinionEditor}/>
                )}

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
                        {links.map((link, index) =>(
                            <div onClick={() => handleClickLinks(link.path)} key={index} className='header-link'>
                                {link.label}
                                <div className={link.path === location.pathname ? "header-underline" : ''}></div>
                            </div>
                        ))}
                    </motion.div>
                )}

                    
                <div className="opinions-page-parent-container">

                    <div onClick={(e) => handleClickWriteOpinion(e)} className={'write-opinions-container'} style={showWriteContainer ? {opacity: '1'} : {opacity: '25%'}}>
                        <svg style={{fill: '#ffffffff', stroke: '#ffffffff', strokeWidth:'5.000000e-02', strokeMiterlimit: '10'}} xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="44px" height="44px" viewBox="0 0 24 24" version="1.1" xmlSpace="preserve">

                            <g id="grid_system"/>
                                <g id="_icons">
                                <path d="M22,13.5c0-2.3-1.8-4.2-4-4.5c-0.2-2.8-2.6-5-5.4-5H7.5C6,4,4.6,4.6,3.6,5.6C2.6,6.6,2,8,2,9.5c0,1.2,0.4,2.3,1,3.2l-1,3   c-0.1,0.4,0,0.8,0.3,1.1C2.5,16.9,2.8,17,3,17c0.2,0,0.3,0,0.4-0.1l4-2c0,0,0,0,0,0h1.8c0.2,0.5,0.4,1,0.7,1.4   c0.9,1.1,2.1,1.7,3.5,1.7h2.3l3.8,1.9C19.7,20,19.8,20,20,20c0.2,0,0.5-0.1,0.7-0.2c0.3-0.3,0.4-0.7,0.3-1.1L20.4,17   c0.1-0.1,0.2-0.2,0.3-0.3C21.5,15.8,22,14.7,22,13.5z M7.3,12.9c-0.2,0-0.4,0-0.6,0.1l-2.1,1l0.4-1.3c0.1-0.3,0-0.7-0.2-1   C4.3,11.1,4,10.3,4,9.5C4,8.5,4.4,7.7,5,7c0.7-0.7,1.5-1,2.4-1h5.1c1.8,0,3.2,1.3,3.4,3h-2.5c-1.2,0-2.3,0.5-3.2,1.3   c-0.7,0.7-1.1,1.5-1.3,2.4c0,0.1,0,0.1,0,0.2H7.5C7.4,12.9,7.4,12.9,7.3,12.9z M19.3,15.3c-0.2,0.2-0.4,0.3-0.6,0.4   c-0.4,0.2-0.6,0.7-0.5,1.2l0.1,0.2l-1.8-0.9C16.3,16,16.2,16,16,16h-2.5c-0.8,0-1.5-0.3-2-1c-0.3-0.4-0.5-0.8-0.5-1.2   c0-0.1,0-0.2,0-0.3c0-0.1,0-0.3,0-0.4c0.1-0.5,0.3-1,0.7-1.3c0.5-0.5,1.1-0.7,1.8-0.7H17h0.5c1.4,0,2.5,1.1,2.5,2.5   C20,14.2,19.7,14.8,19.3,15.3z"/>
                            </g>
                        </svg>
                    </div>

                    <div>
                        No opinions availabe
                    </div>
                </div>
            </>
            </AnimatePresence>
        )
    }

    return(
        <AnimatePresence>
        <>
        {openOpinionEditor && (
            <OpinionEditor onClose={closeOpinionEditor}/>
        )}

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
                {links.map((link, index) =>(
                    <div onClick={() => handleClickLinks(link.path)} key={index} className='header-link'>
                        {link.label}
                        <div className={link.path === location.pathname ? "header-underline" : ''}></div>
                    </div>
                ))}
            </motion.div>
        )}

        
        <div className="opinions-page-parent-container">   

            <div onClick={(e) => handleClickWriteOpinion(e)} className={'write-opinions-container'} style={showWriteContainer ? {opacity: '1'} : {opacity: '25%'}}>
                <svg style={{fill: '#ffffffff', stroke: '#ffffffff', strokeWidth:'5.000000e-02', strokeMiterlimit: '10'}} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="44px" height="44px" viewBox="0 0 24 24" version="1.1" xmlSpace="preserve">

                    <g id="grid_system"/>
                        <g id="_icons">
                        <path d="M22,13.5c0-2.3-1.8-4.2-4-4.5c-0.2-2.8-2.6-5-5.4-5H7.5C6,4,4.6,4.6,3.6,5.6C2.6,6.6,2,8,2,9.5c0,1.2,0.4,2.3,1,3.2l-1,3   c-0.1,0.4,0,0.8,0.3,1.1C2.5,16.9,2.8,17,3,17c0.2,0,0.3,0,0.4-0.1l4-2c0,0,0,0,0,0h1.8c0.2,0.5,0.4,1,0.7,1.4   c0.9,1.1,2.1,1.7,3.5,1.7h2.3l3.8,1.9C19.7,20,19.8,20,20,20c0.2,0,0.5-0.1,0.7-0.2c0.3-0.3,0.4-0.7,0.3-1.1L20.4,17   c0.1-0.1,0.2-0.2,0.3-0.3C21.5,15.8,22,14.7,22,13.5z M7.3,12.9c-0.2,0-0.4,0-0.6,0.1l-2.1,1l0.4-1.3c0.1-0.3,0-0.7-0.2-1   C4.3,11.1,4,10.3,4,9.5C4,8.5,4.4,7.7,5,7c0.7-0.7,1.5-1,2.4-1h5.1c1.8,0,3.2,1.3,3.4,3h-2.5c-1.2,0-2.3,0.5-3.2,1.3   c-0.7,0.7-1.1,1.5-1.3,2.4c0,0.1,0,0.1,0,0.2H7.5C7.4,12.9,7.4,12.9,7.3,12.9z M19.3,15.3c-0.2,0.2-0.4,0.3-0.6,0.4   c-0.4,0.2-0.6,0.7-0.5,1.2l0.1,0.2l-1.8-0.9C16.3,16,16.2,16,16,16h-2.5c-0.8,0-1.5-0.3-2-1c-0.3-0.4-0.5-0.8-0.5-1.2   c0-0.1,0-0.2,0-0.3c0-0.1,0-0.3,0-0.4c0.1-0.5,0.3-1,0.7-1.3c0.5-0.5,1.1-0.7,1.8-0.7H17h0.5c1.4,0,2.5,1.1,2.5,2.5   C20,14.2,19.7,14.8,19.3,15.3z"/>
                    </g>
                </svg>
            </div>
             

            {opinions.map((opinion) => (
                
                <div key={opinion.id} className="opinions-card">
                    <motion.div
                        className="opinions-page-content"
                        initial={{opacity: 0, scale: 0.5, y: 10}}
                        animate={{opacity: 1, scale: 1, y: [0, -8, 0]}}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={
                            {
                                scale: {type: 'spring', stiffness: 300, damping: 15},
                                opacity: {duration: 0.2},
                                y:{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: 'easeInOut'
                                }
                            }
                        }
                    >
                        {opinion.opinion}

                        <div className="opinion-reply-button">
                            reply
                            <svg style={{fill: 'rgb(80, 80, 80)', stroke: 'rgb(80, 80, 80)', strokeWidth:'5.000000e-02', strokeMiterlimit: '5'}} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1" xmlSpace="preserve">

                            <g id="grid_system"/>
                                <g id="_icons">
                                <path d="M22,13.5c0-2.3-1.8-4.2-4-4.5c-0.2-2.8-2.6-5-5.4-5H7.5C6,4,4.6,4.6,3.6,5.6C2.6,6.6,2,8,2,9.5c0,1.2,0.4,2.3,1,3.2l-1,3   c-0.1,0.4,0,0.8,0.3,1.1C2.5,16.9,2.8,17,3,17c0.2,0,0.3,0,0.4-0.1l4-2c0,0,0,0,0,0h1.8c0.2,0.5,0.4,1,0.7,1.4   c0.9,1.1,2.1,1.7,3.5,1.7h2.3l3.8,1.9C19.7,20,19.8,20,20,20c0.2,0,0.5-0.1,0.7-0.2c0.3-0.3,0.4-0.7,0.3-1.1L20.4,17   c0.1-0.1,0.2-0.2,0.3-0.3C21.5,15.8,22,14.7,22,13.5z M7.3,12.9c-0.2,0-0.4,0-0.6,0.1l-2.1,1l0.4-1.3c0.1-0.3,0-0.7-0.2-1   C4.3,11.1,4,10.3,4,9.5C4,8.5,4.4,7.7,5,7c0.7-0.7,1.5-1,2.4-1h5.1c1.8,0,3.2,1.3,3.4,3h-2.5c-1.2,0-2.3,0.5-3.2,1.3   c-0.7,0.7-1.1,1.5-1.3,2.4c0,0.1,0,0.1,0,0.2H7.5C7.4,12.9,7.4,12.9,7.3,12.9z M19.3,15.3c-0.2,0.2-0.4,0.3-0.6,0.4   c-0.4,0.2-0.6,0.7-0.5,1.2l0.1,0.2l-1.8-0.9C16.3,16,16.2,16,16,16h-2.5c-0.8,0-1.5-0.3-2-1c-0.3-0.4-0.5-0.8-0.5-1.2   c0-0.1,0-0.2,0-0.3c0-0.1,0-0.3,0-0.4c0.1-0.5,0.3-1,0.7-1.3c0.5-0.5,1.1-0.7,1.8-0.7H17h0.5c1.4,0,2.5,1.1,2.5,2.5   C20,14.2,19.7,14.8,19.3,15.3z"/>
                            </g>
                        </svg>
                        </div>
                    </motion.div>
                    <div className="opinions-user-metadata">
                        <img className="opinions-profile" src={opinion.users.image_url || '../../assets/profile.jpg'} alt="opinions owner profile image"/>
                        <p className="opinion-username">{opinion.users.name}</p>
                    </div>
                </div>
            ))}
            <div className="opinions-in-view" ref={ref}>
            </div>
        </div>

            
        </>
        </AnimatePresence>
    )
}

export default OpinionsPage;