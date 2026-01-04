import { useState } from "react";
import { useAuth } from "../../Context/useAuth";
import { addOpinion } from "../../../API/Api";
import { BarLoader } from "react-spinners";
import { useQueryClient } from "@tanstack/react-query";

const OpinionEditor = ({onClose}) =>{
    const [opinion, setOpinion] = useState('');
    const {session} = useAuth();
    const [isSaving, setIsSaving] = useState(false);

    const queryClient = useQueryClient();

    const handleCloseEditor = () =>{
        onClose();
    }

    const handleClickSave = async(e) =>{
        e.stopPropagation();
        if(isSaving){
            return;
        }
        const formdata = new FormData();
        formdata.append('opinion', opinion)
        
        try {
            setIsSaving(true);

            const message = await addOpinion(formdata, session?.access_token);
            if(message){
                console.log(message)
            }
            setIsSaving(false)
            queryClient.invalidateQueries(['getOpinions']);
        } catch (error) {
            setIsSaving(false)
            setOpinion('')
            throw new Error('error uploading data')
        } finally {
            setOpinion('')
            onClose();
        }

    }

    return(
        <>
        <div className="opinion-editor-parent-container">
            <div className="opinion-editor-container">
                <div className="editor-close-bttn-container">
                    <svg onClick={() => handleCloseEditor()} className="editor-close-bttn" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"></path></svg>
                </div>

                <div className="text-area-container">
                    <textarea maxLength={280} value={opinion} onChange={(e) => setOpinion(e.target.value)} className="opinions-textarea" name="opinions" id="opinions-textarea" placeholder="Share your opinions..."></textarea>
                </div>
                <div style={opinion.length > 279 ? {color: 'red'} : {}} className="text-counter-container">
                    {opinion.length}/280
                </div>
                <div className="opinions-save-bttn-container">
                    <button onClick={(e) => handleClickSave(e)} style={!opinion ? {backgroundColor: '#c8c8c8ff', cursor:'default'} : {}} disabled={!opinion} className="opinions-save-bttn">
                        Save
                    </button>
                </div>

                {isSaving && (
                    <div className="saving-opinion-loading-container">
                        <BarLoader loading={isSaving} width={'100%'} color="rgb(40, 115, 255)" speedMultiplier={0.7}/>
                    </div>
                )}
                
            </div>
        </div>
        </>
    )
}

export default OpinionEditor;