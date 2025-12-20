import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "../../Context/useAuth";
import ParseContent from "../HomePage/postCards/parseData";
import { getUserJournals } from "../../../API/Api";
import { useEffect, useState } from "react";
import { MoonLoader } from "react-spinners";
import { useInView } from 'react-intersection-observer';

const OlderPost = ({onSave, onClose}) =>{
    const {user} = useAuth();
    const [selectedPostMap, setSelectedPostMap] = useState(new Map());
    const {ref, inView} = useInView({threshold: 0.2})

    const handleClickContent = (e, journal) =>{
        e.stopPropagation();
        
        setSelectedPostMap((prev) => {
            const newMap = new Map(prev);

            if(newMap.has(journal.id)){
                newMap.delete(journal.id)
            } else {
                newMap.set(journal.id, journal)
            }
            return newMap
        })
    }

    const handleSave = (e) =>{
        e.stopPropagation()
        console.log(selectedPostMap)
        onSave(selectedPostMap)
    }

    const handleClose = (e) =>{
        e.stopPropagation();
        onClose();
    }

    // useEffect(() =>{
    //     console.log(selectedPostMap)
    // }, [selectedPostMap])
    

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
    } = useInfiniteQuery({
        queryKey: ['userJournals', user?.userData?.[0].id],
        queryFn: ({queryKey, pageParam}) => getUserJournals(pageParam, 5, queryKey[1]),
        getNextPageParam: (lastPage) =>{
            if(lastPage.hasMore){
                const lastJournal = lastPage?.data[lastPage?.data.length - 1];
                return new Date(lastJournal.created_at).toISOString();
            } else {
                return undefined;
            }
        },
        enabled: !!user?.userData?.[0].id,
        refetchOnWindowFocus: false,
    })

    useEffect(() =>{
        if(inView && hasNextPage && !isFetchingNextPage){
            console.log('view')
            fetchNextPage();
        }
    }, [inView, isFetchingNextPage, hasNextPage, fetchNextPage])


    const journals = data?.pages?.flatMap((page) => page.data) || [];

    const isSelected = (journalId) =>{
        return selectedPostMap.has(journalId);
    }

    if(isLoading){
        return(
            <div className="older-loading-container">
                <MoonLoader loading={isLoading} size={25}/>
            </div>
            
        )
    }
    return(
        <>
        <div className="older-post-container">
            <div className="cards-container">
                {journals?.map((journal) => {
                    const parsedContent = ParseContent(journal?.content);
                    return(
                        <div onClick={(e) => handleClickContent(e, journal)} key={journal.id} className={isSelected(journal.id) ? "old-post-cards-selected" : "old-post-cards"}>
                            <div className="collection-journal-title">
                                {journal.title}
                            </div>
                            <div className="collection-sliced-text">{parsedContent.slicedText}</div>
                        </div>
                    )
                
                })}
                <div ref={ref} className="inview-container">
                </div>
            </div>

            <div className="save-older-post-container">
                <div className="save-child-container">
                    <div onClick={(e) => handleSave(e)} className="save-older-post-button">
                        save
                    </div>
                    <div>
                        <p className="selected-post">selected post: <span style={{color: 'rgba(66, 148, 255, 1)'}}>{selectedPostMap.size}</span></p>
                    </div>
                </div>
                
                <div onClick={(e) => handleClose(e)} className="cancel-older-post-container">
                    cancel
                </div>
            </div>
            
        </div>
        </>
    )
}

export default OlderPost;