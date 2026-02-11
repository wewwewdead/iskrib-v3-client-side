import { useInfiniteQuery } from "@tanstack/react-query";
import { useAuth } from "../../Context/useAuth";
import { getCollectionJournals } from "../../../API/Api";
import { useEffect } from "react";
import ParseContent from "../HomePage/postCards/parseData";
import { useLocation, useNavigate } from "react-router-dom";
import { useInView } from "react-intersection-observer";
import { handleCLickContent } from "../../../helpers/handleClicks";
import { MoonLoader } from "react-spinners";
import './collection.css';

const ViewUserCollection = () =>{
    const {session} = useAuth();
    const location = useLocation();
    const collectionId = location.state?.collectionId;
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

    const journals = data?.pages?.flatMap((page) => page.data) || [];

    if(isLoading){
        return(
            <>
            <div className="view-collection-header">
                <div onClick={(e) => handleClickBack(e)} className="back-button" role="button" tabIndex={0} aria-label="Go back" onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleClickBack(e) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
                </div>
                <p className="collections-header-text">{location?.state?.collectionName || "Collection"}</p>
            </div>
            <div className="view-collection-body">
                <div className="view-collection-loading">
                    <MoonLoader loading={true} color="var(--loader-color)" size={25}/>
                </div>
            </div>
            </>
        )
    }

    if(journals.length === 0){
        return(
            <>
            <div className="view-collection-header">
                <div onClick={(e) => handleClickBack(e)} className="back-button" role="button" tabIndex={0} aria-label="Go back" onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleClickBack(e) }}>
                    <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
                </div>
                <p className="collections-header-text">{location?.state?.collectionName || "Collection"}</p>
            </div>
            <div className="view-collection-body">
                {location?.state?.collectionDescription && (
                    <div className="view-collection-description-bar">
                        {location.state.collectionDescription}
                    </div>
                )}
                <div className="no-collections-container">
                    <div className="empty-state-icon-ring">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                        </svg>
                    </div>
                    <h3 className="empty-state-title">No journals yet</h3>
                    <p className="empty-state-description">This collection doesn't have any journals yet.</p>
                </div>
            </div>
            </>
        )
    }

    return(
        <>
        <div className="view-collection-header">
            <div onClick={(e) => handleClickBack(e)} className="back-button" role="button" tabIndex={0} aria-label="Go back" onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') handleClickBack(e) }}>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M360-240 120-480l240-240 56 56-144 144h568v80H272l144 144-56 56Z"/></svg>
            </div>
            <p className="collections-header-text">{location?.state?.collectionName || "Collection"}</p>
            <span className="view-collection-count">{journals.length}</span>
        </div>

        <div className="view-collection-body">
            {location?.state?.collectionDescription && (
                <div className="view-collection-description-bar">
                    {location.state.collectionDescription}
                </div>
            )}

            <div className="view-collection-grid">
                {journals.map((journal) => {
                    const parseContent = ParseContent(journal.journals.content)

                    return(
                        <div onClick={(e) => handleClickCard(e, journal.journals.content, parseContent?.wholeText, journal.journals.title, journal.journals.users.id, journal.journals.users.name, journal.journals.users.image_url, journal.journals.created_at, journal.journals.id, journal.hasLiked, journal.journals.comments[0].count, journal.hasBookMarked, journal.journals.likes[0].count, journal.journals.bookmarks[0].count)} className="view-collection-card" key={journal.id}>
                            <div className="view-card-image-wrapper">
                                <img className="view-card-image" src={parseContent?.firstImage?.src || "/assets/no-image.png"} alt={journal.journals.title ? `${journal.journals.title} cover` : "Journal cover"} />
                                <div className="view-card-image-overlay" />
                            </div>
                            <div className="view-card-content">
                                <div className="view-card-author">
                                    {journal.journals.users.image_url && (
                                        <img className="view-card-avatar" src={journal.journals.users.image_url} alt="" />
                                    )}
                                    <span className="view-card-author-name">{journal.journals.users.name}</span>
                                </div>
                                <div className="view-card-title text-truncate">
                                    {journal.journals.title}
                                </div>
                                <div className="view-card-text text-truncate-2">
                                    {parseContent?.wholeText}
                                </div>
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
