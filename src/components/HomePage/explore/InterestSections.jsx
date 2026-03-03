import { useRef, useState, useCallback, useEffect } from "react";
import formatPostDate from "../../../../helpers/formatDateString";
import { handleImageFallback } from "../../../utils/handleImageFallback";
import "./interestSections.css";

const ScrollArrows = ({ scrollRef }) => {
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, [scrollRef]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener("scroll", checkScroll, { passive: true });
        const ro = new ResizeObserver(checkScroll);
        ro.observe(el);
        return () => {
            el.removeEventListener("scroll", checkScroll);
            ro.disconnect();
        };
    }, [checkScroll, scrollRef]);

    const scroll = (direction) => {
        const el = scrollRef.current;
        if (!el) return;
        const scrollAmount = el.clientWidth * 0.8;
        el.scrollBy({ left: direction === "right" ? scrollAmount : -scrollAmount, behavior: "smooth" });
    };

    return (
        <>
            {canScrollLeft && (
                <button
                    className="interest-scroll-arrow interest-scroll-arrow-left"
                    onClick={() => scroll("left")}
                    aria-label="Scroll left"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>
            )}
            {canScrollRight && (
                <button
                    className="interest-scroll-arrow interest-scroll-arrow-right"
                    onClick={() => scroll("right")}
                    aria-label="Scroll right"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 6 15 12 9 18" />
                    </svg>
                </button>
            )}
        </>
    );
};

const SectionRow = ({ section, onPostClick }) => {
    const scrollRef = useRef(null);

    return (
        <div className="interest-section">
            <div className="interest-section-header">
                <span className="interest-section-title">
                    Trending in {section.interest}
                </span>
            </div>
            <div className="interest-section-track">
                <ScrollArrows scrollRef={scrollRef} />
                <div className="interest-section-scroll" ref={scrollRef}>
                    {section.posts.map((post) => {
                        const thumbnail = post.thumbnail_url || null;
                        const excerpt = post.preview_text || '';
                        const title = post.title || 'Untitled';
                        const displayTitle = title.length > 50 ? title.slice(0, 50) + '...' : title;

                        return (
                            <div
                                key={post.id}
                                className="interest-card"
                                onClick={() => onPostClick(post.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        onPostClick(post.id);
                                    }
                                }}
                            >
                                {thumbnail && (
                                    <div className="interest-card-image">
                                        <img
                                            src={thumbnail}
                                            alt=""
                                            loading="lazy"
                                            onError={handleImageFallback}
                                        />
                                    </div>
                                )}
                                <div className="interest-card-body">
                                    <h4 className="interest-card-title">{displayTitle}</h4>
                                    {excerpt && (
                                        <p className="interest-card-excerpt">{excerpt.slice(0, 80)}{excerpt.length > 80 ? '...' : ''}</p>
                                    )}
                                    <div className="interest-card-meta">
                                        <span className="interest-card-author">{post.user_name || 'Anonymous'}</span>
                                        <span className="interest-card-dot">&middot;</span>
                                        <span className="interest-card-date">{formatPostDate(post.created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const InterestSections = ({ sections, onPostClick }) => {
    if (!sections || sections.length === 0) return null;

    return (
        <div className="interest-sections">
            {sections.map((section) => (
                <SectionRow key={section.interest} section={section} onPostClick={onPostClick} />
            ))}
        </div>
    );
};

export default InterestSections;
