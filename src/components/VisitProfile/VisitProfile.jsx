import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import './visitprofile.css';
import { useAuth } from '../../Context/Authcontext';
import { getFollowsData, getUserData, getUserJournals } from '../../../API/Api';
import { useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../SideBar/Sidebar';
import { MoonLoader } from 'react-spinners';
import { useFollowMutation } from '../../utils/useMutation';
import debounce from '../../../helpers/debounce';
import formatCounts from '../../../helpers/fomatCounts';
import MobileNavlink from '../mobileNavLink/MobileNavLink';
import MobileSidebarLink from '../MobileSidebarLink/MobileSidebarLink';
import { useState } from 'react';
import WriteJournalButton from '../WriteJournalButton/WriteJournalButton';
import Editor from '../HomePage/Editor/Editor';

const Visitprofile = () =>{
    const location = useLocation();
    const stateData = location.state;
    const {session, user, notifCount} = useAuth();

    const [showSidebar, setShowSidebar]= useState(false)
    const [opendRichTextEditor, setOpenRichTextEditor] = useState(false);

    const buttonRef = useRef();

    const navigate = useNavigate();
    const tablists =[
        {label: 'Writings', path: '/visitProfile', action: () => navigate('/visitProfile', {state: {userId:stateData?.userId}})},
        {label: 'Media', path: '/visitProfile/media', action: () => navigate('/visitProfile/media', {state: {userId:stateData?.userId}})},
    ]

     const navigatePath = (path) => {
        return navigate(path)
    }

    const handleMouseMove = (isFollowing) =>{
        if(buttonRef.current){
            if(isFollowing){
                buttonRef.current.innerText = 'Unfollow'
            } else {
                return
            }
        }
    }

    //open rich text editor
    const handleClickRichtextEditor = () =>{
        setOpenRichTextEditor(true);
    }
    //close rich text editor
    const handleCloseRichtextEditor = () =>{
        setOpenRichTextEditor(false);
    }

    // open sidebar through boolean function
    const openSidebar = () =>{
        setShowSidebar(!showSidebar)
    }

    // close sidebar through boolean function
    const closeSidebar = () =>{
        setShowSidebar(false)
    }

    const handleMouseLeave = (isFollowing) =>{
        if(buttonRef.current){
            if(isFollowing){
                buttonRef.current.innerText = 'Following'
            } else {
                return
            }
        }
    }

    const mutationFollow = useFollowMutation();
    const hadnleClickFollow = (e, followingId, followerId,) =>{
        mutationFollow.mutate({followingId, followerId})
    }
    const debounceClickFollow = debounce(hadnleClickFollow, 0)

    const links = [
        {
            path: '/home', 
            label: 'Home', 
            action: ()=> navigatePath('/home'), 
            icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000ff"><path d="M240-200h120v-240h240v240h120v-360L480-740 240-560v360Zm-80 80v-480l320-240 320 240v480H520v-240h-80v240H160Zm320-350Z"/></svg>},
        {
            path: '/home/notifications', 
            label: 'Notifications', 
            notifCount: notifCount > 0 ? notifCount : '',
            icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000"><path d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z"/></svg>
        },
        {
            path: '/profile', 
            label: 'Profile', action: ()=> navigatePath('/profile'), 
            icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000ff"><path d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q53 0 100-15.5t86-44.5q-39-29-86-44.5T480-280q-53 0-100 15.5T294-220q39 29 86 44.5T480-160Zm0-360q26 0 43-17t17-43q0-26-17-43t-43-17q-26 0-43 17t-17 43q0 26 17 43t43 17Zm0-60Zm0 360Z"/></svg>
        },
        {
            path: '/home/boomark', label: 'Bookmarks', action: ()=> navigatePath('/home/bookmark'), 
            icon: <svg xmlns="http://www.w3.org/2000/svg" height="34px" viewBox="0 -960 960 960" width="34px" fill="#000000ff"><path d="M200-120v-640q0-33 23.5-56.5T280-840h400q33 0 56.5 23.5T760-760v640L480-240 200-120Zm80-122 200-86 200 86v-518H280v518Zm0-518h400-400Z"/></svg>
        },
        {
            label: 'Write', 
            action: () => setShowEditor(true), 
            className: 'write-journal-bttn'
        }, // the action function will set the state  to (true)and pass to the HOME.jsx when user clicks the function
    ]

    
    const {data, isLoading} = useQuery({
        queryKey: ['visitedProfile', stateData?.userId],
        queryFn:({queryKey}) => getUserData(queryKey[1]),
        enabled: !!stateData?.userId,
        refetchOnWindowFocus: false
    })

    const userData = data?.userData?.[0]

    const{data: followsData, isLoading: isLoadingFollowsData} = useQuery({
        queryKey: ['followsData',user?.userData?.[0].id, stateData?.userId ],
        queryFn: ({queryKey}) => getFollowsData(queryKey[1], queryKey[2]),
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60,
        enabled: !!user?.userData?.[0].id && !!stateData?.userId,
        refetchOnWindowFocus: false
    })


    // useEffect(() =>{
    //     console.log(followsData)
    // }, [followsData])

    
    if(isLoading){
        return(
            
            <div className='profile-loading-container'>
                <MoonLoader loading={isLoading} size={25}/>
            </div>
        )
    }
    return(
        <>{opendRichTextEditor &&(
            <Editor onClose={handleCloseRichtextEditor}/>
        )}
        
        <div className='profile-parent-container'>
            {userData?.background && (
                <div className="blurred-img-bg" style={userData?.background}/>
            )}

            <div className="side-bar-holder-container">
                <Sidebar links={links}/> {/*passing the setShowEditor to this component to be used as a state setter inside this component*/}
            </div>

            <div style={{color: userData?.profile_font_color}} className="profile-center-bar-container">
                {userData && (
            
                    <div style={userData?.background} className='visit-profile-hero-section'>
                        <div className='visited-profile-image-container'>
                            <img className='visited-profile-image' src={userData?.image_url || '../../src/assets/profile.jpg'} alt="" />

                            <div onMouseMove={() => handleMouseMove(followsData?.isFollowing)} onMouseLeave={() => handleMouseLeave(followsData?.isFollowing)} className='visited-profile-follow-button-container'>
                                <button onClick={(e) => debounceClickFollow(e, stateData?.userId, user?.userData?.[0].id)} ref={buttonRef} className={followsData?.isFollowing ? 'unfollow-visited-profile-bttn' : 'follow-visited-profile-bttn'}>
                                    {followsData?.isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </div>
                        </div>

                        <div className='visited-profile-name-container'>
                            <p className='visited-profile-name'>{userData?.name}</p>
                        </div>
                        <div className='visited-profile-metadata-container'>
                            <p className='visited-profile-date-joined'>{new Date(userData?.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: '2-digit',
                                year: 'numeric'
                            })}</p>
                            <div className='visited-profile-follows-container'>
                                <p style={{padding: 0, margin: 0}}>Followers {formatCounts(followsData?.followersCount)}</p>
                                <p style={{padding: 0, margin: 0}}>Following {formatCounts(followsData?.followingsCount)}</p>
                            </div>
                        </div>
            
                        <div className='visited-profile-bio-container'>
                            <p style={{margin: 0, padding: 0}}>{userData?.bio}</p>
                        </div>
                    </div>
                    
                    )      
                }

                <div className='my-profile-tablist'>
                    {tablists.map((tab, index) => (
                         <div key={index} onClick={() => tab.action()} className='tab-container'>
                            {tab.label}
                            <div className={location.pathname === tab.path ? 'tab-indicator' : ''}/>
                        </div>
                    ))}
                   
                </div>

                <Outlet/>

            </div>

            {showSidebar && (
                <MobileSidebarLink onclose={closeSidebar}/>
            )}
            
            {<MobileNavlink clickOpenSidebar={openSidebar}/>}
            <WriteJournalButton onOpen={handleClickRichtextEditor}/>
        </div>
        </>
        
    )
}
export default Visitprofile;