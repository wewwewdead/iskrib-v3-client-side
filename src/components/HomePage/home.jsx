import React, { useEffect, useState, useRef } from "react";
import './home.css'
import { useAuth } from "../../Context/Authcontext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../SideBar/Sidebar";
import { MoonLoader, BeatLoader } from "react-spinners";
import { checkUser, submitProfileData } from "../../../API/Api";
import { motion, AnimatePresence } from "framer-motion";

const HomePage = () => {
    const navigate = useNavigate(null);

    const imgRef = useRef(null)
    const {session, signOut , user, loading} = useAuth();
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [profilePreview, setProfilePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [name, setName] = useState('')
    const [bio, setBio] = useState('')
    const [uploadingUserData, setUploadingUserData] = useState(false)

    const handleSignOut = async(e) =>{
        e.stopPropagation();
        await signOut();
        return navigate('/login')
    }
    const handleClickUploadPhoto = (e) =>{
        e.stopPropagation();
        if(imgRef.current){
            imgRef.current.click();
        }
    }
    const handleImageChange = (e) =>{
        const file = e.target.files[0];
        if(file){
            setImageFile(file)
            const reader = new FileReader();
            reader.onloadend = () =>{
                setProfilePreview(reader.result)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async(e) =>{
        e.stopPropagation();
        e.preventDefault();
        try {
            setUploadingUserData(true)
            const formdata = new FormData();
            if(imageFile){
                formdata.append('image', imageFile);
            }
            if(bio && name){
                formdata.append('name', name)
                formdata.append('bio', bio)
            }
            const {data} = await submitProfileData(formdata, session?.access_token);
            if(data){
                console.log(data)
            }
        } catch (error) {
            throw new Error('error uploading data')
        } finally {
            setBio('')
            setName('')
            setImageFile(null)
            setProfilePreview('')
            setUploadingUserData(false)
            window.location.reload()
        }
        
    }

    useEffect(() =>{
        if(!session && !loading){
            return navigate('/login')
        }
        //check if the user has user metadata on the users table database if not then show a UI that let them input there data and save to database
    }, [session, loading, navigate])

    useEffect(() => {
        const getUserData = async() => {   
            const userData = await checkUser(session?.user.id)   
            if(userData){
                const exist = userData.exist;
                if(!exist){
                    setShowProfileEditor(true)
                }
            }
        }
        if(session && !loading){
            getUserData();
        }

    },[session, loading])

    return(
        <>
        {uploadingUserData && (
            <>
            <div className="uploading-bg">
                <BeatLoader loading={uploadingUserData} size={20} speedMultiplier={2}/>
            </div>
            </>
        )}

        {showProfileEditor && (
        <div className="profile-editor-bg">
            <AnimatePresence>
            <motion.div 
            className="profile-editor"
            initial={{scale: 0, opacity: 0}}
            animate={{scale: 1, opacity: 1, transition: {type: 'tween', duration: 0.3}}}
            exit={{
                y: '100%',
                opacity: 0,
                transition:{type:'tween', duration: 0.25}
            }}
            >
                
                <div className="edit-profile-header">
                    <div className="edit-profile-title-container">
                            Edit profile
                    </div>

                    <button disabled={!bio || !name} onClick={(e) => handleSubmit(e)} className={!bio || !name ? "save-bttn-disabled" : 'save-bttn'}>
                        Save
                    </button>      
                </div>

                <div className="profile-edit-container">
                    <div className="profile-edit-backdrop-filter">
                        <div onClick={(e) => handleClickUploadPhoto(e)} className="camera-icon-container">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#FFFFFF"><path d="M480-260q75 0 127.5-52.5T660-440q0-75-52.5-127.5T480-620q-75 0-127.5 52.5T300-440q0 75 52.5 127.5T480-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29ZM160-120q-33 0-56.5-23.5T80-200v-480q0-33 23.5-56.5T160-760h126l74-80h240l74 80h126q33 0 56.5 23.5T880-680v480q0 33-23.5 56.5T800-120H160Zm0-80h640v-480H638l-73-80H395l-73 80H160v480Zm320-240Z"/></svg>
                        </div>
                        <input onChange={(e) => handleImageChange(e)} ref={imgRef} type="file" accept="image/*" style={{display: "none"}} />
                    </div>
                    <img className="profile-img-edit-preview" src={profilePreview || '../src/assets/profile.jpg'} alt="profile-photo" />
                </div>

                <div className="profile-edit-metadata-container">
                    <div className="name-input-container">
                        <div className="input-title-container">
                            <span className="input-title">Name</span>
                            <span className="input-title" style={name?.length > 19 ? {color: 'red'} : {}}>
                                {`${name?.length}/20`}
                            </span>
                        </div>
                        
                        <input value={name} maxLength={20} onChange={(e) => setName(e.target.value)} className="edit-profile-name-input" type="text" />
                    </div>
                    <div className="bio-input-container">
                        <div className="input-title-container">
                            <div className="input-title-container">
                                <span className="input-title">Bio</span>
                                <span style={bio.length > 149 ? {color: 'red'} : {}} className="input-title">
                                    {`${bio?.length}/150`}
                                </span>
                            </div>
                        </div>
                        
                        <textarea value={bio} onChange={(e) => setBio(e.target.value)} maxLength={150} className="edit-profile-bio-input" type="text" />
                    </div>
                    
                </div>

            </motion.div>
            </AnimatePresence>
        </div>
        )}
        
        <div className="home-parent-container">
             <div className="side-bar-holder-container">
                <Sidebar/>
            </div>
            <div className="center-bar-holder-container">
                {user?.email}
            </div>
            <div className="sidebar-right-holder-container" onClick={(e) => handleSignOut(e)}>
                Log out
            </div>
        </div>
        </>
    )
}
export default HomePage