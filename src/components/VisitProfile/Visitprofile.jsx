import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import '../ProfilePage/myprofile.css';
import './visitProfile.css';
import { useAuth } from '../../Context/useAuth';
import { getFollowsData, getUserData, getUserJournals, getUserByUsername, recordProfileVisit } from '../../../API/Api';
import { Fragment, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import Sidebar from '../SideBar/Sidebar';
import { MoonLoader } from 'react-spinners';
import { useFollowMutation } from '../../utils/useMutation';
import debounce from '../../../helpers/debounce';
import VerifiedBadge from '../Badge/VerifiedBadge';
import formatCounts from '../../../helpers/fomatCounts';
import MobileNavlink from '../mobileNavLink/MobileNavLink';
import MobileSidebarLink from '../MobileSidebarLink/MobileSidebarLink';
import { useState } from 'react';
import WriteJournalButton from '../WriteJournalButton/WriteJournalButton';
import Editor from '../HomePage/Editor/Editor';
import Loader from '../loadingComponent/BgLoader';
import useProfileSeo from '../../seo/useProfileSeo';
import { createProfileSidebarLinks } from '../ProfilePage/constants/profileSidebarLinks';
import ShareMenu from '../ShareMenu/ShareMenu';
import { getProfileShareUrl } from '../../utils/getShareUrl';
import StreakBadge from '../Streak/StreakBadge';
import useStreakData from '../Streak/useStreakData';
import StickerLayer from '../ProfilePage/builder/StickerLayer';
import { profileThemeToCssVars, isSectionVisible, composeProfileBackgroundStyle, resolveLegacyBackgroundForMotion } from '../ProfilePage/builder/profileThemeUtils';
import { getDefaultProfileTheme } from '../ProfilePage/builder/profileThemeDefaults';
import usePrefersReducedMotion from '../../hooks/usePrefersReducedMotion';
import '../ProfilePage/builder/profileTheme.css';
import ProfileGuestbook from '../ProfilePage/guestbook/ProfileGuestbook';
import ProfileLayoutRenderer from '../ProfilePage/layout/ProfileLayoutRenderer';
import FreeHero from '../ProfilePage/layout/FreeHero';
import UseThemeButton from '../ProfilePage/builder/UseThemeButton';
import SectionErrorBoundary from '../ErrorBoundary/SectionErrorBoundary';

// Maps tab labels to their theme section id so hidden sections drop their tab.
const TAB_SECTION_ID = {
    Writings: 'writings',
    Media: 'media',
    Opinions: 'opinions',
    Stories: 'stories',
};

const Visitprofile = () =>{
    const location = useLocation();
    const stateData = location.state;
    const { username: urlUsername } = useParams();
    const queryUserId = new URLSearchParams(location.search).get('userId');
    const isUsernameRoute = !!urlUsername;

    // Fetch user by username if on /@username route
    const { data: usernameData, isLoading: isLoadingByUsername } = useQuery({
        queryKey: ['userByUsername', urlUsername],
        queryFn: () => getUserByUsername(urlUsername),
        enabled: isUsernameRoute,
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: false,
    });

    // Resolve visitedUserId from either username lookup, state, or query param
    const visitedUserId = isUsernameRoute
        ? usernameData?.userData?.[0]?.id
        : (stateData?.userId || queryUserId);

    const resolvedUsername = isUsernameRoute
        ? urlUsername
        : usernameData?.userData?.[0]?.username;

    const {session, user, notifCount, openAuthModal} = useAuth();

    const [showSidebar, setShowSidebar]= useState(false)
    const [opendRichTextEditor, setOpenRichTextEditor] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);

    const { data: visitedStreakData } = useStreakData(visitedUserId);
    const buttonRef = useRef();

    const navigate = useNavigate();
    const visitedProfileNavState = { userId: visitedUserId };

    // Canonical username is the source of truth. Tabs always build /u/:username.
    const profileUsername = resolvedUsername || usernameData?.userData?.[0]?.username;
    const tablists = [
        {label: 'Writings', path: `/u/${profileUsername}`, action: () => navigate(`/u/${profileUsername}`, {state: visitedProfileNavState})},
        {label: 'Media', path: `/u/${profileUsername}/media`, action: () => navigate(`/u/${profileUsername}/media`, {state: visitedProfileNavState})},
        {label: 'Opinions', path: `/u/${profileUsername}/opinions`, action: () => navigate(`/u/${profileUsername}/opinions`, {state: visitedProfileNavState})},
        {label: 'Stories', path: `/u/${profileUsername}/stories`, action: () => navigate(`/u/${profileUsername}/stories`, {state: visitedProfileNavState})}
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

    //open rich text editor (requires auth)
    const handleClickRichtextEditor = () =>{
        if(!session){
            openAuthModal?.();
            return;
        }
        setOpenRichTextEditor(true);
    }
    //close rich text editor
    const handleCloseRichtextEditor = () =>{
        setOpenRichTextEditor(false);
    }

    // open sidebar through boolean function
    const openSidebar = () =>{
        setShowSidebar(true)
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

    const mutationFollow = useFollowMutation(session, visitedUserId);
    const hadnleClickFollow = (e, followingId, followerId,) =>{
        mutationFollow.mutate({followingId, followerId})
    }
    const debounceClickFollow = debounce(hadnleClickFollow, 0)

    const links = createProfileSidebarLinks({
        location,
        navigatePath,
        navigate,
        notifCount,
        setShowEditor: setOpenRichTextEditor,
    });

    
    const {data, isLoading} = useQuery({
        queryKey: ['visitedProfile', visitedUserId],
        queryFn:({queryKey}) => getUserData(queryKey[1]),
        enabled: !!visitedUserId && !isUsernameRoute,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 10
    })

    // Use username-fetched data when on /@username route, otherwise use userId-fetched data
    const userData = isUsernameRoute
        ? usernameData?.userData?.[0]
        : data?.userData?.[0]

    useProfileSeo(userData, profileUsername);
    const getProfileSectionSize = () => 'md';

    // ── Profile Builder theme ──
    // hasTheme = did this user actually customize (drives "Use this theme").
    // Every visited profile renders the modern layout though, falling back to a
    // default theme so an un-customized user looks the same as a themed one.
    const rawProfileTheme = userData?.profile_theme || null;
    const hasTheme = !!rawProfileTheme;
    const profileTheme = rawProfileTheme || getDefaultProfileTheme(userData);
    const themeVars = profileThemeToCssVars(profileTheme, userData);
    const prefersReducedMotion = usePrefersReducedMotion();
    const resolvedBackground = resolveLegacyBackgroundForMotion(userData?.background, prefersReducedMotion);

    const visibleProfileSections = [{ id: 'stats' }, { id: 'bio' }, { id: 'joined_date' }].filter(
        (section) => !hasTheme || isSectionVisible(profileTheme, section.id)
    );

    const visibleTablists = hasTheme
        ? tablists.filter((tab) => {
              const sectionId = TAB_SECTION_ID[tab.label];
              return !sectionId || isSectionVisible(profileTheme, sectionId);
          })
        : tablists;

    const requireLoginThen = (action) => {
        if (!session) {
            openAuthModal?.();
            return;
        }
        action();
    };

    // "Use this theme" eligibility: logged in, not the owner, source has a theme.
    const currentUserId = user?.userData?.[0]?.id;
    const isOwnProfile = !!currentUserId && currentUserId === visitedUserId;
    const canUseTheme = !!session && !isOwnProfile && hasTheme;
    const guestbookUsername = profileUsername || userData?.username;

    // Record a (throttled) profile visit once per loaded profile. Works logged-out.
    const visitRecordedRef = useRef(null);
    useEffect(() => {
        if (!guestbookUsername) return;
        if (visitRecordedRef.current === guestbookUsername) return;
        visitRecordedRef.current = guestbookUsername;
        recordProfileVisit(session?.access_token, guestbookUsername).catch(() => {});
    }, [guestbookUsername, session?.access_token]);

    const{data: followsData, isLoading: isLoadingFollowsData} = useQuery({
        queryKey: ['followsData', user?.userData?.[0].id, visitedUserId],
        queryFn: ({queryKey}) => getFollowsData(session?.access_token, queryKey[2]),
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60,
        enabled: !!user?.userData?.[0].id && !!visitedUserId,
        refetchOnWindowFocus: false
    })


    useEffect(() =>{
        // console.log(data)
    }, [data])

    // Public profiles are viewable without logging in. Anonymous visitors can
    // browse freely; actions like Follow/Write open the auth modal on demand.

    if(isLoading || isLoadingByUsername){
        return(
            <Loader/>
        )
    }
    return(
        <>{opendRichTextEditor &&(
            <Editor onClose={handleCloseRichtextEditor}/>
        )}
        
        <div className='profile-parent-container'>
            {userData?.background && (
                <div className="blurred-img-bg" style={resolvedBackground}/>
            )}

            <div className="side-bar-holder-container">
                <Sidebar links={links}/> {/*passing the setShowEditor to this component to be used as a state setter inside this component*/}
            </div>

            <div
                style={{ ...themeVars, ...(composeProfileBackgroundStyle(profileTheme, resolvedBackground) || {}) }}
                className="profile-center-bar-container pt-scope"
            >
                {userData && (

                    <div className="visit-profile-hero-section visit-profile-hero-section--stack">

                        <div className="pt-freehero-mount">
                            {profileTheme?.stickers?.length > 0 && (
                                <StickerLayer stickers={profileTheme.stickers} accentColor={profileTheme?.colors?.accent} />
                            )}
                            <FreeHero
                                hero={profileTheme?.hero}
                                name={userData?.name}
                                username={profileUsername || userData?.username}
                                bio={userData?.bio}
                                avatarUrl={userData?.image_url}
                                badge={userData?.badge}
                                streak={visitedStreakData?.current_streak}
                                followers={followsData?.followersCount}
                                following={followsData?.followingsCount}
                                showStats={isSectionVisible(profileTheme, 'stats')}
                                showBio={isSectionVisible(profileTheme, 'bio')}
                            />
                        </div>

                        <div className='visited-profile-actions-row'>
                            <div onMouseMove={() => handleMouseMove(followsData?.isFollowing)} onMouseLeave={() => handleMouseLeave(followsData?.isFollowing)} className='visited-profile-follow-button-container'>
                                <button onClick={(e) => requireLoginThen(() => debounceClickFollow(e, visitedUserId, user?.userData?.[0].id))} ref={buttonRef} className={followsData?.isFollowing ? 'unfollow-visited-profile-bttn' : 'follow-visited-profile-bttn'}>
                                    {followsData?.isFollowing ? 'Following' : 'Follow'}
                                </button>
                            </div>
                            {canUseTheme && guestbookUsername && (
                                <UseThemeButton sourceUsername={guestbookUsername} iconColor={userData?.profile_font_color} />
                            )}
                            {(profileUsername || userData?.username) && (
                                <div className="visit-profile-share-btn" style={{ position: 'relative' }} onClick={(e) => { e.stopPropagation(); setShowShareMenu((v) => !v); }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 0 24 24" width="18px" fill="currentColor">
                                        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                                    </svg>
                                    {showShareMenu && (
                                        <ShareMenu
                                            url={getProfileShareUrl(profileUsername || userData.username)}
                                            title={`${userData.name || profileUsername || userData.username}'s Profile`}
                                            onClose={() => setShowShareMenu(false)}
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                    </div>

                    )
                }

                {/* Profile Builder V3A — Layout Composer. Themed profiles render
                    their configured layout (guestbook + content previews) in order;
                    un-themed profiles keep the legacy standalone guestbook. */}
                {guestbookUsername && (
                    <ProfileLayoutRenderer
                        theme={profileTheme}
                        username={guestbookUsername}
                        profileUserId={visitedUserId}
                        navigate={navigate}
                    />
                )}

                <div className='my-profile-tablist'>
                    {visibleTablists.map((tab, index) => (
                         <div key={index} onClick={() => tab.action()} className='tab-container'>
                            {tab.label}
                            <div className={location.pathname === tab.path ? 'tab-indicator' : ''}/>
                        </div>
                    ))}
                   
                </div>

                <SectionErrorBoundary resetKey={location.pathname} label="This section couldn't load">
                    <Outlet context={{ visitedUserId }}/>
                </SectionErrorBoundary>

            </div>

            <div className="profile-sidebar-right-holder-container" />

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
