import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "../../Context/useAuth";
import { getMyOpinions } from "../../../API/Api";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const MyOpinions = () =>{
    const {session, user} = useAuth();

    const {ref, inView} = useInView({threshold: 0, rootMargin: '200px'})

    const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ['getMyOpinions', session?.access_token],
        queryFn: ({pageParam = null, queryKey}) => getMyOpinions(pageParam, 5, queryKey[1]),
        getNextPageParam: (lastPage) => {
            if(lastPage.hasMore){
                const lastOpinion = lastPage?.data[lastPage.data.length - 1];
                return lastOpinion.id
            } else {
                return undefined;
            }
        },
        refetchOnWindowFocus: false,
        enabled: !!session
    })

    useEffect(() =>{
        if(inView && hasNextPage && !isFetchingNextPage){
            fetchNextPage();
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const opinions = data?.pages?.flatMap((page) => page.data) || [];

    if(opinions.length === 0 && !isLoading){
        return (
            <>
            <div className="my-opinions-container">
                No opinions availabe
            </div>
            </>
        )
    }

    return(
        <>
        <AnimatePresence>
        <div className="my-opinions-container">

            {opinions.map((opinion) => (
                <div className="visited-profile-opinion-card" key={opinion.id}>
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
                        <img className="opinions-profile" src={user?.userData[0].image_url || "../../assets/profile.jpg"} alt="" />
                        <p className="opinion-username">{user?.userData[0].name}</p>
                    </div>
                </div>
            ))}

            <div ref={ref} className="my-opinions-inview-container">

            </div>

        </div>
        </AnimatePresence>
        </>
    )
}

export default MyOpinions;