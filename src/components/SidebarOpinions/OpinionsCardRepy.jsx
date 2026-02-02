import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { addReplyOpinion, getOpinionReply } from "../../../API/Api";
import { useState, useRef } from "react";
import { useAuth } from "../../Context/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import formatPostDate from "../../../helpers/formatDateString";
import VerifiedBadge from "../Badge/VerifiedBadge";

const MAX_VISUAL_DEPTH = 4;

const OpinionsReplyCard = ({ opinionId, depth = 0 }) => {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const [showReply, setShowReply] = useState(false);
    const [replyOpinion, setReplyOpinion] = useState('');
    const [isTypingId, setIsTypingId] = useState('');
    const [showReplyButtonId, setShowReplyButtonId] = useState('');

    const textAreaRef = useRef(null);

    const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
        queryKey: ['getReplyOpinion', opinionId],
        queryFn: ({ queryKey, pageParam = null }) => getOpinionReply(queryKey[1], 10, pageParam),
        getNextPageParam: (lastPage) => {
            if (lastPage?.hasMore) {
                const lastReply = lastPage?.data[lastPage?.data.length - 1];
                return lastReply.id;
            }
            return undefined;
        },
        enabled: !!opinionId,
        refetchOnWindowFocus: false
    });

    const handleSubmitReplyOpinion = async (reply, receiver_id, sender_id, parent_id) => {
        try {
            const formadata = new FormData();
            formadata.append('opinion', reply);
            await addReplyOpinion(formadata, receiver_id, sender_id, parent_id);
            queryClient.invalidateQueries(['getReplyOpinion', opinionId]);
            setReplyOpinion('');
            if (textAreaRef.current) {
                textAreaRef.current.innerText = '';
            }
        } catch (error) {
            console.error(error);
            setReplyOpinion('');
            if (textAreaRef.current) {
                textAreaRef.current.innerText = '';
            }
            queryClient.invalidateQueries(['getReplyOpinion', opinionId]);
        }
    };

    const cancelTyping = () => {
        setIsTypingId('');
        setReplyOpinion('');
        if (textAreaRef.current) {
            textAreaRef.current.innerText = '';
            textAreaRef.current.blur();
        }
        setShowReplyButtonId('');
    };

    const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH);
    const opinioData = data?.pages.flatMap((page) => page.data) || [];

    return (
        <div
            className="rc-thread"
            style={{ '--depth': visualDepth }}
        >
            {opinioData?.map((opinion, index) => (
                <motion.div
                    className="rc-card"
                    key={opinion.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" }}
                >
                    {depth > 0 && <div className="rc-thread-line" />}

                    <div className="rc-content">
                        <div className="rc-user-row">
                            <div className={`rc-avatar-container ${opinion.users?.badge === 'legend' ? 'avatar-ring-legend' : opinion.users?.badge === 'og' ? 'avatar-ring-og' : ''}`}>
                                <img
                                    className="rc-avatar"
                                    src={opinion.users?.image_url || '../assets/profile.jpg'}
                                    alt=""
                                />
                            </div>
                            <span className="rc-username">{opinion.users?.name}</span>
                            <VerifiedBadge badge={opinion.users?.badge} size={14}/>
                            <span className="rc-dot">·</span>
                            <span className="rc-date">{formatPostDate(opinion.created_at)}</span>
                        </div>

                        <div className="rc-body">
                            {opinion.opinion}
                        </div>

                        <div className="rc-action-row">
                            {opinion.reply_count > 0 && (
                                <button
                                    className="rc-toggle-btn"
                                    onClick={() => setShowReply(prev => !prev)}
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    {showReply ? 'Hide' : 'Show'} {opinion.reply_count} {opinion.reply_count === 1 ? 'reply' : 'replies'}
                                </button>
                            )}
                            <button
                                className="rc-toggle-btn"
                                onClick={() => setShowReplyButtonId(
                                    showReplyButtonId === opinion.id ? '' : opinion.id
                                )}
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="9 17 4 12 9 7" />
                                    <path d="M20 18v-2a4 4 0 0 0-4-4H4" />
                                </svg>
                                Reply
                            </button>
                        </div>

                        <AnimatePresence>
                            {showReplyButtonId === opinion.id && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="rc-reply-input-wrapper"
                                >
                                    <div
                                        className="ov-reply-input"
                                        onFocus={() => setIsTypingId(opinion.id)}
                                        ref={textAreaRef}
                                        onInput={(e) => setReplyOpinion(e.currentTarget.innerText.trim())}
                                        data-placeholder={`Add a reply to '${opinion.users?.name}'`}
                                        contentEditable="true"
                                        role="textbox"
                                    />

                                    {isTypingId === opinion.id && (
                                        <div className="ov-btn-row">
                                            <button onClick={cancelTyping} className="ov-btn-cancel">Cancel</button>
                                            <button
                                                disabled={replyOpinion.trim().length === 0}
                                                onClick={() => handleSubmitReplyOpinion(replyOpinion, opinion.users.id, user?.userData[0].id, opinion.id)}
                                                className={`ov-btn-submit ${replyOpinion.trim().length === 0 ? 'ov-btn-disabled' : ''}`}
                                            >
                                                Submit
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {showReply && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <OpinionsReplyCard opinionId={opinion.id} depth={depth + 1} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            ))}

            {hasNextPage && (
                <button className="rc-load-more" onClick={() => fetchNextPage()}>
                    {isFetchingNextPage ? 'Loading...' : 'Show more replies'}
                </button>
            )}
        </div>
    );
};

export default OpinionsReplyCard;
