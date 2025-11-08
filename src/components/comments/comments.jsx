import { useEffect, useState } from 'react';
import './comments.css'
import { AnimatePresence, motion} from "framer-motion";
import { addComment } from '../../../API/Api';
import { useAuth } from '../../Context/Authcontext';
import { getComments } from '../../../API/Api';
import { useInfiniteQuery } from '@tanstack/react-query';

const CommentSection = ({onclose, postId})=>{
    const {session, user} = useAuth();
    const userId = user?.userData?.[0].id;

    const {data, fetchNextPage, hasNextPage, isLoading} = useInfiniteQuery({
        queryKey: ['postComments', postId],
        queryFn: ({queryKey, pageParam = null}) => getComments(pageParam, 10, queryKey[1]),
        getNextPageParam: (lastPage) => {
            if(lastPage?.data?.length > 0) {
                const lastComment = lastPage.data[lastPage?.data?.length - 1];
                return new Date(lastComment.created_at).toISOString();
            } else {
                return undefined;
            }
        },
    })

    useEffect(() =>{
        if(data){
            console.log(data)
        }
    }, [data])

    const [comments, setComments] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    const handeCloseCommentsSection = (e) =>{
        e.stopPropagation();
        onclose()
    }

    const handaleSubmitComment = async(e, postId) =>{
        e.stopPropagation();
        const formdata = new FormData();
        if(postId){
            formdata.append('postId', postId)
        }
        if(comments){
            formdata.append('comments', comments)
        }

        try {
            setIsSubmittingComment(true)
            const message = await addComment(session?.access_token, formdata);
        if(message){
            console.log(message)
        }
        } catch (error) {
            throw new Error('error adding comments')
        } finally {
            setIsSubmittingComment(false)
            setComments('')
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
                {commentsData?.length > 0 ? (
                    commentsData.map((comment, index) => (
                        <div className='comment-cards' key={index}>
                            <div className='comment'>
                                <p>{comment.comment}</p>
                            </div>

                            <div className='comment-user-metadata-container'>
                                <p style={{padding: 0, margin: 0, fontSize: '0.8rem'}}>Commented By</p>
                                <img className='comments-avatar' src={comment.users.image_url || '../../src/assets/profile.jpg'} alt="" />
                                <p className='commenter-name'>{comment?.users?.name}</p>
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
                ) : (
                    <div>
                        <p>no comments available</p>
                    </div>
                )}
            </div>

            <div className='comments-input-container'>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)} className='comments-input' type="text" maxLength={200} placeholder='Type your comments'/>
                
                <div className='button-section'>
                    <div className='comments-counter-container'>
                        <p style={comments.length > 199 ? {color: 'rgba(255, 46, 46, 1)', fontWeight: '660'} : {}} className='comments-counter'>{comments.length}/200</p>
                    </div>

                    <button disabled={isSubmittingComment} onClick={(e) => handaleSubmitComment(e, postId)} className='comment-submit-button'>
                        submit
                    </button>
                </div>
                
            </div>
        </motion.div>
        </>
    )
}

export default CommentSection;