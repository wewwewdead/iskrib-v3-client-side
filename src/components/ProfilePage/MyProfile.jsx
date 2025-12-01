import React, { useEffect, useState, useRef, use, createElement } from "react";
import './myprofile.css'
import { useAuth } from "../../Context/Authcontext";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../SideBar/Sidebar";
import { MoonLoader, BeatLoader, BarLoader} from "react-spinners";
import { updateFontColor, updateProfileData } from "../../../API/Api";
import { motion, AnimatePresence } from "framer-motion";

import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import Editor from "../HomePage/Editor/Editor";
import { useCallback } from "react";

import Cropper from "react-easy-crop";
import getCroppedImage from "../../utils/getCroppedImage";
import extractDominantColors from "../../utils/extractDominantColors";
import formatCounts from "../../../helpers/fomatCounts";
import MobileNavlink from "../mobileNavLink/MobileNavLink";
import MobileSidebarLink from "../MobileSidebarLink/MobileSidebarLink";
import WriteJournalButton from "../WriteJournalButton/WriteJournalButton";

const MyProfile = () => {
    const {user, session, isLoading, notifCount, loading} = useAuth();
    const [showRichTextEditor, setShowRichTextEditor] = useState(false);

    const userData = user?.userData?.[0]

    const [showMobileSideBar, setShowMobileSideBar] = useState(false);
    
    const [showProfileEditor, setShowProfileEditor] = useState(false)
    const [editImagePreview, setEditImagePreview] = useState('')
    const [profileEditAvatar, setProfileEditAvatar] = useState(null)
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
    const [fontColor, setFontColor] = useState('')

    const inputRef = useRef();
    const bgInputRef = useRef();
    const fontColorInputRef = useRef();

    //for gradient effect based on the bg background
    const [dominantColors, setDominantColors] = useState('#ffffffff');
    const [secondaryColors, setSecondaryColors] = useState('#ffffffff')

    const [isUpdatingFont, setIsUpdatingFont] = useState(false);
    const [isUpdatingProfileConfig, setIsUpdatingProfileConfig] = useState(false);
    const [isSavingProfile, setIsSavingProfile] = useState(false);

    const navigate = useNavigate();
    const navigatePath = (path) => {
        return navigate(path);
    }
    const location = useLocation();
    
    const queryClient = useQueryClient();
    
    const links = [
        {
            path: '/home', 
            label: 'Home', action: ()=> navigatePath('/home'), 
            icon: 
            <svg xmlns="http://www.w3.org/2000/svg" width="28px" height="28px" viewBox="0 0 24 24" fill="#000000ff">
                <g id="style=fill">
                    <g id="home-line" clipPath="url(#clip0_1_110)">
                        <path id="Subtract" fillRule="evenodd" clipRule="evenodd" d="M14.3594 2.12613C13.0087 0.944612 10.9923 0.94461 9.64162 2.12612L3.2802 7.69086C2.29508 8.55261 1.72998 9.79772 1.72998 11.1066L1.72998 19.1672C1.72998 21.1459 3.33403 22.75 5.31273 22.75L18.6883 22.75C20.667 22.75 22.271 21.1459 22.271 19.1672L22.271 11.1066C22.271 9.79772 21.706 8.55261 20.7208 7.69086L14.3594 2.12613ZM10 16.1136C9.58579 16.1136 9.25 16.4494 9.25 16.8636C9.25 17.2779 9.58579 17.6136 10 17.6136L14 17.6136C14.4142 17.6136 14.75 17.2779 14.75 16.8636C14.75 16.4494 14.4142 16.1136 14 16.1136L10 16.1136Z" fill={location.pathname === '/home' ? "#000000ff" : "#b6b6b6ff"}/>
                    </g>
                </g>
            </svg>
        },
        {
            path: '/profile', 
            label: 'Profile', action: ()=> navigatePath('/profile'), 
            icon: 
            <svg xmlns="http://www.w3.org/2000/svg" width="28px" height="28px" viewBox="0 0 24 24" fill="#000000ff">
                <g id="style=fill">
                    <g id="profile">
                        <path id="vector (Stroke)" fillRule="evenodd" clipRule="evenodd" d="M6.75 6.5C6.75 3.6005 9.1005 1.25 12 1.25C14.8995 1.25 17.25 3.6005 17.25 6.5C17.25 9.3995 14.8995 11.75 12 11.75C9.1005 11.75 6.75 9.3995 6.75 6.5Z" fill={location.pathname === '/profile' ? "#000000ff" : "#b6b6b6ff"}/>
                        <path id="rec (Stroke)" fillRule="evenodd" clipRule="evenodd" d="M4.25 18.5714C4.25 15.6325 6.63249 13.25 9.57143 13.25H14.4286C17.3675 13.25 19.75 15.6325 19.75 18.5714C19.75 20.8792 17.8792 22.75 15.5714 22.75H8.42857C6.12081 22.75 4.25 20.8792 4.25 18.5714Z" fill={location.pathname === '/profile' ? "#000000ff" : "#b6b6b6ff"}/>
                    </g>
                </g>
            </svg>
        },
        {
            path: '/home/notifications', 
            label: 'Notifications', 
            notifCount: notifCount > 0 ? notifCount : '',
            action: () => navigate('/home/notifications'),
            icon: 
            <svg xmlns="http://www.w3.org/2000/svg" width="28px" height="28px" viewBox="0 0 24 24" fill="#000000ff">
                <g id="style=fill">
                    <g id="notification-bell">
                        <path id="vector (Stroke)" fillRule="evenodd" clipRule="evenodd" d="M14.802 19.8317C15.4184 19.7699 15.8349 20.4242 15.5437 20.9539C15.3385 21.3271 15.0493 21.6529 14.7029 21.9197C14.3496 22.1918 13.9397 22.4006 13.5 22.5408C13.0601 22.6812 12.593 22.7522 12.1242 22.7522C11.6554 22.7522 11.1883 22.6812 10.7484 22.5408C10.3087 22.4006 9.89883 22.1918 9.54556 21.9197C9.1991 21.6529 8.90988 21.3271 8.70472 20.9539C8.41354 20.4242 8.83002 19.7699 9.44644 19.8317C9.63869 19.851 11.1433 19.9981 12.1242 19.9981C13.1051 19.9981 14.6097 19.851 14.802 19.8317Z" fill={location.pathname === '/home/notifications' ? "#000000ff" : "#b6b6b6ff"}/>
                        <path id="vector (Stroke)_2" fillRule="evenodd" clipRule="evenodd" d="M8.52901 2.08755C10.7932 1.00445 13.4465 0.967602 15.7423 1.98737L15.9475 2.07851C18.3532 3.14707 19.8934 5.4622 19.8934 8.0096L19.8934 9.27297C19.8934 10.2885 20.1236 11.2918 20.5681 12.213L20.8335 12.7632C22.0525 15.29 20.465 18.2435 17.6156 18.7498L17.455 18.7783C13.93 19.4046 10.3154 19.4046 6.79044 18.7783C3.90274 18.2653 2.37502 15.1943 3.77239 12.7115L3.99943 12.3082C4.55987 11.3124 4.85335 10.1981 4.85335 9.06596L4.85335 7.79233C4.85335 5.3744 6.27704 3.16478 8.52901 2.08755Z" fill={location.pathname === '/home/notifications' ? "#000000ff" : "#b6b6b6ff"}/>
                    </g>
                </g>
            </svg> 
        },
        {
            path: '/home/boomark', 
            label: 'Bookmarks', action: ()=> navigatePath('/home/bookmark'), 
            icon: 
            <svg xmlns="http://www.w3.org/2000/svg" width="28px" height="28px" viewBox="0 0 24 24" fill="none">
                <g id="style=fill">
                    <g id="bookmark">
                    <path id="Subtract" fillRule="evenodd" clipRule="evenodd" d="M8 1.25C5.37665 1.25 3.25 3.37665 3.25 6V20.4648C3.25 21.7269 4.27311 22.75 5.53518 22.75C5.98634 22.75 6.42739 22.6165 6.80278 22.3662L11.3066 19.3636C11.7265 19.0837 12.2735 19.0837 12.6934 19.3636L17.1972 22.3662C17.5726 22.6165 18.0137 22.75 18.4648 22.75C19.7269 22.75 20.75 21.7269 20.75 20.4648V6C20.75 3.37665 18.6234 1.25 16 1.25H8ZM9 6.75C8.58579 6.75 8.25 7.08579 8.25 7.5C8.25 7.91421 8.58579 8.25 9 8.25H15C15.4142 8.25 15.75 7.91421 15.75 7.5C15.75 7.08579 15.4142 6.75 15 6.75H9Z" fill={location.pathname === '/home/bookmark' ? "#000000ff" : "#b6b6b6ff"}/>
                    </g>
                </g>
            </svg>
        },
        {
            label: 'Write', action: () => setShowEditor(true), 
            className: 'write-journal-bttn'
        }, // the action function will set the state  to (true)and pass to the HOME.jsx when user clicks the function
    ]

    const gradients = [
        {style: {background: '#2A7B9B', backgroundImage: 'linear-gradient(90deg,rgba(42, 123, 155, 1) 0%, rgba(87, 199, 133, 1) 50%, rgba(237, 221, 83, 1) 100%)'}},
        {style: {background: '#FF7E5F', backgroundImage: 'linear-gradient(90deg, rgba(255,126,95,1) 0%, rgba(254,180,123,1) 50%, rgba(255,236,210,1) 100%)'}},
        {style: {background: '#2193b0', backgroundImage: 'linear-gradient(90deg, rgba(33,147,176,1) 0%, rgba(109,213,237,1) 50%, rgba(255,255,255,1) 100%)'}},
        {style: {background: '#8E2DE2', backgroundImage: 'linear-gradient(90deg, rgba(142,45,226,1) 0%, rgba(74,0,224,1) 50%, rgba(0,212,255,1) 100%)'}},
        {style: {}}
    ]

    const tablists =[
        {label: 'Writings', path: '/profile', action: () => navigate('/profile')},
        {label: 'Media', path: '/profile/media', action: () => navigate('/profile/media')},
    ]

    useEffect(() => {
        // console.log(user)
        if(userData?.background){
            const backgroundImage = userData?.background;
            setCroppedImage(backgroundImage)
            setFontColor(userData?.profile_font_color)
        }
    }, [user, userData])

    // open the richtext editor
    const opendRichTextEditor = () =>{
        setShowRichTextEditor(true)
    }

    // close the richtext editor
    const closeRichTectEditor = () =>{
        setShowRichTextEditor(false)
    }

    // open the sidebar through boolean function
    const handleClickOpenSidebar = () =>{
        setShowMobileSideBar(!showMobileSideBar)
    }

    // close the sidebar through boolean function
    const handleCloseSidebar = () =>{
        setShowMobileSideBar(false)
    }

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
        setProfileEditAvatar(null);
        setShowProfileEditor(false)
        
    }

    const handleCloseRichTextEditor = useCallback(() =>{
        setShowEditor(false);
    }, [])

    const handleImageOnChange = (e) => {
        const file = e.target.files[0];
        setProfileEditAvatar(file)
        if(file){
            setProfileEditAvatar(file)
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
        setCroppedImage(userData?.background)
        setImageSrc(null)
        setGradientPicked(null)
    }
    const handleSaveProfileEdit = async() =>{
        setIsSavingProfile(true)
        const data = {
            name: profileEditName,
            image: profileEditAvatar,
            bio: profileEditBio,
            profileBg: croppedImage,
            dominantColors: dominantColors,
            secondaryColors: secondaryColors,
        }

        try {
            const formdata = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if(value === undefined || value === null){
                    return;
                }
                if(typeof value === "object" && value !== null && !(value instanceof File)) {
                    formdata.append(key, JSON.stringify(value));
                    return
                }

                formdata.append(key, value)
            })

            await updateProfileData(formdata, session?.access_token)
        } catch (error) {
            throw new Error('error saving update')
        } finally {
            setIsSavingProfile(false)
            setProfileEditAvatar(null)
            queryClient.invalidateQueries({queryKey: ['userData']});
            setShowProfileEditor(false)
        } 
    }

    const handleSaveProfileConfig = async() =>{
        
        try {
            setIsUpdatingProfileConfig(true)
            if(imageSrc){
                const croppedImageUrl = await getCroppedImage(imageSrc, croppedAreaPixels, userData.id);
                if(croppedImageUrl){
                    setCroppedImage({backgroundImage: `url(${croppedImageUrl?.url})`, backgroundSize: 'cover', backgroundPosition : 'center', backgroundRepeat: 'no-repeat'});
                }
            } else if(gradientPicked){
                setCroppedImage(gradientPicked)
            }
            
        } catch (error) {
            throw new Error('error updating profile')
        } finally {
            setIsUpdatingProfileConfig(false)
            setGradientPicked(null);
            setImageSrc(null);
            setShowBgPicker(false)
            queryClient.invalidateQueries({queryKey: ['userData']});
        }   
        
    }

    
    const handleRemoveBgPreview = () =>{
        setImageSrc(null);
    }

    const handleSelectGradient = useCallback((gradient) => {
        setCroppedImage(null);
        setImageSrc(null)
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

    const handleClickFontColorSelector = (e) =>{
        e.stopPropagation()
        setShowFontColorSelector(true)
    }

    const handleClickInputColor = () =>{
        if(fontColorInputRef.current){
            fontColorInputRef.current.click();
        }
    }

    const handleClickSaveFontColor = async() => {
        setIsUpdatingFont(true)
        const formdata = new FormData();
        formdata.append('fontColor', fontColor)
        try {
            const updateFont = await updateFontColor(session?.access_token, formdata);
            queryClient.invalidateQueries({queryKey: ['userData']});
        } catch (error) {
            throw new Error('error updating font')
        } finally {
            setIsUpdatingFont(false)
            setShowFontColorSelector(false)
        }          
    }

    const hancleClickCancelFontSelect = () => {
        setShowFontColorSelector(false)
    }
    

    useEffect(() => {
            if(!session && !loading){
                return navigate('/login')
                //check if the user has user metadata on the users table database if not then show a UI that let them input there data and save to database
            }
    
    },[session, loading])
        
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
        {showRichTextEditor && (
            <Editor onClose={closeRichTectEditor}/>
        )}
        
        {showFontColorSelector && (
            <AnimatePresence>
                <motion.div
                className="font-selector-container"
                initial={{scale: 0, opacity: 0.8}}
                animate={{scale: 1, opacity: 1}}
                exit={{scale: 0.8, opacity: 0,}}
                transition={{type: 'spring', stiffness: 250, damping: 25}}
                >
                    <div onClick={() => handleClickInputColor()} style={{background: `${fontColor}`}} className="input-color"></div>
                    <input ref={fontColorInputRef} value={fontColor} onChange={(e) => setFontColor(e.target.value)} style={{display: 'none'}} type="color" />
                    <div className="save-font-color-bttn-container">
                        <div className="cancel-button" onClick={() => hancleClickCancelFontSelect()}>Cancel</div>
                        <div className="save-button" onClick={() => handleClickSaveFontColor()}>Save</div>
                    </div>

                    {isUpdatingFont && (
                        <BarLoader loading={isUpdatingFont} width={'100%'} color="rgb(40, 115, 255)" speedMultiplier={0.7}/>
                    )}
                    
                    
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
                    </div>

                    <div className="profile-bg-preview">
                         <div onClick={(e) => handleInsertBgImage(e)} className="add-bgImage-bttn">
                            <svg xmlns="http://www.w3.org/2000/svg" height="50px" viewBox="0 -960 960 960" width="50px" fill="#000000"><path d="M480-480ZM200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h320v80H200v560h560v-320h80v320q0 33-23.5 56.5T760-120H200Zm40-160h480L570-480 450-320l-90-120-120 160Zm440-320v-80h-80v-80h80v-80h80v80h80v80h-80v80h-80Z"/></svg>
                        </div>
                        {imageSrc && (
                            <>
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={16 / 9}
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
                            <div onClick={() => handleRemoveBgPreview()} className="remove-bg-preview">
                                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z"/></svg>
                            </div>
                            </>  
                        )}
                        
                        
                    </div>

                    <div className="canvel-save-container">
                        <div onClick={(e) => handleHideGradientPicker(e)} className="cancel-button">cancel</div>
                        <div onClick={() => handleSaveProfileConfig()} className="save-button">save</div>
                    </div>

                    {isUpdatingProfileConfig && (
                        <BarLoader loading={isUpdatingProfileConfig} width={'100%'} color="rgb(40, 115, 255)" speedMultiplier={0.7}/>
                    )}
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
                                    <img className="my-profile-image-editable" src={editImagePreview || userData?.image_url || '/assets/profile.jpg'} alt="" />
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

                        <div onClick={() => handleSaveProfileEdit()} className="profile-edit-save-bttn">
                            Save
                        </div>
                        
                        {isSavingProfile && (
                            <BarLoader width={'100%'} loading={isSavingProfile} color="rgb(40, 115, 255)" speedMultiplier={0.7}/>
                        )}
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

                <div style={{color:fontColor || userData?.profile_font_color}} className="profile-center-bar-container">
                    <div style={croppedImage || gradientPicked} className="hero-section">
                         <div className="my-profile-image-container">
                            <img className="my-profile-image" loading="lazy" src={userData?.image_url || '/assets/profile.jpg'} alt="" />

                            <div className="edit-profile-bttn-container">
                                <div onClick={(e) => handleClickEdit(e)} className="edit-profile-bttn">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={fontColor || userData?.profile_font_color}><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h357l-80 80H200v560h560v-278l80-80v358q0 33-23.5 56.5T760-120H200Zm280-360ZM360-360v-170l367-367q12-12 27-18t30-6q16 0 30.5 6t26.5 18l56 57q11 12 17 26.5t6 29.5q0 15-5.5 29.5T897-728L530-360H360Zm481-424-56-56 56 56ZM440-440h56l232-232-28-28-29-28-231 231v57Zm260-260-29-28 29 28 28 28-28-28Z"/></svg>
                                    Edit
                                </div>
                                <div onClick={(e) => handleClickFontColorSelector(e)} className="font-picker-container">
                                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill={fontColor || userData?.profile_font_color}><path d="M80 0v-160h800V0H80Zm140-280 210-560h100l210 560h-96l-50-144H368l-52 144h-96Zm176-224h168l-82-232h-4l-82 232Z"/></svg>
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
                                <p>Following {formatCounts(user?.followingCount)}</p>
                                <p>Followers {formatCounts(user?.followerCount)}</p>
                            </div>
                        </div>
                        
                        <div className="profile-bio-container">
                            <p className="profile-bio">
                                {userData?.bio}
                            </p>
                        </div>

                    </div>


                    <div className="my-profile-tablist">
                        {tablists.map((tab, index) => (
                            <div onClick={() => tab.action()} className={"tab-container"} key={index}>
                                {tab.label}
                                
                                <div className={location.pathname === tab.path ? "tab-indicator" : ''}></div>
                            </div>
                        ))}
                    </div>

                    <Outlet/>
                </div>

                <div className="profile-sidebar-right-holder-container">
                    {/* Log out */}
                </div>

                {/* hide and show sidebar through boolean */}
                {showMobileSideBar && ( 
                    <MobileSidebarLink onclose={handleCloseSidebar}/>
                )}

                <MobileNavlink clickOpenSidebar={handleClickOpenSidebar}/>
                <WriteJournalButton onOpen={opendRichTextEditor}/>
            </div>
        </AnimatePresence>
        </>
    )
}
export default MyProfile;