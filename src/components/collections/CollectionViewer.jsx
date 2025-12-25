import { useInfiniteQuery } from "@tanstack/react-query"
import { useEffect } from "react";
import { useLocation } from "react-router-dom"
import { getCollections } from "../../../API/Api";

const CollectionViewer = () =>{
    const location = useLocation();
    const userId = location.state.userId;

    // useEffect(() =>{
    //     console.log(userId)
    // }, [userId])

    const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ['visitedProfileCollections', userId],
        queryFn: ({queryKey, pageParam = null}) => getCollections(queryKey[1], pageParam, 5),
        getNextPageParam: (lastPage) =>{
            if(lastPage?.data?.hasMore){
                const lastJournal = lastPage?.data[lastPage?.data?.length - 1]
                return lastJournal?.created_at;
            } else {
                return undefined;
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false
    })

    useEffect(() =>{
        console.log(data)
    }, [data])

    return(
        <>
        </>
    )
}

export default CollectionViewer;