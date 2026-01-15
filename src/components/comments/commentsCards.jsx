import { useState } from "react"
import { useAuth } from "../../Context/useAuth";
import { BarLoader, ClipLoader, MoonLoader } from "react-spinners";
import { addReply, getPostReplies } from "../../../API/Api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const CommentsCards = ({comments, postId}) =>{
    const {user, session} = useAuth();
    const userId = user?.userData[0].id;
    const queryClient = useQueryClient();

    const [showReplyInput, setShowReplyInput] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [visibleReplies, setVisibleReplies] = useState(5);

    const [reply, setReply] = useState('')
    const [replyLoaderId, setReplyLoaderId] = useState('');

    // const totalReplies = comments.replies.length;
    // const hasMoreReplies = totalReplies > visibleReplies;


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
        setVisibleReplies(v => v + 5);
    }

    const submitReply = async(parent_id, receiver_id) => {
        setReplyLoaderId(parent_id)
        console.log(receiver_id, 'receiver_id')
        console.log(userId);
        
        try {
            const formdata = new FormData();
            formdata.append('reply', reply);
    
            // const message = await addReply(userId, postId, parent_id, formdata);
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

    const replies = data?.pages.flatMap((page) => page.data) || [];

    return(
        <>
        <div style={{marginLeft: comments?.parent_id ? 20 : 0}} key={comments?.id} className="comments-cards">
            <div className="comment">
                {comments?.comment}
            </div>
            
            <div className='comment-user-metadata-container'>
                <img onClick={(e) => handleClickUserProfile(e, user?.userData[0].id,  comments?.user_id)} className='comments-avatar' src={comments?.users?.image_url || '/assets/profile.jpg'} alt="" />
                <p onClick={(e) => handleClickUserProfile(e, user?.userData[0].id,  comments?.user_id)} className='commenter-name'>{comments?.users?.name}</p>
                <p>on</p>
                <div className='comment-date'>
                    {new Date(comments?.created_at).toLocaleDateString('en-US', {month: 'long', day: '2-digit', year: 'numeric'})} 
                </div>
                <p style={{fontSize: '0.6rem', margin: 0, padding: 0}}>at</p>
                <div className='comment-date'>
                    {new Date(comments?.created_at).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}
                </div>
            </div>

            <div className='reply-button-container'>
                <div onClick={(e) => handleClickReplyButton(e)} className='reply-button'>
                    reply
                </div>

                {comments?.reply_count > 0 && (
                    <div onClick={() => setShowReplies(!showReplies)} className="show-reply-button">
                        {showReplies ? 'hide replies' : 'Show replies'} ({comments?.reply_count})
                    </div>
                )}

                
                
            </div>

            {replyLoaderId === comments.id && (
                <div className="submit-reply-loading-container">
                    <MoonLoader size={20} speedMultiplier={0.8}/>
                </div>
            )}

            {showReplies && (
                <div style={{marginTop: '10px'}}>
                    {replies?.map((r, index) => (
                        <CommentsCards postId={postId} key={r.id} comments={r}/>
                    ))}
                    
                    {hasNextPage && (
                        <div onClick={handleShowMoreReplies} className="show-more-replies-button">
                            Show more replies
                        </div>
                    )}
                </div>
            )}

            {showReplyInput && (
                    <div className='reply-comment-input-container'>
                        <textarea maxLength={200} value={reply} onChange={(e) => setReply(e.target.value)} className='reply-comment-input' placeholder={`replying to ${comments?.users?.name}`} type="text" />
                            <div className='reply-button-section'>
                                <div className='replies-counter-container'>
                                    <div style={reply.length > 199 ? {color: 'red'} : {}} className='comments-counter'>
                                        {reply.length}/200
                                    </div>
                                    <button onClick={() => submitReply(comments?.id, comments?.users?.id)} className='reply-submit-button'>
                                        submit
                                    </button>
                                </div>
                            </div>                      
                    </div>
            )}

        </div>
        </>
    )
}

export default CommentsCards;