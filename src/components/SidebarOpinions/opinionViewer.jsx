import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { addReplyOpinion, getViewOpinion } from "../../../API/Api";
import { useAuth } from "../../Context/useAuth";
import { useEffect } from "react";
import { useState } from "react";
import { useRef } from "react";

const OpinionViewer = () =>{
    const queryClient = useQueryClient();
    const location = useLocation();
    const {opinionId, userId} = location.state;
    const {user} = useAuth();
    const textAreaRef = useRef(null);

    const [replyOpinion, setReplyOpinion] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const {data, isLoading} = useQuery({
        queryKey: ['getViewOpinion', opinionId, userId],
        queryFn: ({queryKey}) => getViewOpinion(queryKey[1], queryKey[2]),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled: !!opinionId && !!userId
    })

    const cancelTyping = (e) =>{
        setIsTyping(false)
        setReplyOpinion('')
        if(textAreaRef.current){            
            textAreaRef.current.innerText = ''
            //remove the textarea focus
            textAreaRef.current.blur();
        }
    }

    const submitReply = async(opinionId, receiverId, senderId, parentId)=>{
        console.log(replyOpinion);
        const formData = new FormData();
        formData.append('opinion', replyOpinion);

        try {
            const res = await addReplyOpinion(formData, opinionId, receiverId, senderId, parentId);
            if(res){
                console.log(res);
            }
            setReplyOpinion('')
            if(textAreaRef.current){
            textAreaRef.current.innerText = ''
            queryClient.invalidateQueries(['getViewOpinion', opinionId, receiverId])
        }
        } catch (error) {
            console.error(error);
            setReplyOpinion('')
            if(textAreaRef.current){
                textAreaRef.current.innerText = ''
            }
            queryClient.invalidateQueries(['getViewOpinion', opinionId, receiverId])
            //invalidateQueries the query of the reply cards component where the recursive happens so it will update the data lived there
        }
    }


    const opinionData = data?.data;
    return(
        <>
        {opinionData?.map((opinion) => (
            <div className="opinion-viewer-parent-container" key={opinion.id}>
                <div className="opinion-user-data-card">
                    <img className="opinion-user-profile" src={opinion.users.image_url || '../assets/profile.jpg'} alt="" />
                    <p>{opinion.users.name} <span className="opinion-user-email">@{opinion.users.user_email}</span></p>
                </div>
                <div className="opinion-content-card">
                    {opinion.opinion}
                </div>

                <div className="opinion-metadata">
                    <p>{opinion.reply_count} replies</p>
                    <p>∙</p>
                    <p>
                        {new Date(opinion.created_at).toLocaleDateString('en-US',{
                            month: 'long',
                            day: '2-digit',
                            year: 'numeric',
                        })} at {new Date(opinion.created_at).toLocaleTimeString('en-US',{
                            hour: 'numeric'
                        })}
                    </p>
                </div>

                <div className="add-opinion-reply-container">
                    <img className="opinion-user-profile-add-reply" src={user?.userData[0].image_url || '../assets/profile.jpg'} alt="" />
                    <div onFocus={() => setIsTyping(true)} ref={textAreaRef} value={replyOpinion} onInput={(e) => setReplyOpinion(e.currentTarget.innerText.trim())} data-placeholder={`Add a reply to '${opinion.users.name}'`} className="opinion-reply-area" contentEditable='true' role="textarea"></div>
                </div>

                {isTyping && (
                    <div className="submit-buttn-container">
                        <button onClick={(e) => cancelTyping(e)} className="cancel">Cancel</button>
                        <button disabled={replyOpinion.trim().length === 0} onClick={() => submitReply(opinionId, userId, user?.userData[0].id, opinion.id)} className={replyOpinion.trim().length === 0 ? "submit-disabled" : "submit"}>Submit</button> 
                    </div>
                )}
                
            </div>
        ))}
        </>
    )
}
export default OpinionViewer;