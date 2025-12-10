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

    const handleClickCards = (e, collectionId) =>{
        e.stopPropagation();
        // setCollectionId(collectionId)
        // setOpenCollections(true)
        navigate(
            '/home/collectionCards',{
                state: {
                    collectionId: collectionId
                }
            }
        )

    }

    useEffect(() =>{
        console.log(data)
    }, [data])

    useEffect(()=> {
        if(!isFetchingNextPage && hasNextPage && inView){
            fetchNextPage();
        }
    }, [hasNextPage, isFetchingNextPage, fetchNextPage, inView])

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
                    <div onClick={(e) => handleClickCards(e, collection?.id)} key={collection?.id} className='collection-cards'>
                        <div className='collection-illustration'>
                            <img className='collection-illustraion-img' src="../../assets/collections-illustration.jpeg" alt="" />
                        </div>
                        <div className='collection-name-container'>
                            {collection?.name.length > 10 ? `${collection?.name.substring(0, 9)}...` : collection?.name}
                            <div className='collection-date-created'>
                                {formatPostDate(collection?.created_at)}
                            </div>
                        </div>
                        

                        <div className='collection-card-description'>
                            {collection?.description.length > 65 ? `${collection?.description.substring(0, 64)}...` : collection?.description}
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