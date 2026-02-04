import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "../../Context/useAuth";
import { getMyOpinions } from "../../../API/Api";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import VerifiedBadge from "../Badge/VerifiedBadge";

const MyOpinions = () =>{
    const {session, user} = useAuth();

    const navigate = useNavigate();
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

    const handleClickContent = (e, opinionId, userId) =>{
        e.stopPropagation();
        if(!session) return openAuthModal();
        navigate('/home/opinionsViewer', {
            state: {
                opinionId: opinionId,
                userId: userId
            }
        })
    }

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
                <div className="so-card" key={opinion.id}>
                    <div className="so-user-row">
                        <div className={`so-avatar-container ${user?.userData[0]?.badge === 'legend' ? 'avatar-ring-legend' : user?.userData[0]?.badge === 'og' ? 'avatar-ring-og' : ''}`}>
                            <img className="so-avatar" src={user?.userData[0].image_url || "../../assets/profile.jpg"} alt="" />
                        </div>
                        <span className="so-username">{user?.userData[0].name}</span>
                        <VerifiedBadge badge={user?.userData[0]?.badge} size={14} />
                    </div>
                    <motion.div
                        onClick={(e) => handleClickContent(e, opinion.id, user?.userData[0].id)}
                        className="so-body"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={
                            {
                                opacity: { duration: 0.2 },
                                y: { duration: 0.25, ease: 'easeOut' }
                            }
                        }
                    >
                        {opinion.opinion}
                    </motion.div>
                    <div className="so-meta-bar">
                        <span className="so-reply-pill" onClick={(e) => { e.stopPropagation(); navigate('/home/opinionsViewer', { state: { opinionId: opinion.id, userId: opinion.user_id } }); }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                            </svg>
                            Reply
                        </span>
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