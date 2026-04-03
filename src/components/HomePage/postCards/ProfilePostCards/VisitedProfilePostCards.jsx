import {useLocation, useNavigate } from 'react-router-dom';
import './profilepostcards.css';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { MoonLoader } from 'react-spinners';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { handleCLickContent } from '../../../../../helpers/handleClicks';
import { useAuth } from '../../../../Context/useAuth';
import { getVisitedUserJournals } from '../../../../../API/Api';
import { useAddViewsMutation } from '../../../../utils/useMutation';
import VerifiedBadge from '../../../Badge/VerifiedBadge';
import { handleImageFallback } from '../../../../utils/handleImageFallback';
import VisitedPinnedPostsSection from './VisitedPinnedPostsSection';

const VisitedProfilePostCards = () =>{
    const location = useLocation();
    const userId = location.state?.userId || new URLSearchParams(location.search).get('userId');
    const {user, session} = useAuth();

    const navigate = useNavigate();

    const {ref, inView} = useInView({
        threshold: 0.2
    })

    const {data: journalData, isLoading: isLoadingJournals, isFetchingNextPage, fetchNextPage, hasNextPage,} = useInfiniteQuery({
        queryKey: ['visitedProfileJournals', userId, user?.userData?.[0]?.id],
        queryFn: ({pageParam = null, queryKey}) => getVisitedUserJournals(pageParam, 5, queryKey[1], queryKey[2]),
        getNextPageParam: (lastPage) => {
            if(lastPage.hasMore){
                const lastJournal = lastPage?.data[lastPage?.data.length - 1]
                return new Date(lastJournal.created_at).toISOString();
            } else {
                return undefined
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5
    })

    const clickContent = handleCLickContent(navigate);
    const mutateViews = useAddViewsMutation(session);
    const viewContent = (e, jsonbContent,wholeText, title, userId, name, avatar, created_at, journalId, isLiked, commentsCount, isBookmarked, likesCount, bookmarksCount, badge, postType = null, userReaction = null, reactionCount = 0) =>{
        const formadata = new FormData();
        formadata.append('journalId', journalId)
        mutateViews.mutate(formadata);

        clickContent(e, jsonbContent,wholeText, title, userId, name, avatar, created_at, journalId, isLiked, commentsCount, isBookmarked, likesCount, bookmarksCount, badge, postType, userReaction, reactionCount);
    }

    useEffect(() =>{
        // console.log(userId)
    },[userId])

    const [viewMode, setViewMode] = useState('list');

    useEffect(() =>{
        if(!isFetchingNextPage && hasNextPage && inView){
            fetchNextPage();
        }
    }, [inView, fetchNextPage, isFetchingNextPage, hasNextPage])

    const handleToggleView = useCallback(() => {
        setViewMode((prev) => (prev === 'list' ? 'grid' : 'list'));
    }, []);

    const journals = useMemo(() => journalData?.pages.flatMap((page) => page.data) || [], [journalData]);


   if(isLoadingJournals){
        return(
            <>
            <div className='profile-postcards-loading-container'>
                <MoonLoader loading={isLoadingJournals} color="var(--loader-color)" size={20} speedMultiplier={0.5}/>
            </div>
            </>
        )
    }
    

    if(journalData && !journals?.length > 0){
        return (
            <div className='profile-postcards-loading-container'>
                No post available!
            </div>
        )
    }

    return(
        <>
        <VisitedPinnedPostsSection />
        <div className='profile-postcards-parent-container'>
            <div className="postcards-header-row">
                <h2 className="postcards-heading">
                    Posts <span className="postcards-count">({journals.length})</span>
                </h2>
                <div className="postcards-header-actions">
                    <button
                        className={`postcards-view-toggle-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
                        onClick={handleToggleView}
                        title={viewMode === 'grid' ? 'Switch to list' : 'Switch to grid'}
                    >
                        {viewMode === 'grid' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M120-520v-320h320v320H120Zm0 400v-320h320v320H120Zm400-400v-320h320v320H520Zm0 400v-320h320v320H520Z"/></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M120-200v-560h720v560H120Z"/></svg>
                        )}
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div className="postcards-grid-view">
                    {journals.map((journal) => {
                        const isRepost = journal?.is_repost === true;
                        const previewText = !isRepost ? (journal?.preview_text || '') : '';
                        const thumbnail = !isRepost ? (journal?.thumbnail_url || null) : null;
                        const repostSource = isRepost ? journal?.repost_source : null;
                        return (
                            <motion.div
                                key={journal.id}
                                className="postcards-grid-item"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.25, ease: 'easeOut' }}
                                onClick={(e) => viewContent(e, null, '', journal?.title, userId, journal?.users?.name, journal?.users?.image_url, journal?.created_at, journal?.id, journal?.has_liked, journal?.comment_count?.[0].count, journal?.has_bookmarked, journal?.like_count?.[0].count, journal?.bookmark_count?.[0].count, journal?.users?.badge, journal?.post_type, journal?.user_reaction, journal?.reaction_count?.[0]?.count || 0)}
                            >
                                {isRepost ? (
                                    <div className="postcards-grid-body">
                                        <div className="repost-header-badge" style={{padding: 0}}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="var(--text-faint)">
                                                <path d="M7 7h10l-1.293-1.293a1 1 0 0 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L17 9H7a1 1 0 0 1-1-1V5a1 1 0 0 1 2 0v2zm10 10H7l1.293 1.293a1 1 0 0 1-1.414 1.414l-3-3a1 1 0 0 1 0-1.414l3-3a1 1 0 1 1 1.414 1.414L7 15h10a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0v-2z"/>
                                            </svg>
                                            <span>Reposted</span>
                                        </div>
                                        <h3 className="postcards-grid-title">{(repostSource?.title || journal.title).length > 32 ? `${(repostSource?.title || journal.title).substring(0, 32)}...` : (repostSource?.title || journal.title)}</h3>
                                        {repostSource?.users?.name && (
                                            <p className="postcards-grid-snippet">by {repostSource.users.name}</p>
                                        )}
                                    </div>
                                ) : (
                                <>
                                {thumbnail ? (
                                    <div className="postcards-grid-img-wrap">
                                        <img className="postcards-grid-thumb" src={thumbnail} alt={journal?.title ? `${journal.title} cover image` : "Post cover image"} loading="lazy" onError={handleImageFallback} />
                                    </div>
                                ) : null}
                                <div className="postcards-grid-body">
                                    <h3 className="postcards-grid-title">{journal.title.length > 32 ? `${journal.title.substring(0, 32)}...` : journal.title}</h3>
                                    {previewText && (
                                        <p className="postcards-grid-snippet">{previewText.length > 50 ? `${previewText.substring(0, 50)}...` : previewText}</p>
                                    )}
                                </div>
                                </>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
            <div className="postcards-list-view">
            {journals.map((journal, index) => {
                const isRepost = journal?.is_repost === true;
                const previewText = !isRepost ? (journal?.preview_text || '') : '';
                const thumbnail = !isRepost ? (journal?.thumbnail_url || null) : null;
                const repostSource = isRepost ? journal?.repost_source : null;
                const repostSourcePreviewText = repostSource?.preview_text || '';
                const badgeClass = journal.users.badge === 'legend' ? 'avatar-ring-legend' : journal.users.badge === 'og' ? 'avatar-ring-og' : '';

                return(
                    <motion.div
                        key={journal.id || index}
                        className="profile-postcards"
                        initial={{opacity: 0, y: 12}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.3, ease: 'easeOut'}}
                    >
                        {isRepost && (
                            <div className="repost-header-badge">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="var(--text-faint)">
                                    <path d="M7 7h10l-1.293-1.293a1 1 0 0 1 1.414-1.414l3 3a1 1 0 0 1 0 1.414l-3 3a1 1 0 0 1-1.414-1.414L17 9H7a1 1 0 0 1-1-1V5a1 1 0 0 1 2 0v2zm10 10H7l1.293 1.293a1 1 0 0 1-1.414 1.414l-3-3a1 1 0 0 1 0-1.414l3-3a1 1 0 1 1 1.414 1.414L7 15h10a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0v-2z"/>
                                </svg>
                                <span className="repost-header-name">{journal.users.name}</span>
                                <span>reposted</span>
                            </div>
                        )}

                        {!isRepost && thumbnail && (
                            <img
                                className="card-image-banner"
                                src={thumbnail}
                                alt={journal?.title ? `${journal.title} cover image` : "Post cover image"}
                                loading="lazy"
                                onError={handleImageFallback}
                                onClick={(e) => viewContent(e, null, '', journal?.title, userId, journal?.users?.name, journal?.users?.image_url, journal?.created_at, journal?.id, journal?.has_liked, journal?.comment_count?.[0].count, journal?.has_bookmarked, journal?.like_count?.[0].count, journal?.bookmark_count?.[0].count, journal?.users?.badge, journal?.post_type, journal?.user_reaction, journal?.reaction_count?.[0]?.count || 0)}
                            />
                        )}

                        <div className='user-profile-card-content'>
                            {isRepost ? (
                                <div
                                    className="card-content"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const formadata = new FormData();
                                        formadata.append('journalId', journal.id);
                                        mutateViews.mutate(formadata);
                                        const postSlug = journal.title
                                            ? journal.title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
                                            : '';
                                        navigate(`/home/post/${encodeURIComponent(journal.id)}${postSlug ? `/${postSlug}` : ''}`, {
                                            state: {
                                                isRepost: true,
                                                repostCaption: journal.repost_caption || '',
                                                repostSource: repostSource,
                                                title: journal.title,
                                                userId: journal.users?.id,
                                                name: journal.users?.name,
                                                avatar: journal.users?.image_url,
                                                created_at: journal.created_at,
                                                journalId: journal.id,
                                                isLiked: journal.has_liked,
                                                commentsCount: journal.comment_count?.[0]?.count || 0,
                                                isBookmarked: journal.has_bookmarked,
                                                likesCount: journal.like_count?.[0]?.count || 0,
                                                bookmarksCount: journal.bookmark_count?.[0]?.count || 0,
                                                badge: journal.users?.badge,
                                            }
                                        });
                                    }}
                                >
                                    {journal.repost_caption && (
                                        <p className="repost-caption-text">{journal.repost_caption}</p>
                                    )}
                                    {repostSource ? (
                                        <div className="repost-embedded-card">
                                            <div className="repost-embedded-author">
                                                <div className={`repost-embedded-avatar-wrap ${repostSource.users?.badge === 'legend' ? 'avatar-ring-legend' : repostSource.users?.badge === 'og' ? 'avatar-ring-og' : ''}`}>
                                                    <img className="repost-embedded-avatar" src={repostSource.users?.image_url || '/assets/profile.jpg'} alt="original author" />
                                                </div>
                                                <span className="repost-embedded-name">{repostSource.users?.name}</span>
                                                <VerifiedBadge badge={repostSource.users?.badge} size={12} />
                                            </div>
                                            <p className="repost-embedded-title">{repostSource.title?.length > 60 ? repostSource.title.substring(0, 60) + '...' : repostSource.title}</p>
                                            {repostSourcePreviewText && (
                                                <p className="repost-embedded-text">{repostSourcePreviewText}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="repost-unavailable">
                                            This post is no longer available
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div onClick={(e) => viewContent(e, null, '', journal?.title, userId, journal?.users?.name, journal?.users?.image_url, journal?.created_at, journal?.id, journal?.has_liked, journal?.comment_count?.[0].count, journal?.has_bookmarked, journal?.like_count?.[0].count, journal?.bookmark_count?.[0].count, journal?.users?.badge, journal?.post_type, journal?.user_reaction, journal?.reaction_count?.[0]?.count || 0)} className="content-container">
                                    <div className='feed-text-content-container'>
                                        <div className='feed-title-content'>
                                            <h2 className="feed-title-profile-page">{journal.title.length > 55 ? `${journal.title.substring(0, 55)}...` : journal.title}</h2>
                                        </div>
                                        <p className="feed-text-content-profile-page">{previewText}</p>
                                    </div>
                                </div>
                            )}

                            <div className="card-icons-container">
                                <div className='user-info-child-container'>
                                    <div className={`user-avatar-container ${badgeClass}`}>
                                        <img src={journal.users.image_url || '/assets/profile.jpg'} alt="user-profile" loading='lazy' className="user-info-avatar"/>
                                    </div>
                                    <div className="user-name-container">
                                        <p className="user-newsfeed-name-profile-page">{journal.users.name}</p>
                                        <VerifiedBadge badge={journal.users.badge} size={14} />
                                    </div>
                                    <div className="name-info-separator">•</div>
                                    <p className="user-post-date">{new Date(journal.created_at).toLocaleDateString('en-US', {
                                        month: 'long',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}</p>

                                    <div className="user-post-settings">
                                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M240-400q-33 0-56.5-23.5T160-480q0-33 23.5-56.5T240-560q33 0 56.5 23.5T320-480q0 33-23.5 56.5T240-400Zm240 0q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm240 0q-33 0-56.5-23.5T640-480q0-33 23.5-56.5T720-560q33 0 56.5 23.5T800-480q0 33-23.5 56.5T720-400Z"/></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )
            })}
            </div>
            )}

            <div ref={ref} className='in-view-container'>
                {isFetchingNextPage && (
                    <MoonLoader size={20} color="var(--loader-color)" loading={isFetchingNextPage}/>
                )}
            </div>

        </div>
        </>
    )
}

export default VisitedProfilePostCards;
