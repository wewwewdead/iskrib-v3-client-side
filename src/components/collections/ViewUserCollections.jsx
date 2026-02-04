import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "../../Context/useAuth";
import { getCollectionJournals } from "../../../API/Api";
import { useEffect } from "react";
import ParseContent from "../HomePage/postCards/parseData";
import { useLocation, useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { handleCLickContent } from "../../../helpers/handleClicks";

const ViewUserCollection = () =>{
    const {session} = useAuth();
    const location = useLocation();
    const collectionId = location.state.collectionId;
    const navigate = useNavigate();

    const {ref, inView} = useInView({threshold: 0});

    const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage} = useInfiniteQuery({
        queryKey: ['getUserCollectionJournals', collectionId, session?.access_token],
        queryFn: ({queryKey, pageParam}) => getCollectionJournals(queryKey[1], pageParam, 5, queryKey[2]),
        getNextPageParam: (lastPage) => {
            if(lastPage.hasMore){
                const lastJournal = lastPage?.data[lastPage?.data.length - 1];
                return lastJournal?.id;
            } else {
                return undefined;
            }
        },
        enabled: !!collectionId && !!session?.access_token,
    })

    const handleClickBack = (e) =>{
        e.stopPropagation();
        window.history.back();
    }

    const handleClickCard = handleCLickContent(navigate);

    useEffect(() => {
        if(inView && hasNextPage && !isFetchingNextPage){
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const journals = data?.pages.flatMap((page) => page.data) || [];

    return(
        <>
        <div className="back-button-container-user-collections">
            <div onClick={(e) => handleClickBack(e)} className="back-button" role="button" tabIndex={0} aria-label="Go back" onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleClickBack(e) }}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
            </div>
            <div className="back-text">Back</div>
        </div>

        <div className="user-collections-parent-container">
            <div className="user-collection-title-description">
                <div className="collection-name">
                    {location?.state.collectionName}
                </div>
                <div className="collection-description-container">
                    {location?.state.collectionDescription}
                </div>
            </div>

            <div className="user-collections-container">
                {journals.map((journal) => {
                    const parseContent = ParseContent(journal.journals.content)

                    return(
                        <div onClick={(e) => handleClickCard(e, journal.journals.content, parseContent?.wholeText, journal.journals.title, journal.journals.users.id, journal.journals.users.name, journal.journals.users.image_url, journal.journals.created_at, journal.journals.id, journal.hasLiked, journal.journals.comments[0].count, journal.hasBookMarked, journal.journals.likes[0].count, journal.journals.bookmarks[0].count)} className="user-collections" key={journal.id}>
                            <div className="journal-collection-image-container">
                                <img className="journal-collection-image" src={parseContent?.firstImage?.src || "/assets/no-image.png"} alt="journal image" />
                            </div>
                            <div className="collections-title text-truncate">
                                {journal.journals.title}
                            </div>
                            <div className="collections-text text-truncate-2">
                                {parseContent?.wholeText}
                            </div>
                        </div>
                    )
                })}
            </div>
            <div ref={ref} className="viewer"></div>
        </div>
        </>
    )
}
export default ViewUserCollection;
