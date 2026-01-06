import { useInfiniteQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getOpinions } from "../../../API/Api";
import { useAuth } from "../../Context/useAuth";

const OpinionsPage = () =>{
    const [showHeaders, setShowHeaders] = useState(true);
    const timeoutRef = useRef();
    const {user} = useAuth();

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
        refetchOnMount: true
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

    useEffect(() =>{
        const scroll = () =>{
            setShowHeaders(false);
            if(timeoutRef.current){
                clearTimeout(timeoutRef.current)
            }

            timeoutRef.current = setTimeout(() =>{
                setShowHeaders(true)
            }, 100)
        }
        document.addEventListener('scroll', scroll, true)
        return () =>{
            document.removeEventListener('scroll', scroll)
            if(timeoutRef.current){
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    const opinions = data?.pages.flatMap((page) => page.data) || [];

    if(opinions.length === 0 && !isLoading) {
        return (
            <>
                <AnimatePresence>
                    {showHeaders&& (
                        <motion.div 
                            initial={{opacity: 0}}
                            animate={{opacity: 1, transition: {type: 'spring', stiffness: 300, damping: 25, mass: 0.8}}}
                            exit={{ opacity: 0, y: -20,
                                    transition: { 
                                    duration: 0.2,
                                    ease: "easeOut"
                                }
                            }}
                            className="newsfeed-header"
                        >
                        {links.map((link, index) =>(
                            <div onClick={() => handleClickLinks(link.path)} key={index} className='header-link'>
                                {link.label}
                                <div className={link.path === location.pathname ? "header-underline" : ''}></div>
                            </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="opinions-page-no-opinions">
                    No opinions availabe
                </div>
            </>
        )
    }

    return(
        <>
        <AnimatePresence>
        {showHeaders&& (
            <motion.div 
            initial={{opacity: 0}}
            animate={{opacity: 1, transition: {type: 'spring', stiffness: 300, damping: 25, mass: 0.8}}}
            exit={{ opacity: 0, y: -20,
                    transition: { 
                    duration: 0.2,
                    ease: "easeOut"
                    }
            }}
            className="newsfeed-header"
            >
            {links.map((link, index) =>(
                <div onClick={() => handleClickLinks(link.path)} key={index} className='header-link'>
                    {link.label}
                    <div className={link.path === location.pathname ? "header-underline" : ''}></div>
                </div>
            ))}
        </motion.div>
        )}
        </AnimatePresence>
        
        <div className="opinions-page-parent-container">
            <div className="mobile-write-opinions">
                <div className="write-profile-container">
                    <img className="write-profile" src={user?.userData[0].image_url || '../../assets/profile.jpg'} alt="" />
                </div>
                <div className="opinion-input-container">
                    <textarea className="mobile-input-opinion" name="opinions-input" id="opinions-input" placeholder="Share your opinions here..."></textarea>
                </div>
            </div>
            {opinions.map((opinion) => (
                <AnimatePresence>
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
                    </motion.div>
                    <div className="opinions-user-metadata">
                        <img className="opinions-profile" src={opinion.users.image_url || '../../assets/profile.jpg'} alt="opinions owner profile image"/>
                        <p className="opinion-username">{opinion.users.name}</p>
                    </div>
                </div>
                </AnimatePresence>
            ))}
        </div>
        </>
    )
}

export default OpinionsPage;