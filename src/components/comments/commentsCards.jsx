import { useEffect, useRef, useState } from "react"
import { useAuth } from "../../Context/useAuth";
import { MoonLoader } from "react-spinners";
import { addReply, getPostReplies } from "../../../API/Api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { handleClickProfile } from "../../../helpers/handleClicks";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import VerifiedBadge from "../Badge/VerifiedBadge";
import formatPostDate from "../../../helpers/formatDateString";


const CommentsCards = ({comments, postId}) =>{
    const {user, session} = useAuth();
    const userId = user?.userData[0].id;
    const queryClient = useQueryClient();

    const [showReplyInput, setShowReplyInput] = useState(false);
    const [showReplies, setShowReplies] = useState(false);

    const [reply, setReply] = useState('')
    const [replyLoaderId, setReplyLoaderId] = useState('');

    const navigate = useNavigate();
    const replyInputRef = useRef(null);

    const clickProfile = handleClickProfile(navigate);

    const {data, isLoading, fetchNextPage, hasNextPage, isFetchinNextPage} = useInfiniteQuery({
        queryKey: ['getPostReplies', comments.id],
        queryFn: ({pageParam = null, queryKey}) => getPostReplies(queryKey[1], 5, pageParam),
        getNextPageParam: (lastPage) => {
            if(lastPage.hasMore){
                const lastReply = lastPage?.data[lastPage?.data.length - 1];
                return lastReply.id;
            } else{
                return undefined
            }
        },
        refetchOnWindowFocus: false,
        enabled: showReplies
    })

    const handleClickReplyButton = (e) =>{
        e.stopPropagation();
        setShowReplyInput(!showReplyInput);
    }

    const handleShowMoreReplies = () => {
        if(!isFetchinNextPage){
            fetchNextPage();
        }
    }

    const submitReply = async(parent_id, receiver_id) => {
        setReplyLoaderId(parent_id)

        try {
            const formdata = new FormData();
            formdata.append('reply', reply);

            const message = await addReply(userId, postId, parent_id, formdata, receiver_id, session?.access_token);
            if(message){
                console.log(message);
            }
            queryClient.invalidateQueries(['postComments', postId]);
            setReply('')
            setShowReplies(true)
        } catch (error) {
            setReply('')
            queryClient.invalidateQueries(['postComments', postId]);
            throw new Error('error adding replies')
        } finally {
            setReplyLoaderId('')
            setShowReplyInput(false);
        }
    }

    useEffect(() =>{
        if(showReplyInput && replyInputRef.current){
            const timer = setTimeout(() => {
                replyInputRef.current.focus();
                replyInputRef.current.scrollIntoView({behavior: 'smooth', block: 'center'})
            }, 50);

            return () => {
                clearTimeout(timer)
            }
        }
    }, [showReplyInput])

    const replies = data?.pages.flatMap((page) => page.data) || [];

    return(
        <div style={{marginLeft: comments?.parent_id ? 20 : 0}} className="cm-card">
            {comments?.parent_id && <div className="cm-thread-line" />}

            <div className="cm-card-content">
                <div className="cm-user-row">
                    <div
                        onClick={(e) => clickProfile(e, user?.userData[0].id, comments?.user_id)}
                        className={`cm-avatar-container ${comments?.users?.badge === 'legend' ? 'cm-ring-legend' : comments?.users?.badge === 'og' ? 'cm-ring-og' : ''}`}
                    >
                        <img className="cm-avatar" src={comments?.users?.image_url || '/assets/profile.jpg'} alt="" />
                    </div>
                    <span
                        onClick={(e) => clickProfile(e, user?.userData[0].id, comments?.user_id)}
                        className="cm-username"
                    >
                        {comments?.users?.name}
                    </span>
                    <VerifiedBadge badge={comments?.users?.badge} size={14} />
                    <span className="cm-dot">&middot;</span>
                    <span className="cm-date">{formatPostDate(comments?.created_at)}</span>
                </div>

                <p className="cm-body">{comments?.comment}</p>

                <div className="cm-card-actions">
                    <button onClick={(e) => handleClickReplyButton(e)} className="cm-reply-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 17 4 12 9 7" />
                            <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                        </svg>
                        Reply
                    </button>

                    {comments?.reply_count > 0 && (
                        <button onClick={() => setShowReplies(!showReplies)} className="cm-toggle-replies-btn">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {showReplies ? 'Hide' : 'Show'} {comments?.reply_count} {comments?.reply_count === 1 ? 'reply' : 'replies'}
                        </button>
                    )}
                </div>

                {replyLoaderId === comments.id && (
                    <div className="cm-reply-loading">
                        <MoonLoader size={16} speedMultiplier={0.8}/>
                    </div>
                )}

                <AnimatePresence>
                    {showReplyInput && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="cm-reply-input-wrapper"
                        >
                            <textarea
                                ref={replyInputRef}
                                maxLength={200}
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                className="cm-reply-textarea"
                                placeholder={`Replying to ${comments?.users?.name}...`}
                                rows={1}
                            />
                            <div className="cm-reply-action-row">
                                <span className={`cm-reply-char-count ${reply.length > 199 ? 'cm-char-limit' : ''}`}>
                                    {reply.length}/200
                                </span>
                                <button
                                    onClick={() => submitReply(comments?.id, comments?.users?.id)}
                                    className="cm-reply-submit-btn"
                                    disabled={!reply.trim()}
                                >
                                    Submit
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showReplies && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="cm-replies-thread"
                        >
                            {replies?.map((r) => (
                                <CommentsCards postId={postId} key={r.id} comments={r}/>
                            ))}

                            {hasNextPage && (
                                <button onClick={handleShowMoreReplies} className="cm-show-more-replies">
                                    {isFetchinNextPage ? 'Loading...' : 'Show more replies'}
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default CommentsCards;
