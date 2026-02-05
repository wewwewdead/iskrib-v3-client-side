import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUserOpinions } from "../../../API/Api";
import { AnimatePresence, motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import VerifiedBadge from "../Badge/VerifiedBadge";
import { useAuth } from "../../Context/useAuth";
import { handleClickProfile } from "../../../helpers/handleClicks";
import formatPostDate from "../../../helpers/formatDateString";



const VisitedProfileOpinions = () =>{
    const {ref, inView} = useInView({threshold: 0, rootMargin: '200px'})
    const location = useLocation();
    const navigate = useNavigate();
    const {userId} = location.state;
   const {openAuthModal, session, user} = useAuth();;

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


    const handleClickOpionionsProfileOriginal = handleClickProfile(navigate);
    const handleClickOpionionsProfile = (e, loggedInUserId, clickedUserId) => {
        if(!session){
            e.stopPropagation();
            return openAuthModal();
        }
        handleClickOpionionsProfileOriginal(e, loggedInUserId, clickedUserId);
    };

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
                <motion.div
                    className="ov-card"
                    key={opinion.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <div className="ov-user-row">
                        <div className={`ov-avatar-container ${opinion.users.badge === 'legend' ? 'avatar-ring-legend' : opinion.users.badge === 'og' ? 'avatar-ring-og' : ''}`}>
                            <img onClick={(e) => handleClickOpionionsProfile(e, user?.userData[0].id, userId)} className="ov-avatar" src={opinion.users.image_url || "../../assets/profile.jpg"} alt="" />
                        </div>
                        <span className="ov-username">{opinion.users.name}</span>
                        <VerifiedBadge badge={opinion.users.badge} size={14} />
                        <span className="ov-dot">·</span>
                        <span className="ov-date">{formatPostDate(opinion.created_at)}</span>
                    </div>

                    <div
                        onClick={(e) => handleClickContent(e, opinion.id, opinion.users.id)}
                        className="ov-body"
                    >
                        {opinion.opinion}
                    </div>

                    <div className="ov-meta-bar">
                        <span className="ov-reply-pill" onClick={(e) => { e.stopPropagation(); navigate('/home/opinionsViewer', { state: { opinionId: opinion.id, userId: opinion.user_id } }); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {opinion.reply_count || 0} {opinion.reply_count === 1 ? 'reply' : 'replies'}
                        </span>
                        <span className="ov-full-date">
                            {new Date(opinion.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: '2-digit',
                                year: 'numeric',
                            })}
                        </span>
                    </div>
                </motion.div>
            ))}

            <div ref={ref} className="visited-user-opinions-inview">
            </div>
        </div>
        </AnimatePresence>
        </>
    )
}

export default VisitedProfileOpinions;
