import { useInfiniteQuery } from '@tanstack/react-query';
import './sidebarOpinions.css'
import { useEffect } from 'react';
import { getOpinions } from '../../../API/Api';
import { useNavigate } from 'react-router-dom';
import { handleClickProfile } from '../../../helpers/handleClicks';
import { useAuth } from '../../Context/useAuth';
import { BarLoader, MoonLoader } from 'react-spinners';

const SidebarOpinions = ({openEditor}) =>{
    const {user} = useAuth();

    const handleOpenEditor = () =>{
        openEditor();
    }
    const navigate = useNavigate();

    const handleClickOpionionsProfile = handleClickProfile(navigate);

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
        refetchOnMount: true
    });

    const handleClickSeeMore = () =>{
        if(!isLoading && !isFetchingNextPage){
            fetchNextPage();;
        }
        
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
                        <div key={opinionsData.id} className='sidebar-opinions-cards'>
                            <div className='sidebar-opinions-user-metadata-container'>
                                <div className='sidebar-opinions-profile-container'>
                                    <img onClick={(e) => handleClickOpionionsProfile(e, user?.userData[0].id, opinionsData.user_id)} className='sidebar-opinions-profile' src={opinionsData.users.image_url || "../../assets/profile.jpg"} alt="opinions-profile" />
                                    <p onClick={(e) => handleClickOpionionsProfile(e, user?.userData[0].id, opinionsData.user_id)} className='opinions-username'>{opinionsData.users.name}</p>
                                    <div className="name-info-separator">
                                        •
                                    </div>
                                    <p className='opinions-user-email'>{opinionsData.users.user_email}</p>
                                </div>

                            </div>
                            <div className='opinions-content'>
                                {opinionsData.opinion}
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