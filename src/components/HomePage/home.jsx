import React, { useEffect, useState, useRef, use } from "react";
import './home.css'
import { useAuth } from "../../Context/Authcontext";
import { useNavigate } from "react-router-dom";
import Sidebar from "../SideBar/Sidebar";
import { MoonLoader, BeatLoader, BarLoader } from "react-spinners";
import { checkUser, getUserData, submitProfileData } from "../../../API/Api";
import { motion, AnimatePresence } from "framer-motion";

import { useQuery, useQueryClient } from '@tanstack/react-query';
import Editor from "./Editor/Editor";
import { useCallback } from "react";
import PostCards from "./postCards/PostCards";
import { saveJournal } from "../../../API/Api";
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import {HeadingNode} from "@lexical/rich-text";
import ImageNode from "./Editor/nodes/ImageNode";

const HomePage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    /* theme for mapping css classes to lexical roles */
    const theme = {
        paragraph: 'editor-paragraph',
        heading: 'editor-heading',
    }

    const initaConfig = {
        namespace: "MyLexicalEditor",
        theme,
        //register nodes
        nodes: [ImageNode, HeadingNode ],
         onError(error){
            throw error;
        },
    }

    const navigatePath = (path) => {
        if(window.location.pathname === path){
           return window.location.reload()
        }
        return navigate(path);
    }
    const links = [
        {path: '/home', label: 'Home', action: ()=> navigatePath('/home'), icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000ff"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>},
        {path: '/profile', label: 'Profile', action: ()=> navigatePath('/profile'), icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000ff"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z"/></svg>},
        {path: '/boomark', label: 'Bookmarks', action: ()=> navigatePath('/bookmark'), icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000ff"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>},
        {label: 'Write', action: () => setShowEditor(true), className: 'write-journal-bttn'}, // the action function will set the state  to (true)and pass to the HOME.jsx when user clicks the function
    ]

    const header_links = [
        {label: 'For You'},
        {label: 'Following'},
        {label: 'Trending'},
    ]

    const imgRef = useRef(null)
    const {session, signOut, user, loading, isLoading} = useAuth();
    const [showProfileEditor, setShowProfileEditor] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [profilePreview, setProfilePreview] = useState(null);
    const [imageFile, setImageFile] = useState(null);

    const [name, setName] = useState('')
    const [bio, setBio] = useState('')
    const [uploadingUserData, setUploadingUserData] = useState(false)
   
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

    const handleCloseEditor = useCallback(() => {
        setShowEditor(false)
    }, [])


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
            setShowProfileEditor(false)
            queryClient.invalidateQueries(['userData', session?.access_token]);
            
        }
        
    }

    useEffect(() => {
        if(!session && !loading){
            return navigate('/login')
            //check if the user has user metadata on the users table database if not then show a UI that let them input there data and save to database
        }

    },[session, loading])

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

    if(isLoading){
        return(
            <>
            <div className="homepage-loading-container">
                <MoonLoader loading={isLoading} color="rgba(0, 0, 0, 1)" size={40} speedMultiplier={1}/>
            </div>
            </>
        )
    }

    return(
        <>
        <LexicalComposer initialConfig={initaConfig}>
        {showEditor && (
            <AnimatePresence>
                <Editor key={'main-editor'} onClose={handleCloseEditor}/>
            </AnimatePresence>
            
        )}
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
                <Sidebar links={links}/> {/*passing the setShowEditor to this component to be used as a state setter inside this component*/}
            </div>
            <div className="center-bar-holder-container">
                <div className="newsfeed-header">
                    {header_links.map((header_link, index) => (
                        <div key={index} className="header-links">
                            {header_link.label}
                        </div>
                    ))}
                    
                </div>
                <AnimatePresence>
                    <PostCards/>
                </AnimatePresence>
            </div>
            <div className="sidebar-right-holder-container">
                {/* Log out */}
            </div>
        </div>
        </LexicalComposer>
        </>
    )
}
export default HomePage