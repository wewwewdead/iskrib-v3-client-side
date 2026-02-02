import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getUserOpinions } from "../../../API/Api";
import { AnimatePresence, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";



const VisitedProfileOpinions = () =>{
    const {ref, inView} = useInView({threshold: 0, rootMargin: '200px'})
    const location = useLocation();
    const {userId} = location.state;

    const {data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ['getUserOpinions', userId],
        queryFn: ({pageParam = null, queryKey}) => getUserOpinions(pageParam, 5, queryKey[1]),
        getNextPageParam: (lastPage) => {
            if(lastPage.hasMore){
                const lastOpinion = lastPage?.data[lastPage?.data.length - 1]
                return lastOpinion.id;
            } else {
                return undefined
            }
        },
        refetchOnWindowFocus: false,
        enabled: !!userId
    })

    useEffect(() =>{
        console.log(userId)
    }, [userId])

    useEffect(() =>{
        if(inView && hasNextPage && !isFetchingNextPage){
            fetchNextPage();
        }
    },[inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const opinions = data?.pages?.flatMap((page) => page.data) || [];

    if(opinions?.length === 0 && !isLoading){
        return(
            <>
                <div className="visited-profile-opinions-container">
                    No opinions available
                </div>
            </>
        )
    }
     
    return(
        <>
        <AnimatePresence>
        <div className="visited-profile-opinions-container">
            {opinions.map((opinion) => (
                <div key={opinion.id} className="visited-profile-opinion-card">

                    <motion.div
                     className="visited-profile-opinion-content"
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
                        <p style={{padding: 0, margin: 0}}>{opinion.opinion}</p>
                    </motion.div>

                    <div className="opinions-visited-user-metadata">
                        <div className={`opinions-profile-container ${opinion.users.badge === 'legend' ? 'avatar-ring-legend' : opinion.users.badge === 'og' ? 'avatar-ring-og' : ''}`}>
                            <img className="opinions-profile" src={opinion.users.image_url || "../../assets/profile.jpg"} alt="" />
                        </div>
                        <p className="opinion-username">{opinion.users.name}</p>
                    </div>
                </div>
            ))}

            <div ref={ref} className="visited-user-opinions-inview">
            </div>
        </div>
        </AnimatePresence>
        </>
    )
}

export default VisitedProfileOpinions;