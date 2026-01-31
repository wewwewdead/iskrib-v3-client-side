import { useEffect, useRef, useState } from "react"
import { useAuth } from "../../Context/useAuth";
import { BarLoader, ClipLoader, MoonLoader } from "react-spinners";
import { addReply, getPostReplies } from "../../../API/Api";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { handleClickProfile } from "../../../helpers/handleClicks";
import { useNavigate } from "react-router-dom";


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

    // const totalReplies = comments.replies.length;
    // const hasMoreReplies = totalReplies > visibleReplies;

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
        <>
        <div style={{marginLeft: comments?.parent_id ? 20 : 0}} key={comments?.id} className="comments-cards">
            <div className="comment">
                {comments?.comment}
            </div>
            
            <div className='comment-user-metadata-container'>
                <img onClick={(e) => clickProfile(e, user?.userData[0].id,  comments?.user_id)} className='comments-avatar' src={comments?.users?.image_url || '/assets/profile.jpg'} alt="" />
                <p onClick={(e) => clickProfile(e, user?.userData[0].id,  comments?.user_id)} className='commenter-name'>{comments?.users?.name}</p>
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
                    <svg className="svg-comment" xmlns="http://www.w3.org/2000/svg" width="15px" height="15px" viewBox="0 0 24 24" fill="#5e5e5eff">
                        <g id="style=fill">
                            <g id="comment">
                                <path id="Subtract" fillRule="evenodd" clipRule="evenodd" d="M11.9862 0.763672C6.07454 0.763672 1.23621 5.36133 1.23621 11.1034C1.23621 13.5057 2.10188 15.7237 3.55066 17.4735C5.46882 19.8566 8.48271 21.3843 11.8522 21.4238L11.8878 21.4367C11.9902 21.4735 12.1385 21.5265 12.3236 21.5916C12.6936 21.7216 13.2115 21.9001 13.8035 22.0941C14.9799 22.4797 16.4767 22.9358 17.6892 23.1894C18.303 23.3178 18.9306 23.1718 19.4096 22.8608C19.8872 22.5507 20.3019 22.0126 20.3019 21.3173C20.3019 20.9046 20.1354 20.4987 19.9732 20.1857C19.8007 19.8529 19.5794 19.5251 19.371 19.2448C19.2691 19.1076 19.1676 18.9782 19.0724 18.8609C21.3193 16.9815 22.7362 14.2061 22.7362 11.1034C22.7362 7.55126 20.8865 4.4319 18.073 2.58609C16.3321 1.4227 14.2426 0.763672 11.9862 0.763672ZM18.3637 6.03728C18.1546 5.67972 17.6953 5.55937 17.3377 5.76847C16.9801 5.97757 16.8598 6.43694 17.0689 6.7945C17.8131 8.0671 18.2362 9.53599 18.2362 11.1034C18.2362 12.6662 17.8138 14.1316 17.0693 15.4016C16.8598 15.7589 16.9797 16.2184 17.337 16.4279C17.6943 16.6374 18.1538 16.5175 18.3633 16.1602C19.2385 14.6673 19.7362 12.941 19.7362 11.1034C19.7362 9.26158 19.238 7.53236 18.3637 6.03728Z" fill="#5e5e5eff"/>
                            </g>
                        </g>
                    </svg>
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
                    )     
                    )}
                    
                    {hasNextPage && (
                        <div onClick={handleShowMoreReplies} className="show-more-replies-button">
                            Show more replies
                        </div>
                    )}
                </div>
            )}

            {showReplyInput && (
                    <div className='reply-comment-input-container'>
                        <textarea ref={replyInputRef} maxLength={200} value={reply} onChange={(e) => setReply(e.target.value)} className='reply-comment-input' placeholder={`replying to ${comments?.users?.name}`} type="text" />
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