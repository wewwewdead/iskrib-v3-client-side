import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import ImageNode from "../Editor/nodes/ImageNode";
import { HeadingNode } from "@lexical/rich-text";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { data, useLocation, useNavigate } from "react-router-dom";
import './contentviewer.css'
import { use, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, } from "framer-motion";
import CalculateText from "../postCards/calculateReadingTime";
import { useBookMarkMutation, useLikeMutation } from "../../../utils/useMutation";
import { useAuth } from "../../../Context/Authcontext";
import CommentSection from "../../comments/comments";
import debounce from "../../../../helpers/debounce";
import formatCounts from "../../../../helpers/fomatCounts";
import { handleClickProfile } from "../../../../helpers/handleClicks";

const ContentView =() =>{
    const navigate = useNavigate();
    const [showBackButton, setShowBackButton] = useState(true);
    const {session, user} = useAuth();

    const [showCommentsContainer, setShowCommentsContainer] = useState(false);
    const [isLiked, setIsliked] = useState('')
    const [likesCount, setLikesCount] = useState(null);
    const [isBookmarked, setIsBookmarked] = useState(null);
    const [bookmarkCounts, setBookmarkCounts] = useState(null);

    const contentRef = useRef();
   
    const theme = {
        paragraph: 'editor-paragraph',
        heading: {
            h1: 'editor-heading-h1',
            h2: 'editor-heading-h2',
            h3: 'editor-heading-h3',
        },
        text: {
            bold: 'editor-text-bold',
            italic: 'editor-text-italic',
            underline: 'editor-text-underline',
        }
    }
    
    const location = useLocation();
    const postData = location.state;

    const handleclickUserProfile = handleClickProfile(navigate);

    const handleLike = async(e, journalId) => {
        await handleClickLike(e, journalId)
        e.stopPropagation();
    }
    const handleBookmark = async(e, journalId) =>{
        await handleClickBookmark(journalId);
        e.stopPropagation();
    }

    const mutationLike = useLikeMutation(session, user?.userData?.[0]?.id)
    const handleClickLike = async(e, journalId) => {
        e.stopPropagation();
        mutationLike.mutate({journalId});
        setIsliked(!isLiked)
        setLikesCount(isLiked ? likesCount - 1 : likesCount + 1)

    }
    const debounceClickLike = debounce(handleLike, 200);

    const mutationBookmark = useBookMarkMutation(session, user?.userData?.[0]?.id);
    const handleClickBookmark = async(journalId) =>{
        mutationBookmark.mutate({journalId})
        setIsBookmarked(!isBookmarked)
        setBookmarkCounts(isBookmarked ? bookmarkCounts - 1 : bookmarkCounts + 1)
    }
    const debounceClickBookmark = debounce(handleBookmark, 200);

    const handleClickFollow = (e, followingId, followerId)=>{
        e.stopPropagation();
        console.log({
            followerId: followerId,
            followingId:followingId
        })
    }

    const cardIcons = [
        {
            labelLike: (isLiked) => (<svg className="svg-like" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill={isLiked ? "rgb(255, 116, 116)" : "#5e5e5eff"}><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>),
            className: 'like-button',
            action: (e, journalId) => debounceClickLike(e, journalId),
            likeCount: (count) => <span className="content-view-countlike" style={{padding: '0', margin: '0',}}>{formatCounts(count)}</span>
        },
        {
            label:<svg className="svg-comment" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#5e5e5eff"><path d="M440-400h80v-120h120v-80H520v-120h-80v120H320v80h120v120ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"/></svg>,
            className: 'comment-button',
            action: (e) => hanldeClickComments(e),
            commentsCount: (count) => <span className="content-view-countComments" style={{padding: '0', margin: '0',}}>{formatCounts(count)}</span>
        },
        {
            labelBookmark: (isBookmarked) => (<svg className="svg-bookmark" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill={isBookmarked ? "rgb(72, 208, 135)" : "#5e5e5eff"}><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>),
            className: 'bookmark-button',
            action: (e, journalId) => debounceClickBookmark(e, journalId),
            bookmarksCount: (count) => <span className="content-view-countBookmarks" style={{padding: '0', margin: '0'}}>{formatCounts(count)}</span>
        }
    ]

   

    const handleBackLocation = (e) =>{
        e.stopPropagation();
        window.history.back();
    }

    const hanldeClickComments = (e) =>{
        e.stopPropagation();
        setShowCommentsContainer(true);
    }

    const handleCLoseComments = () =>{
        setShowCommentsContainer(false);
    }
    useEffect(() =>{
        if(postData){
            console.log(postData)
        }
        setLikesCount(postData?.likesCount)
        setBookmarkCounts(postData?.bookmarksCount)
        setIsliked(postData?.isLiked)
        setIsBookmarked(postData?.isBookmarked)
    }, [postData])

    useEffect(() => {
        let timeOut;
        const hideBackBttn = () =>{
            setShowBackButton(false);
            clearTimeout(timeOut);
            
            timeOut = setTimeout(() =>{
                setShowBackButton(true)
            }, 300)
        }

        document.addEventListener('scroll', hideBackBttn, true);
        return () =>{
            document.removeEventListener('scroll', hideBackBttn, true)
            clearTimeout(timeOut);
        }
    }, [])


    return(
        <>
        {showCommentsContainer && (
                <AnimatePresence>
                <CommentSection onclose={handleCLoseComments} postId={postData?.journalId}/>
                </AnimatePresence>
            )}
        <div ref={contentRef} className="content-viewer-container">
            {showBackButton && (
                <AnimatePresence>
                <motion.div
                className="back-button-container"
                initial={{opacity: 0}}
                animate={{opacity: 1, transition: {type: 'spring', stiffness: 300, damping: 25, mass: 0.8}}}
                exit={{ opacity: 0, y: -20,
                    transition: { 
                        duration: 0.2,
                        ease: "easeOut"
                    }
                }}
                >
                    <div onClick={(e) => handleBackLocation(e)} className="back-button">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
                    </div>
                    <p style={{padding: '0', margin: '0', fontSize: '1.2rem', fontWeight: '600'}}>Post</p>
                </motion.div>
                </AnimatePresence>
            )}

            <div className="content-title">
                <p>{postData?.title}</p>

                <div className="content-metadata-container">
                    <div onClick={(e) => handleclickUserProfile(e, user?.userData?.[0].id, postData?.userId)} className="content-avatar-container">
                        <img src={postData?.avatar} className="content-avatar" alt="user avatar" />
                    </div>
                    <div onClick={(e) => handleclickUserProfile(e, user?.userData?.[0].id, postData?.userId)} className="content-owner-name">
                        {postData?.name}
                    </div>

                    {postData?.userId !== user?.userData?.[0].id && (
                        <div onClick={(e) => handleClickFollow(e, postData?.userId, user?.userData?.[0].id)} className="follow-bttn">
                            Follow
                        </div>
                    )}
                    
                    <div className="content-created">
                        <p>
                            {new Date(postData?.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: '2-digit',
                            year: 'numeric',
                        })} at       
                        </p>
                        <p>
                            {new Date(postData?.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </div>

                    <div className="separator">
                        •
                    </div>
                    <div className="read-time">
                        {CalculateText(postData?.wholeText)}
                    </div>
            </div>

            <div className="icons-container">
                {cardIcons.map((icon, index) => (
                    <div key={index} className="content-viewer-icons">
                        <div onClick={(e) => icon.action(e, postData?.journalId)} className={icon.className}>
                            {icon.labelLike && icon.labelLike(isLiked)}  
                            {icon.label}
                            {icon.labelBookmark && icon.labelBookmark(isBookmarked)}
                        </div>
                        <div>{icon.likeCount && icon.likeCount(likesCount)}</div>
                        <div>{icon.commentsCount && icon.commentsCount(postData?.commentsCount)}</div>
                        <div>{icon.bookmarksCount && icon.bookmarksCount(bookmarkCounts)}</div>
                    </div>
                    
                ))}
            </div>

            </div>

            <LexicalComposer initialConfig={{
                namespace: "ContentViewer",
                theme: theme,
                editable: false,
                editorState: postData?.content,
                nodes: [HeadingNode, ImageNode],
                onError(error){
                    throw error
                },
            }}>
                <RichTextPlugin
                contentEditable={<ContentEditable 
                    className="content"
                    />
                }
                ErrorBoundary={LexicalErrorBoundary}
                />
            </LexicalComposer>
        </div>
        </>
    )
}

export default ContentView;