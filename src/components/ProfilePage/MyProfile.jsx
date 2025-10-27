import React, { useEffect, useState, useRef, use } from "react";
import './myprofile.css'
import { useAuth } from "../../Context/Authcontext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../SideBar/Sidebar";
import { MoonLoader, BeatLoader, BarLoader} from "react-spinners";
import { checkUser, getUserData, submitProfileData } from "../../../API/Api";
import { motion, AnimatePresence } from "framer-motion";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Editor from "../HomePage/Editor/Editor";
import { useCallback } from "react";
import PostCards from "../HomePage/postCards/PostCards";
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import {HeadingNode} from "@lexical/rich-text";
import ImageNode from "../HomePage/Editor/nodes/ImageNode";

const MyProfile = () => {
    const {user, session, isLoading} = useAuth();
    const userData = user?.userData?.[0]
    const [showProfileEditor, setShowProfileEditor] = useState(false)

    const navigate = useNavigate();
    const navigatePath = (path) => {
        return navigate(path);
    }
    
    const links = [
        {path: '/home', label: 'Home', action: ()=> navigatePath('/home'), icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000ff"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>},
        {path: '/profile', label: 'Profile', action: ()=> navigatePath('/profile'), icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000ff"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z"/></svg>},
        {path: '/boomark', label: 'Bookmarks', action: ()=> navigatePath('/bookmark'), icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000ff"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>},
        {label: 'Write', action: () => setShowEditor(true), className: 'write-journal-bttn'}, // the action function will set the state  to (true)and pass to the HOME.jsx when user clicks the function
    ]
    useEffect(() => {
        console.log(user)
    }, [user])

    const handleClickEdit = (e) => {
        e.stopPropagation();
        console.log('clicked')
        setShowProfileEditor(true)
    }

    const closeEditor = (e) => {
        e.stopPropagation();
        setShowProfileEditor(false)
    }
    if(isLoading){
        return(
            <>
            <div className="profile-page-loading-container">
                <MoonLoader loading={isLoading} color="rgba(0, 0, 0, 1)" size={40} speedMultiplier={1}/>
            </div>
            
            </>
        )
    }
    return(
        <>
            {showProfileEditor && (
                <AnimatePresence>
                <div className="profile-editor-bg">
                    <motion.div
                    className="profile-editor-container"
                    initial={{opacity:0, scale:0}}
                    animate={{opacity:1, scale:1, transition: {type: 'tween', duration: 0.3}}}
                    exit={{opacity:0, scale:0, transition: {type: 'tween', duration: 0.3}}}
                    >
                        <div onClick={(e) => closeEditor(e)}>
                            close
                        </div>
                    </motion.div>
                </div>
                </AnimatePresence>
            )}
            

            <div className="profile-parent-container">
                <div className="side-bar-holder-container">
                    <Sidebar links={links}/> {/*passing the setShowEditor to this component to be used as a state setter inside this component*/}
                </div>

                <div className="profile-center-bar-container">
                    <div className="hero-section">
                         <div className="my-profile-image-container">
                            <img className="my-profile-image" loading="lazy" src={user?.userData[0]?.imageUrl || '../../src/assets/profile.jpg'} alt="" />

                            <div className="edit-profile-bttn-container">
                                <div onClick={(e) => handleClickEdit(e)} className="edit-profile-bttn">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z"/></svg>
                                    Edit
                                </div>
                            </div>
                        </div>
                        
                        <div className="profile-name-container">
                            <p className="profile-name">{userData?.name}</p>
                            <p className="profile-user-email">{userData?.user_email}</p>
                        </div>

                        <div className="metadata-container">
                            <p className="profile-date-joined">Joined {new Date(userData?.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: '2-digit',
                                year: 'numeric'
                            })}</p>

                            <div className="follows-container">
                                <p>Following</p>
                                <p>Followers</p>
                            </div>
                        </div>
                        
                        <div className="profile-bio-container">
                            <p className="profile-bio">
                                {userData?.bio}
                            </p>
                        </div>
                       
                    </div>
                </div>

                <div className="profile-sidebar-right-holder-container">
                    {/* Log out */}
                </div>
            </div>
        </>
    )
}
export default MyProfile;