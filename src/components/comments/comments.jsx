import { useEffect, useRef, useState } from 'react';
import './comments.css'
import { AnimatePresence, motion} from "framer-motion";
import { addComment } from '../../../API/Api';
import { useAuth } from '../../Context/Authcontext';
import { getComments } from '../../../API/Api';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { BarLoader, MoonLoader } from 'react-spinners';

const CommentSection = ({onclose, postId, receiverId})=>{
    const queryClient = useQueryClient();

    const {session, user} = useAuth();
    const userId = user?.userData?.[0].id;

    const textAreaFocusRef = useRef();

    const [comments, setComments] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const {data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage} = useInfiniteQuery({
        queryKey: ['postComments', postId],
        queryFn: ({queryKey, pageParam = null}) => getComments(pageParam, 10, queryKey[1]),
        getNextPageParam: (lastPage) => {
            if(lastPage?.hasMore) {
                const lastComment = lastPage.comments[lastPage?.comments?.length - 1];
                return new Date(lastComment.created_at).toISOString();
            } else {
                return undefined;
            }
        },
        refetchOnWindowFocus: false
    })

    const handleSeeMoreComments = (e) =>{
        e.stopPropagation();
        if(hasNextPage && !isFetchingNextPage){
            console.log('has next page')
            try {
                fetchNextPage()
            } catch (error) {
                throw new Error(error);
            }
        }
    }

    useEffect(() =>{
        let timeout;
        if(textAreaFocusRef.current){
            timeout = setTimeout(() => {
                textAreaFocusRef.current.focus();
            }, 500);  
        } 
        return () => {
             clearTimeout(timeout);
        }   
    }, [])

    // useEffect(() =>{
    //     if(data){
    //         console.log(data)
    //         console.log(hasNextPage)
    //     }
    // }, [data])

    

    const handeCloseCommentsSection = (e) =>{
        e.stopPropagation();
        onclose()
    }

    const handaleSubmitComment = async(e, postId, receiverId, senderImageUrl, senderName, senderEmail) =>{
        e.stopPropagation();
        // const formdata = new FormData();
        // if(postId){
        //     formdata.append('postId', postId)
        // }
        // if(comments){
        //     formdata.append('comments', comments)
        // }
        const body = {
            comments: comments,
            postId: postId,
            receiverId: receiverId,
            senderImageUrl: senderImageUrl,
            senderName: senderName,
            senderEmail: senderEmail
        }

        try {
            setIsSubmittingComment(true)
            const message = await addComment(session?.access_token, body);
        if(message){
            console.log(message)
        }
        } catch (error) {
            throw new Error('error adding comments')
        } finally {
            setIsSubmittingComment(false)
            setComments('')
            queryClient.invalidateQueries(['postComments', postId]);
        }
    }

    const commentsData = data?.pages?.flatMap((comment) => comment.comments || []);

    return(
        <>
        <motion.div
        initial={{y: '100vh', opacity: 0}}
        animate={{
            y: 0,
            opacity: 1,
            transition: {type: 'spring', damping: 25, stiffness: 200}
        }}
        exit={{y: '-100vh', opacity: 0, transition: {duration: 0.2}}}
        className="comment-parent-container"
        >
            <div className='close-comment-bttn'>
                <svg className='close-comment-icon' onClick={(e) => handeCloseCommentsSection(e)} xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z"/></svg>
            </div>
            
            <div className='comments-section'>
                {isLoading && (
                   <div className='loading-comments-container'>
                        <MoonLoader color='rgba(19, 77, 104, 1)' size={20} loading={isLoading}/>
                   </div>
                )}
                {!commentsData?.length > 0 && !isLoading ? (
                    <div>
                        <p>no comments available</p>
                    </div>
                ) : (
                    commentsData?.map((comment, index) => (
                        <div className='comment-cards' key={index}>
                            <div className='comment'>
                                <p>{comment.comment}</p>
                            </div>

                            <div className='comment-user-metadata-container'>
                                <img className='comments-avatar' src={comment.users.image_url || '/assets/profile.jpg'} alt="" />
                                <p className='commenter-name'>{comment?.users?.name}</p>
                                <p>on</p>
                                <div className='comment-date'>
                                    {new Date(comment?.created_at).toLocaleDateString('en-US', {month: 'long', day: '2-digit', year: 'numeric'})} 
                                </div>
                                <p style={{fontSize: '0.6rem', margin: 0, padding: 0}}>at</p>
                                <div className='comment-date'>
                                    {new Date(comment?.created_at).toLocaleTimeString('en-US', {hour: '2-digit', minute: '2-digit'})}
                                </div>
                            </div>
                            
                        </div>
                    ))
                )}

                {hasNextPage &&(
                    <div onClick={(e) => handleSeeMoreComments(e)} className='see-more-comments-button'>
                        See more comments {isFetchingNextPage && (<MoonLoader size={15} speedMultiplier={0.5} color='rgba(19, 77, 104, 1)'/>)} 
                    </div>
                )}
            </div>

            <div className='comments-input-container'>
                <textarea ref={textAreaFocusRef} value={comments} onChange={(e) => setComments(e.target.value)} className='comments-input' type="text" maxLength={200} placeholder='Type your comments'/>
                
                <div className='button-section'>
                    <div className='comments-counter-container'>
                        <p style={comments.length > 199 ? {color: 'rgba(255, 46, 46, 1)', fontWeight: '660'} : {}} className='comments-counter'>{comments.length}/200</p>
                    </div>

                    <button disabled={isSubmittingComment} onClick={(e) => handaleSubmitComment(e, postId, receiverId, user?.userData?.[0].image_url, user?.userData?.[0].name, user?.userData?.[0].user_email)} className='comment-submit-button'>
                        submit
                    </button>
                </div>
            </div>
            {isSubmittingComment && (
                <BarLoader loading={isSubmittingComment} width={'100%'} color="rgb(40, 115, 255)" speedMultiplier={0.9}/>
            )}
             
        </motion.div>
        </>
    )
}

export default CommentSection;