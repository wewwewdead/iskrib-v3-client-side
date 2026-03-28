import { motion } from 'framer-motion';
import { handleImageFallback } from '../../../../utils/handleImageFallback';

const PinnedPostCard = ({ journal, editable, onClickContent, onReorder, onUnpin, pinCount }) => {
    const position = journal.pin_position;
    const isFirst = position === 1;
    const isLast = position === pinCount;

    return (
        <motion.div
            layout
            className="pinned-card"
            onClick={(e) => onClickContent(e, journal)}
        >
            <div className="pinned-badge" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z"/>
                </svg>
            </div>

            {journal.thumbnail_url ? (
                <div className="pinned-card-img-wrap">
                    <img
                        className="pinned-card-thumb"
                        src={journal.thumbnail_url}
                        alt=""
                        onError={handleImageFallback}
                    />
                </div>
            ) : (
                <div className="pinned-card-img-wrap pinned-card-no-thumb">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                </div>
            )}

            <div className="pinned-card-body">
                <p className="pinned-card-title">{journal.title || 'Untitled'}</p>
                {journal.preview_text && (
                    <p className="pinned-card-snippet">{journal.preview_text}</p>
                )}
            </div>

            {editable && (
                <div className="pin-card-actions" onClick={(e) => e.stopPropagation()}>
                    <div className="pin-reorder-arrows">
                        {!isFirst && (
                            <button
                                className="pin-arrow-btn"
                                onClick={(e) => { e.stopPropagation(); onReorder(journal.id, 'up'); }}
                                aria-label="Move pinned post up"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="18 15 12 9 6 15"/>
                                </svg>
                            </button>
                        )}
                        {!isLast && (
                            <button
                                className="pin-arrow-btn"
                                onClick={(e) => { e.stopPropagation(); onReorder(journal.id, 'down'); }}
                                aria-label="Move pinned post down"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="6 9 12 15 18 9"/>
                                </svg>
                            </button>
                        )}
                    </div>
                    <button
                        className="pin-unpin-btn"
                        onClick={(e) => { e.stopPropagation(); onUnpin(journal.id); }}
                        aria-label="Unpin this post from your profile"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Unpin
                    </button>
                </div>
            )}
        </motion.div>
    );
};

export default PinnedPostCard;
