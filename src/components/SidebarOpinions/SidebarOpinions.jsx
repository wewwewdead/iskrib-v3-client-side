import { useInfiniteQuery } from '@tanstack/react-query';
import './sidebarOpinions.css'
import { useEffect } from 'react';
import { getOpinions } from '../../../API/Api';
import { useNavigate } from 'react-router-dom';
import { handleClickProfile } from '../../../helpers/handleClicks';
import { useAuth } from '../../Context/useAuth';
import { BarLoader, MoonLoader } from 'react-spinners';

const SidebarOpinions = ({openEditor}) =>{
    const {user, session, openAuthModal} = useAuth();

    const handleOpenEditor = () =>{
        if(!session) return openAuthModal();
        openEditor();
    }
    const navigate = useNavigate();

    const handleClickOpionionsProfileOriginal = handleClickProfile(navigate);
    const handleClickOpionionsProfile = (e, loggedInUserId, clickedUserId) => {
        if(!session){
            e.stopPropagation();
            return openAuthModal();
        }
        handleClickOpionionsProfileOriginal(e, loggedInUserId, clickedUserId);
    };

    const {data, isLoading, fetchNextPage, isFetchingNextPage, hasNextPage} = useInfiniteQuery({
        queryKey: ['getOpinions'],
        queryFn: ({pageParam = null}) => getOpinions(pageParam, 5),
        getNextPageParam: (lastPage) =>{
            if(lastPage?.hasMore){
                const lastOpinion = lastPage?.data[lastPage?.data?.length - 1];
                return lastOpinion.id;
            } else {
                return undefined
            }
        },
        refetchOnWindowFocus: false,
    });

    const handleClickSeeMore = () =>{
        if(!isLoading && !isFetchingNextPage){
            fetchNextPage();;
        }
        
    }

    const handleClickContent = (e, opinionId, userId) =>{
        e.stopPropagation();
        if(!session) return openAuthModal();
        navigate('/home/opinionsViewer', {
            state: {
                opinionId: opinionId,
                userId: userId
            }
        })
    }

    // useEffect(() => {
    //     console.log(data)
    // }, [data])

    const opinions = data?.pages.flatMap((page) => page.data) || [];

    useEffect(() => {
        console.log(opinions)
    }, [opinions])
    
    if(opinions.length === 0){
        return(
            <div className='side-bar-opinions-parent-container'>
                <div className='signal-container'>
                    <p className='signal-header'>“Share what you believe. This is a free-speech space.”</p>
                    <button onClick={() => handleOpenEditor()} className='write-opinions-bttn'>
                        Write opinions
                    </button>
                </div>
                <div className='latest-opinions-container'>
                    <div className='latest-opinions-header'>
                        Latest opinions
                    </div>
                    <div className='sidebar-opinions-cards-container'>
                        No opinions availabe
                    </div>
                </div>
            </div>
        )
    }
    if(isLoading){
        return(
            <div className='side-bar-opinions-parent-container'>
                <div className='opinions-loading-container'>
                    <MoonLoader size={25} speedMultiplier={1} loading={isLoading}/>
                </div>
            </div>
        )
    }
    return(
        <>
        <div className="side-bar-opinions-parent-container">
            <div className='signal-container'>
                <p className='signal-header'>“Share what you believe. This is a free-speech space.”</p>
                <button onClick={() => handleOpenEditor()} className='write-opinions-bttn'>
                    Write opinions
                </button>
            </div>

            <div className='latest-opinions-container'>
                <div className='latest-opinions-header'>
                    Latest opinions
                </div>
                <div className='sidebar-opinions-cards-container'>
                    {opinions.map((opinionsData) => (
                        <div key={opinionsData.id} className={'sidebar-opinions-cards'}>
                            <div className='sidebar-opinions-user-metadata-container'>
                                <div className='opinions-content-parent-container'>
                                    
                                    <div className='opinions-content'>
                                        <p onClick={(e) => handleClickContent(e, opinionsData.id, opinionsData.user_id)}>{opinionsData.opinion}</p>
                                    <div onClick={() => { if(!session) return openAuthModal(); console.log('reply'); }} className="sidebaropinion-reply-button">
                                        reply
                                        <svg style={{fill: 'rgb(80, 80, 80)', stroke: 'rgb(80, 80, 80)', strokeWidth:'5.000000e-02', strokeMiterlimit: '5'}} xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="18px" height="18px" viewBox="0 0 24 24" version="1.1" xmlSpace="preserve">

                                            <g id="grid_system"/>
                                                <g id="_icons">
                                                <path d="M22,13.5c0-2.3-1.8-4.2-4-4.5c-0.2-2.8-2.6-5-5.4-5H7.5C6,4,4.6,4.6,3.6,5.6C2.6,6.6,2,8,2,9.5c0,1.2,0.4,2.3,1,3.2l-1,3   c-0.1,0.4,0,0.8,0.3,1.1C2.5,16.9,2.8,17,3,17c0.2,0,0.3,0,0.4-0.1l4-2c0,0,0,0,0,0h1.8c0.2,0.5,0.4,1,0.7,1.4   c0.9,1.1,2.1,1.7,3.5,1.7h2.3l3.8,1.9C19.7,20,19.8,20,20,20c0.2,0,0.5-0.1,0.7-0.2c0.3-0.3,0.4-0.7,0.3-1.1L20.4,17   c0.1-0.1,0.2-0.2,0.3-0.3C21.5,15.8,22,14.7,22,13.5z M7.3,12.9c-0.2,0-0.4,0-0.6,0.1l-2.1,1l0.4-1.3c0.1-0.3,0-0.7-0.2-1   C4.3,11.1,4,10.3,4,9.5C4,8.5,4.4,7.7,5,7c0.7-0.7,1.5-1,2.4-1h5.1c1.8,0,3.2,1.3,3.4,3h-2.5c-1.2,0-2.3,0.5-3.2,1.3   c-0.7,0.7-1.1,1.5-1.3,2.4c0,0.1,0,0.1,0,0.2H7.5C7.4,12.9,7.4,12.9,7.3,12.9z M19.3,15.3c-0.2,0.2-0.4,0.3-0.6,0.4   c-0.4,0.2-0.6,0.7-0.5,1.2l0.1,0.2l-1.8-0.9C16.3,16,16.2,16,16,16h-2.5c-0.8,0-1.5-0.3-2-1c-0.3-0.4-0.5-0.8-0.5-1.2   c0-0.1,0-0.2,0-0.3c0-0.1,0-0.3,0-0.4c0.1-0.5,0.3-1,0.7-1.3c0.5-0.5,1.1-0.7,1.8-0.7H17h0.5c1.4,0,2.5,1.1,2.5,2.5   C20,14.2,19.7,14.8,19.3,15.3z"/>
                                            </g>
                                        </svg>
                                    </div>
                                    
                                </div>
                                </div>
                                <div className='sidebar-opinions-profile-container'>
                                    <img onClick={(e) => handleClickOpionionsProfile(e, user?.userData[0].id, opinionsData.user_id)} className='sidebar-opinions-profile' src={opinionsData.users.image_url || "../../assets/profile.jpg"} alt="opinions-profile" />
                                    <p onClick={(e) => handleClickOpionionsProfile(e, user?.userData[0].id, opinionsData.user_id)} className='opinions-username'>{opinionsData.users.name}</p>
                                </div>

                            </div>
                            
                        </div>
                    ))}
                    {hasNextPage && (
                        <div onClick={() => handleClickSeeMore()} className='see-fullpage-bttn'>
                            See more
                        </div>
                    )}
                    
                </div>
            </div>
        </div>
        </>
    )
}
export default SidebarOpinions;