import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { addReplyOpinion, getViewOpinion } from "../../../API/Api";
import { useAuth } from "../../Context/useAuth";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import formatPostDate from "../../../helpers/formatDateString";
import OpinionsReplyCard from "./OpinionsCardRepy";
import VerifiedBadge from "../Badge/VerifiedBadge";

const OpinionViewer = () => {
    const queryClient = useQueryClient();
    const location = useLocation();
    const { opinionId, userId } = location.state;
    const { user } = useAuth();
    const textAreaRef = useRef(null);

    const [replyOpinion, setReplyOpinion] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const { data, isLoading } = useQuery({
        queryKey: ['getViewOpinion', opinionId, userId],
        queryFn: ({ queryKey }) => getViewOpinion(queryKey[1], queryKey[2]),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled: !!opinionId && !!userId,
        refetchOnWindowFocus: false
    });

    const cancelTyping = () => {
        setIsTyping(false);
        setReplyOpinion('');
        if (textAreaRef.current) {
            textAreaRef.current.innerText = '';
            textAreaRef.current.blur();
        }
    };

    const submitReply = async (receiverId, senderId, parentId) => {
        const formData = new FormData();
        formData.append('opinion', replyOpinion);

        try {
            await addReplyOpinion(formData, receiverId, senderId, parentId);
            setReplyOpinion('');
            if (textAreaRef.current) {
                textAreaRef.current.innerText = '';
            }
            queryClient.invalidateQueries(['getViewOpinion', opinionId, receiverId]);
        } catch (error) {
            console.error(error);
            setReplyOpinion('');
            if (textAreaRef.current) {
                textAreaRef.current.innerText = '';
            }
            queryClient.invalidateQueries(['getViewOpinion', opinionId, receiverId]);
        }
    };

    const opinionData = data?.data;

    console.log(opinionData)

    return (
        <>
            {opinionData?.map((opinion) => (
                <motion.div
                    className="ov-card"
                    key={opinion.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                >
                    <div className="ov-user-row">
                        <div className={`ov-avatar-container ${opinion.users.badge === 'legend' ? 'avatar-ring-legend' : opinion.users.badge === 'og' ? 'avatar-ring-og' : ''}`}>
                            <img
                                className="ov-avatar"
                                src={opinion.users.image_url || '../assets/profile.jpg'}
                                alt=""
                            />
                        </div>
                        <span className="ov-username">{opinion.users.name}</span>
                        <span className="ov-dot">·</span>
                        <VerifiedBadge badge={opinion.users.badge} size={14}/>
                        <span className="ov-date">{formatPostDate(opinion.created_at)}</span>
                    </div>

                    <div className="ov-body">
                        {opinion.opinion}
                    </div>

                    <div className="ov-meta-bar">
                        <span className="ov-reply-pill">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {opinion.reply_count} {opinion.reply_count === 1 ? 'reply' : 'replies'}
                        </span>
                        <span className="ov-full-date">
                            {new Date(opinion.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: '2-digit',
                                year: 'numeric',
                            })}
                        </span>
                    </div>

                    <div className="ov-reply-row">
                        <img
                            className="ov-reply-avatar"
                            src={user?.userData[0].image_url || '../assets/profile.jpg'}
                            alt=""
                        />
                        <div
                            className="ov-reply-input"
                            onFocus={() => setIsTyping(true)}
                            ref={textAreaRef}
                            onInput={(e) => setReplyOpinion(e.currentTarget.innerText.trim())}
                            data-placeholder={`Add a reply to '${opinion.users.name}'`}
                            contentEditable="true"
                            role="textbox"
                        />
                    </div>

                    <AnimatePresence>
                        {isTyping && (
                            <motion.div
                                className="ov-btn-row"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <button
                                    onClick={cancelTyping}
                                    className="ov-btn-cancel"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={replyOpinion.trim().length === 0}
                                    onClick={() => submitReply(userId, user?.userData[0].id, opinion.id)}
                                    className={`ov-btn-submit ${replyOpinion.trim().length === 0 ? 'ov-btn-disabled' : ''}`}
                                >
                                    Submit
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <OpinionsReplyCard opinionId={opinion.id} depth={0} />
                </motion.div>
            ))}
        </>
    );
};

export default OpinionViewer;
