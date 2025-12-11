import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getCollectionJournals } from "../../../API/Api";
import { useLocation } from "react-router-dom";
import ParseContent from "../HomePage/postCards/parseData";

const CollectionJournals = () =>{
    const location = useLocation();
    const collectionData = location.state;

    const scrollToTop = useRef();

    // useEffect(() =>{
    //     console.log(collectionData.collectionId)
    // }, [collectionData])
    const {
        data,
        isLoading,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage
    } = useInfiniteQuery({
        queryKey: ['getCollectionJournals', collectionData?.collectionId],
        queryFn: ({queryKey, pageParam}) => getCollectionJournals(queryKey[1], pageParam, 5),
        getNextPageParam: (lastPage) => {
            if(lastPage?.hasMore){
                const lastCollected = lastPage?.data[lastPage?.data?.length - 1];
                return new Date(lastCollected?.added_at).toISOString();
            } else {
                return undefined;
            }
        },
        enabled: !!collectionData?.collectionId,
        refetchOnWindowFocus: false,
    })

    const handleClickBack = (e) =>{
        e.stopPropagation();
        window.history.back();
    }

    const handleClickCollection = (e, journalId) =>{
        e.stopPropagation();
        console.log(journalId)
    }

    useEffect(() =>{
        console.log(data);
    }, [data])

    useEffect(() =>{
        if(!isLoading && scrollToTop.current){
            scrollToTop.current.scrollIntoView({behavior: 'smooth'})
        };

    }, [data, isLoading])

    const journals = data?.pages?.flatMap((page) => page.data) || [];
    if(journals.length === 0){
        return(
            <>
            <div className='collection-header'>
                <div onClick={(e) => handleClickBack(e)} className='back-button'>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
                </div>
                <p className='collections-header-text'>Browse your collections</p>
            </div>

            <div className="collection-journal-cards-container">
                <div className="no-collections-container">
                    No Journals collected
                </div>
            </div>
            </>
        )
    }
    return (
        <>
        <div ref={scrollToTop}/>
        <div className='collection-header'>
            <div onClick={(e) => handleClickBack(e)} className='back-button'>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#000000"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
            </div>
            <p className='collections-header-text'>Browse your collections</p>
        </div>

        <div className="collection-journal-cards-container">

            <div className="collection-journal-cards">
            {journals.map((journal) =>{
                const parseContent = ParseContent(journal.journals.content)

                return(
                    <div onClick={(e) => handleClickCollection(e, journal.journals.id)} key={journal.journals?.id} className="collections">
                        <div className="journal-collection-image-container">
                            <img className="journal-collection-image" src={parseContent?.firstImage?.src || "../../assets/no-image.png"} alt="" />
                        </div>
                        <div className="collections-title">
                            {journal.journals?.title.length > 22 ? `${journal.journals?.title.substring(0, 21)}...` : journal.journals?.title}
                        </div>
                        <div className="collections-text">
                            {parseContent?.wholeText.length > 100 ? `${parseContent?.wholeText.substring(0, 99)}...` : parseContent?.wholeText}
                        </div>
                    </div>
                    )
                })}
            </div>

        </div>
        
        </>
    )
}
export default CollectionJournals;