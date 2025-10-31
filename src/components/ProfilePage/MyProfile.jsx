import React, { useEffect, useState, useRef, use, createElement } from "react";
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

import Cropper from "react-easy-crop";
import getCroppedImage from "../../../utils/getCroppedImage";
import extractDominantColors from "../../../utils/extractDominantColors";

const MyProfile = () => {
    const {user, session, isLoading} = useAuth();
    const userData = user?.userData?.[0]
    const [showProfileEditor, setShowProfileEditor] = useState(false)
    const [editImagePreview, setEditImagePreview] = useState('')
    const [profileEditName, setProfileEditName] = useState('')
    const [profileEditBio, setProfileEditBio] = useState('')

    const [showEditor, setShowEditor] = useState(false);
    const [showBgPicker, setShowBgPicker] = useState(false);

    const [imageSrc, setImageSrc] = useState(null);
    const [crop, setCrop] = useState({x: 0, y: 0});
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCropAreaPixels] = useState(null)
    const [gradientPicked, setGradientPicked] = useState(null);
    const [croppedImage, setCroppedImage] = useState({});

    const [showFontColorSelector, setShowFontColorSelector] = useState(false);
    const [fontColor, setFontColor] = useState('#000000')

    const inputRef = useRef();
    const bgInputRef = useRef();
    const fontColorInputRef = useRef();

    //for gradient effect based on the bg background
    const [dominantColors, setDominantColors] = useState('#ffffffff');
    const [secondaryColors, setSecondaryColors] = useState('#ffffffff')

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

    const gradients = [
        {style: {background: '#2A7B9B', backgroundImage: 'linear-gradient(90deg,rgba(42, 123, 155, 1) 0%, rgba(87, 199, 133, 1) 50%, rgba(237, 221, 83, 1) 100%)'}},
        {style: {background: '#FF7E5F', backgroundImage: 'linear-gradient(90deg, rgba(255,126,95,1) 0%, rgba(254,180,123,1) 50%, rgba(255,236,210,1) 100%)'}},
        {style: {background: '#2193b0', backgroundImage: 'linear-gradient(90deg, rgba(33,147,176,1) 0%, rgba(109,213,237,1) 50%, rgba(255,255,255,1) 100%)'}},
        {style: {background: '#8E2DE2', backgroundImage: 'linear-gradient(90deg, rgba(142,45,226,1) 0%, rgba(74,0,224,1) 50%, rgba(0,212,255,1) 100%)'}},
        {style: {}}
    ]

    useEffect(() => {
        console.log(user)
    }, [user])




    //this fucntions are for the bg edit and profile edits

    const handleClickEdit = (e) => {
        e.stopPropagation();
        console.log('clicked')
        setShowFontColorSelector(false)
        setEditImagePreview(userData?.imageUrl)
        setProfileEditName(userData?.name)
        setProfileEditBio(userData?.bio)
        setShowProfileEditor(true)
    }

    const closeEditor = (e) => {
        e.stopPropagation();
        setEditImagePreview('')
        handleHideGradientPicker(e)
        setImageSrc(null)
        setShowProfileEditor(false)
        
    }

    const handleCloseRichTextEditor = useCallback(() =>{
        setShowEditor(false);
    }, [])

    const handleImageOnChange = (e) => {
        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onloadend = () =>{
                setEditImagePreview(reader.result)
            }

            reader.readAsDataURL(file)
        } else {
            setEditImagePreview('')
        }
    }

    const insertImageFromFile = (e) => {
        e.stopPropagation();
        if(inputRef.current){
            inputRef.current.click();
        }
    }

    const handleShowGradientPicker = (e) =>{
        e.stopPropagation();
        setShowBgPicker(true)
    }

    const handleHideGradientPicker = (e) =>{
        e.stopPropagation();
        setShowBgPicker(false)
        setGradientPicked({})
        setImageSrc(null)
    }
    const handleSaveProfileEdit = () =>{
        setShowBgPicker(false)
        setShowProfileEditor(false)
    }

    const handleSelectGradient = useCallback((gradient) => {
        setCroppedImage(null);
        setGradientPicked(gradient);
    }, [gradientPicked])

    const handleInsertBgImage = (e) =>{
        e.stopPropagation();
        if(bgInputRef.current){
            bgInputRef.current.value = ''
            bgInputRef.current.click();
        }

    }
    const handleBgOnchange = (e) => {
        const file = e.target.files[0];
        if(file){
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new Image();
                img.crossOrigin = "anonymous";

                img.src = reader.result;

                img.onload = () => {
                    const colors = extractDominantColors(img);
                    console.log('colors', colors)

                    setDominantColors(colors.primary);
                    setSecondaryColors(colors.secondary);
                }
                
                setImageSrc(reader.result)
            }


            reader.readAsDataURL(file);
        } else {
            return setGradientPicked({});
        }
    }

    const handleHideCropper = (e) =>{
        setImageSrc(null);
        setCroppedImage(null)
        if(bgInputRef.current){
            bgInputRef.current.value = '';
        }
    }

    const handleSaveCropped = async() =>{
        setGradientPicked(null);
        const croppedImageUrl = await getCroppedImage(imageSrc, croppedAreaPixels);
        if(croppedImageUrl){
            console.log(croppedImageUrl.file);
        }
        setCroppedImage({backgroundImage: `url(${croppedImageUrl.url})`, backgroundSize: 'cover', backgroundPosition : 'center', backgroundRepeat: 'no-repeat'});
        setImageSrc(null);
        
        setTimeout(() =>{
            setImageSrc(null)
        }, 300)    
    }

    const handleClickFontColorSelector = (e) =>{
        e.stopPropagation()
        setShowFontColorSelector(true)
    }

    const handleClickInputColor = () =>{
        if(fontColorInputRef.current){
            fontColorInputRef.current.click();
        }
    }

    const handleClickSaveFontColor = () => {
        setShowFontColorSelector(false)
    }
    const hancleClickCancelFontSelect = () => {
        setShowFontColorSelector(false)
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
        {showFontColorSelector && (
            <AnimatePresence>
                <motion.div
                className="font-selector-container"
                >
                    <div onClick={() => handleClickInputColor()} style={{background: `${fontColor}`}} className="input-color"></div>
                    <input ref={fontColorInputRef} value={fontColor} onChange={(e) => setFontColor(e.target.value)} style={{display: 'none'}} type="color" />
                    <div className="save-font-color-bttn-container">
                        <div onClick={() => hancleClickCancelFontSelect()}>Cancel</div>
                        <div onClick={() => handleClickSaveFontColor()}>Save</div>
                    </div>
                    
                </motion.div>
            </AnimatePresence>
        )}
        {showBgPicker && (
            <AnimatePresence>
                <motion.div 
                initial={{opacity:0}}
                animate={{opacity:1}}
                exit={{opacity: 0}}
                transition={{type: 'spring', stiffness: 250, damping: 25 }}
                className="profile-bg-picker-container"
                >
                    <div className="profile-bg-picker-header">
                        Pick a gradient or add image
                    </div>

                    <input onChange={(e) => handleBgOnchange(e)} style={{display:'none'}} ref={bgInputRef} type="file"  accept="image/*"/>

                    <div className="profile-bg-color-palette">
                        {gradients.map((gradient, index) => (
                            <div onClick={() => handleSelectGradient(gradient.style)} key={index} className="gradient-box" style={gradient.style}></div>
                        ))}
                        <div onClick={(e) => handleInsertBgImage(e)} className="add-bgImage-bttn">
                            <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px" fill="#000000"><path d="M480-480ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm40-160h480L570-480 450-320l-90-120-120 160Zm440-320v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"/></svg>
                        </div>
                    </div>

                    <div style={gradientPicked || croppedImage} className="profile-bg-preview">
                        {imageSrc && (
                            <>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={3 / 1}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_, croppedPixels) => setCropAreaPixels(croppedPixels)}
                            />
                            <div className="controls">
                                <input 
                                type="range" 
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(e.target.value)}
                                />
                            </div>
                            <div className="confirm-cropped-bg-container">
                                <div onClick={(e) => handleHideCropper(e)} className="confirm-cropped-bg-container-cancel">
                                    Cancel
                                </div>
                                <div onClick={() => handleSaveCropped()} className="confirm-cropped-bg-container-ok">
                                    Ok
                                </div>
                            </div>
                            </>  
                        )}
                        
                        
                    </div>

                    <div className="canvel-save-container">
                        <div onClick={(e) => handleHideGradientPicker(e)} className="cancel-button">cancel</div>
                        <div onClick={() => handleSaveProfileEdit()} className="save-button">save</div>
                    </div>
                </motion.div>
            </AnimatePresence>
            )}
        <AnimatePresence>
            {showProfileEditor && (
                <div key={'profile-editor'} className="profile-editor-bg">
                    <motion.div
                    className="profile-editor-container"
                    initial={{scale: 0, opacity: 0.8}}
                    animate={{scale: 1, opacity: 1}}
                    exit={{scale: 0.8, opacity: 0,}}
                    transition={{type: 'spring', stiffness: 250, damping: 25}}
                    >
                        <div className="profile-editor-close-button-container">
                            <div onClick={(e) => closeEditor(e)} className="profile-editor-close-button">
                                <svg  xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                            </div>
                        </div>

                        <div style={croppedImage || gradientPicked} className="edit-profile-hero-section">

                            <div className="profile-edit-image-container">

                                <div className="profile-edit-image-bg">
                                    <div onClick={(e) => insertImageFromFile(e)} className="edit-profile-addImage-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000"><path d="M440-440ZM120-120q-33 0-56.5-23.5T40-200v-480q0-33 23.5-56.5T120-760h126l74-80h240v80H355l-73 80H120v480h640v-360h80v360q0 33-23.5 56.5T760-120H120Zm640-560v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80ZM440-260q75 0 127.5-52.5T620-440q0-75-52.5-127.5T440-620q-75 0-127.5 52.5T260-440q0 75 52.5 127.5T440-260Zm0-80q-42 0-71-29t-29-71q0-42 29-71t71-29q42 0 71 29t29 71q0 42-29 71t-71 29Z"/></svg>
                                        <input onChange={(e) => handleImageOnChange(e)} ref={inputRef} type="file" accept='image/*' style={{display: 'none'}}/>
                                    </div>
                                </div>

                                <div className="profile-edit-image-child-container">
                                    <img className="my-profile-image-editable" src={editImagePreview || '../../src/assets/profile.jpg'} alt="" />
                                </div> 

                                <div onClick={(e) => handleShowGradientPicker(e)} className="add-profile-background">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M200-120q-33 0-56.5-23.5T120-200v-240h80v240h240v80H200Zm320 0v-80h240v-240h80v240q0 33-23.5 56.5T760-120H520ZM240-280l120-160 90 120 120-160 150 200H240ZM120-520v-240q0-33 23.5-56.5T200-840h240v80H200v240h-80Zm640 0v-240H520v-80h240q33 0 56.5 23.5T840-760v240h-80Zm-140-40q-26 0-43-17t-17-43q0-26 17-43t43-17q26 0 43 17t17 43q0 26-17 43t-43 17Z"/></svg>
                                    Add background
                                </div>
                            </div>

                            <div className="edit-profile-input-name-container">
                                <div className="input-identifier-container">
                                    <div className="input-identifier">
                                        <p>Name</p>
                                    </div>
                                    <div className="profile-edit-name-length">
                                        <p style={profileEditName.length > 19 ? {color: 'rgba(255, 29, 29, 0.81)', fontWeight: '850'} : {}}>{profileEditName.length}/20</p>
                                    </div>
                                </div>
                                <input maxLength={20} value={profileEditName} onChange={(e) => setProfileEditName(e.target.value)} className="edit-profile-input" type="text" />
                            </div>

                            <div className="edit-profile-input-bio-container">
                                <div className="input-bio-identifier-container">

                                    <div className="bio-identifier">
                                        <p>Bio</p>
                                    </div>

                                    <div className="profile-edit-bio-length">
                                        <p style={profileEditBio.length > 149 ? {color: 'rgba(255, 29, 29, 0.81)', fontWeight: '850'} : {}}>{profileEditBio.length}/150</p>
                                    </div>
                                    
                                </div>
                                <textarea onChange={(e) => setProfileEditBio(e.target.value)} value={profileEditBio} maxLength={150} className="bio-textarea" name="bio" id=""></textarea>
                            </div>

                        </div>
                        
                    </motion.div>
                </div>
            )}

            {showEditor && (
                <Editor key={'main-editor'} onClose={handleCloseRichTextEditor}/>
            )}
            

            <div 
            className="profile-parent-container"
            style={croppedImage ? {background:`linear-gradient(135deg, ${dominantColors}0%, ${secondaryColors} 100%)`} : gradientPicked}
            >
                {gradientPicked && (
                    <div className="blurred-gradient-bg" style={gradientPicked}/>
                )}

                {croppedImage && (
                    <div 
                        style={croppedImage} 
                        className="blurred-img-bg"
                    />
                )}
                
                    
                <div className="side-bar-holder-container">
                    <Sidebar links={links}/> {/*passing the setShowEditor to this component to be used as a state setter inside this component*/}
                </div>

                <div style={{color: fontColor}} className="profile-center-bar-container">
                    <div style={croppedImage || gradientPicked} className="hero-section">
                         <div className="my-profile-image-container">
                            <img className="my-profile-image" loading="lazy" src={userData?.imageUrl || '../../src/assets/profile.jpg'} alt="" />

                            <div className="edit-profile-bttn-container">
                                <div onClick={(e) => handleClickEdit(e)} className="edit-profile-bttn">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={fontColor}><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z"/></svg>
                                    Edit
                                </div>
                                <div onClick={(e) => handleClickFontColorSelector(e)} className="font-picker-container">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={fontColor}><path d="M80 0v-160h800V0H80Zm140-280 210-560h100l210 560h-96l-50-144H368l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z"/></svg>
                                    Change font color
                                    {/* {secondaryColors}
                                    {dominantColors} */}
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
        </AnimatePresence>
        </>
    )
}
export default MyProfile;