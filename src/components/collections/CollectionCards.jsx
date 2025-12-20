import ParseContent from '../HomePage/postCards/parseData';
import { getCollections } from '../../../API/Api';
import { useAuth } from '../../Context/useAuth';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { MoonLoader } from 'react-spinners';
import formatPostDate from '../../../helpers/formatDateString';
import { useNavigate } from 'react-router-dom';

const CollectionCards = () =>{
    const {user, session} = useAuth();
    const {ref, inView} = useInView({threshold: 0.2})
    
    const [settingId, setSettingId] = useState('');

    const navigate = useNavigate();

    const {
        data,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        isLoading
    } = useInfiniteQuery({
        queryKey: ['getCollections', user?.userData?.[0].id],
        queryFn: ({pageParam, queryKey}) => getCollections(queryKey[1], pageParam, 5),
        getNextPageParam: (lastPage) => {
            if(lastPage?.hasMore){
                const lastJournal = lastPage.data[lastPage?.data?.length - 1];
                return new Date(lastJournal?.created_at).toISOString();
            } else{
                return undefined;
            }
        },
        enabled: !!user?.userData?.[0].id,
        refetchOnWindowFocus: false
    })

    const handleClickCards = (e, collectionId, collectionName, collectionDescription) =>{
        e.stopPropagation();
        // setCollectionId(collectionId)
        // setOpenCollections(true)
        navigate(
            '/home/collectionCards',{
                state: {
                    collectionId: collectionId,
                    collectionName: collectionName,
                    collectionDescription:collectionDescription
                }
            }
        )

    }

    const handleClickSettings = (e, collectionId) =>{
        e.stopPropagation();
        console.log(collectionId)
        setSettingId(settingId === collectionId ? '' : collectionId);
    }
    const handleDeleteCollection = (e, collectionId) =>{
        e.stopPropagation();
        console.log(collectionId);
    }

    useEffect(() =>{
        console.log(data)
    }, [data])

    useEffect(()=> {
        if(!isFetchingNextPage && hasNextPage && inView){
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, inView])

    useEffect(() =>{
        const handleClickOutside = (e) =>{
            if(settingId !== null && !e.target.closest('collection-card-container')){
                setSettingId('')
            }
        }

        document.addEventListener('click', handleClickOutside);

        return() => {
            document.removeEventListener('click', handleClickOutside);
        }
    }, [])

    const collections = data?.pages?.flatMap((page) => page.data) || [];

    if(isLoading){
        return(
            <div className='collection-cards-loading-container'>
                <MoonLoader loading={isLoading} size={25}/>
            </div>
            
        )
    }

    return(
        <>
        <div className="collection-cards-container">

            {collections?.map((collection) => {
                return(
                    <div key={collection?.id} className='collection-cards'>
                        <div onClick={(e) => handleClickSettings(e, collection?.id)} className='setting-bttn'>

                            {settingId === collection.id && (
                                <div onClick={(e) => handleDeleteCollection(e, collection?.id)} className='collection-card-container'>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 24 24" fill="none">
                                        <path d="M10 12V17" stroke="rgba(0, 0, 0, 1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M14 12V17" stroke="rgba(0, 0, 0, 1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M4 7H20" stroke="rgba(0, 0, 0, 1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M6 10V18C6 19.6569 7.34315 21 9 21H15C16.6569 21 18 19.6569 18 18V10" stroke="rgba(0, 0, 0, 1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="rgba(0, 0, 0, 1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                    Delete
                                </div>
                            )}
                            
                            <svg xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" width="20px" height="20px" viewBox="0 0 24 24" version="1.1">
                                <title>more_1_fill</title>
                                    <g id="页面-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                                        <g id="System" transform="translate(-96.000000, -336.000000)" fillRule="nonzero">
                                            <g id="more_1_fill" transform="translate(96.000000, 336.000000)">
                                                <path d="M24,0 L24,24 L0,24 L0,0 L24,0 Z M12.5934901,23.257841 L12.5819402,23.2595131 L12.5108777,23.2950439 L12.4918791,23.2987469 L12.4918791,23.2987469 L12.4767152,23.2950439 L12.4056548,23.2595131 C12.3958229,23.2563662 12.3870493,23.2590235 12.3821421,23.2649074 L12.3780323,23.275831 L12.360941,23.7031097 L12.3658947,23.7234994 L12.3769048,23.7357139 L12.4804777,23.8096931 L12.4953491,23.8136134 L12.4953491,23.8136134 L12.5071152,23.8096931 L12.6106902,23.7357139 L12.6232938,23.7196733 L12.6232938,23.7196733 L12.6266527,23.7031097 L12.609561,23.275831 C12.6075724,23.2657013 12.6010112,23.2592993 12.5934901,23.257841 L12.5934901,23.257841 Z M12.8583906,23.1452862 L12.8445485,23.1473072 L12.6598443,23.2396597 L12.6498822,23.2499052 L12.6498822,23.2499052 L12.6471943,23.2611114 L12.6650943,23.6906389 L12.6699349,23.7034178 L12.6699349,23.7034178 L12.678386,23.7104931 L12.8793402,23.8032389 C12.8914285,23.8068999 12.9022333,23.8029875 12.9078286,23.7952264 L12.9118235,23.7811639 L12.8776777,23.1665331 C12.8752882,23.1545897 12.8674102,23.1470016 12.8583906,23.1452862 L12.8583906,23.1452862 Z M12.1430473,23.1473072 C12.1332178,23.1423925 12.1221763,23.1452606 12.1156365,23.1525954 L12.1099173,23.1665331 L12.0757714,23.7811639 C12.0751323,23.7926639 12.0828099,23.8018602 12.0926481,23.8045676 L12.108256,23.8032389 L12.3092106,23.7104931 L12.3186497,23.7024347 L12.3186497,23.7024347 L12.3225043,23.6906389 L12.340401,23.2611114 L12.337245,23.2485176 L12.337245,23.2485176 L12.3277531,23.2396597 L12.1430473,23.1473072 Z" id="MingCute" fillRule="nonzero">

                                                </path>
                                                <path d="M5,10 C6.10457,10 7,10.8954 7,12 C7,13.1046 6.10457,14 5,14 C3.89543,14 3,13.1046 3,12 C3,10.8954 3.89543,10 5,10 Z M12,10 C13.1046,10 14,10.8954 14,12 C14,13.1046 13.1046,14 12,14 C10.8954,14 10,13.1046 10,12 C10,10.8954 10.8954,10 12,10 Z M19,10 C20.1046,10 21,10.8954 21,12 C21,13.1046 20.1046,14 19,14 C17.8954,14 17,13.1046 17,12 C17,10.8954 17.8954,10 19,10 Z" id="形状" fill="#404b5bff">

                                                </path>
                                            </g>
                                        </g>
                                    </g>
                        </svg>
                        </div>
                        <div onClick={(e) => handleClickCards(e, collection?.id, collection?.name, collection?.description)} className='collection-illustration'>
                            <img className='collection-illustraion-img' src="../../assets/collection-banner.png" alt="" />
                        </div>
                        <div onClick={(e) => handleClickCards(e, collection?.id, collection?.name, collection?.description)} className='collection-name-container'>
                            {collection?.name.length > 20 ? `${collection?.name.substring(0, 19)}...` : collection?.name}
                        </div>
                        

                        <div className='collection-date-created'>
                            Created {formatPostDate(collection?.created_at)}
                        </div>
       
                    </div>
                )          
            })}
        <div ref={ref} className='collection-cards-inview-container'>
            {isFetchingNextPage && (
                <MoonLoader loading={isFetchingNextPage} size={15}/>
            )}
        </div>
    
        </div>
        
        </>
    )
}

export default CollectionCards;