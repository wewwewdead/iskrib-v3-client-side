import { useQuery } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../../../../Context/useAuth';
import { getPinnedJournals } from '../../../../../API/Api';
import { useReorderPinMutation, useTogglePinMutation } from '../../../../utils/useMutation';
import { handleCLickContent } from '../../../../../helpers/handleClicks';
import { useNavigate } from 'react-router-dom';
import PinnedPostCard from './PinnedPostCard';

const PinnedPostsSection = () => {
    const { user, session } = useAuth();
    const navigate = useNavigate();
    const userId = user?.userData?.[0]?.id;

    const { data: pinnedData, isLoading } = useQuery({
        queryKey: ['pinnedJournals'],
        queryFn: () => getPinnedJournals(session?.access_token),
        enabled: !!session?.access_token,
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5,
    });

    const reorderMutation = useReorderPinMutation(session);
    const pinMutation = useTogglePinMutation(session);
    const clickContent = handleCLickContent(navigate);

    const handleReorder = (journalId, direction) => {
        reorderMutation.mutate({ journalId, direction });
    };

    const handleUnpin = (journalId) => {
        pinMutation.mutate({ journalId });
    };

    const handleClickContent = (e, journal) => {
        clickContent(
            e,
            null,
            journal.preview_text,
            journal.title,
            journal.user_id,
            journal.users?.name,
            journal.users?.image_url,
            journal.created_at,
            journal.id,
            journal.has_liked,
            journal.comment_count?.[0]?.count || 0,
            journal.has_bookmarked,
            journal.like_count?.[0]?.count || 0,
            journal.bookmark_count?.[0]?.count || 0,
            journal.users?.badge,
            journal.post_type,
            journal.user_reaction,
            journal.reaction_count?.[0]?.count || 0,
        );
    };

    const pins = pinnedData?.data || [];

    if (isLoading) {
        return (
            <div className="pinned-section">
                <div className="pinned-section-header">
                    <span className="pinned-section-heading">Pinned</span>
                </div>
                <div className="pinned-cards-grid">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="pinned-card pinned-card-skeleton" />
                    ))}
                </div>
            </div>
        );
    }

    if (pins.length === 0) return null;

    return (
        <div className="pinned-section" role="region" aria-label="Pinned posts">
            <div className="pinned-section-header">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="pinned-section-icon">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                </svg>
                <span className="pinned-section-heading">Pinned</span>
            </div>
            <div className="pinned-cards-grid">
                <AnimatePresence mode="popLayout">
                    {pins.map(journal => (
                        <PinnedPostCard
                            key={journal.id}
                            journal={journal}
                            editable={true}
                            onClickContent={handleClickContent}
                            onReorder={handleReorder}
                            onUnpin={handleUnpin}
                            pinCount={pins.length}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PinnedPostsSection;
