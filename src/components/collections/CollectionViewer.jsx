import { useInfiniteQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import { getCollections } from "../../../API/Api";
import { MoonLoader } from "react-spinners";
import formatPostDate from "../../../helpers/formatDateString";
import { useInView } from "react-intersection-observer";
import ViewUserCollection from "./ViewUserCollections";

const CollectionViewer = () =>{
    const location = useLocation();
    const userId = location.state.userId;
    const navigate = useNavigate();

    const {ref, inView} = useInView({
        threshold: 0,
    })

    // useEffect(() =>{
    //     console.log(userId)
    // }, [userId])

    const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ['visitedProfileCollections', userId],
        queryFn: ({queryKey, pageParam = null}) => getCollections(queryKey[1], pageParam, 5),
        getNextPageParam: (lastPage) =>{
            if(lastPage?.hasMore){
                const lastJournal = lastPage?.data[lastPage?.data?.length - 1]
                return new Date(lastJournal?.created_at).toISOString() ;
            } else {
                return undefined;
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false
    })

    const handleClickCards = (e, collectionId, collectionName, collectionDescription, isPublic) =>{
        e.stopPropagation();
        if(isPublic === 'private'){
            return;
        }
        navigate('/home/userCollections', {
            state: 
            {
                collectionId: collectionId,

            }
        }
    )
    }


    // useEffect(() =>{
    //     console.log(data)
    // }, [data])

    useEffect(() =>{
        if(inView && !isFetchingNextPage && hasNextPage){
            fetchNextPage();
        }
        
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const collections = data?.pages.flatMap((page) => page.data) || [];

    if(isLoading){
        return(
            <>
            <div key={1} className="collection-container">
                <div className="collection-profile-loading-container">
                    <MoonLoader loading={isLoading} size={25}/>
                </div>
            </div>
            </>
        )
    }

    if(collections.length === 0 && !isLoading){
        return(
            <>
            <div key={2} className="collection-container">
                <div>
                    No collections to show.
                </div>
            </div>
            </>
        )
    }

    return(
        <>
        <div className="collection-container">
            {collections?.map((collection) => (
                <div key={collection.id} className="collection-cards-profile-container">
                <div onClick={(e) => handleClickCards(e, collection.id, collection.name, collection.description, collection.is_public)} key={collection.id} className="collection-cards-profile">

                    {collection.is_public === 'private' && (
                        <div className="collection-private-blocker">
                            <svg xmlns="http://www.w3.org/2000/svg" width="50px" height="50px" viewBox="0 0 24 24" fill="none">
                                <path fillRule="evenodd" clipRule="evenodd" d="M15.9202 12.7988C15.9725 12.5407 16 12.2736 16 12C16 9.79086 14.2091 8 12 8C11.7264 8 11.4593 8.02746 11.2012 8.07977L12.1239 9.00251C13.6822 9.06583 14.9342 10.3178 14.9975 11.8761L15.9202 12.7988ZM9.39311 10.5143C9.14295 10.9523 9 11.4595 9 12C9 13.6569 10.3431 15 12 15C12.5405 15 13.0477 14.857 13.4857 14.6069L14.212 15.3332C13.5784 15.7545 12.8179 16 12 16C9.79086 16 8 14.2091 8 12C8 11.1821 8.24547 10.4216 8.66676 9.78799L9.39311 10.5143Z" fill="#bdbdbdff"/>
                                <path fillRule="evenodd" clipRule="evenodd" d="M16.1537 17.2751L15.4193 16.5406C14.3553 17.1196 13.1987 17.5 12 17.5C10.3282 17.5 8.73816 16.7599 7.36714 15.7735C6.00006 14.79 4.89306 13.5918 4.19792 12.7478C3.77356 12.2326 3.72974 12.1435 3.72974 12C3.72974 11.8565 3.77356 11.7674 4.19792 11.2522C4.86721 10.4396 5.9183 9.29863 7.21572 8.33704L6.50139 7.62271C5.16991 8.63072 4.10383 9.79349 3.42604 10.6164L3.36723 10.6876C3.03671 11.087 2.72974 11.4579 2.72974 12C2.72974 12.5421 3.0367 12.913 3.36723 13.3124L3.42604 13.3836C4.15099 14.2638 5.32014 15.5327 6.78312 16.5853C8.24216 17.635 10.0361 18.5 12 18.5C13.5101 18.5 14.9196 17.9886 16.1537 17.2751ZM9.18993 6.06861C10.0698 5.71828 11.0135 5.5 12 5.5C13.9639 5.5 15.7579 6.365 17.2169 7.41472C18.6799 8.46727 19.849 9.73623 20.574 10.6164L20.6328 10.6876C20.9633 11.087 21.2703 11.4579 21.2703 12C21.2703 12.5421 20.9633 12.913 20.6328 13.3124L20.574 13.3836C20.0935 13.9669 19.418 14.721 18.5911 15.4697L17.883 14.7617C18.6787 14.0456 19.3338 13.3164 19.8021 12.7478C20.2265 12.2326 20.2703 12.1435 20.2703 12C20.2703 11.8565 20.2265 11.7674 19.8021 11.2522C19.107 10.4082 18 9.21001 16.6329 8.22646C15.2619 7.24007 13.6718 6.5 12 6.5C11.3056 6.5 10.6253 6.62768 9.96897 6.84765L9.18993 6.06861Z" fill="#bdbdbdff"/>
                                <path d="M5 2L21 18" stroke="#bdbdbdff"/>
                            </svg>
                        </div>
                    )}
                    
                    <div className="collection-illustration">
                        <img className="collection-illustration-img" src={'/assets/collection-banner.png'} alt="" />
                    </div>
                    <div className="collection-name-container">
                        {collection.name}
                    </div>
                    <div className="collection-date-created">
                        Created {formatPostDate(collection.created_at)}

                    </div>
                </div>
                </div>
 
            ))}
            
        </div>
        <div ref={ref} className="viewer">
        </div>
        </>
    )
}

export default CollectionViewer;