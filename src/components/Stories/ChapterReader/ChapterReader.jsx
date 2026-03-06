import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../../Context/useAuth';
import { useChapter, useChapterCommentCounts } from '../hooks/useStoryData';
import { saveReadingProgress, getReadingProgress } from '../../../../API/StoryApi';
import BASE_URL from '../../../utils/apiBaseUrl';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { BeatLoader } from 'react-spinners';
import ParagraphCommentLayer from './ParagraphCommentLayer';
import CommentPanel from './CommentPanel';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { VIEWER_NODES, EDITOR_THEME } from '../../HomePage/Editor/editorConfig';
import { collectParagraphAnchors, getActiveParagraphSnapshot } from './paragraphAnchors';

import './ChapterReader.css';

const RESUME_ANCHOR_RATIO = 0;
const BACKUP_SAVE_INTERVAL_MS = 15000;
const RESTORE_RETRY_DELAY_MS = 100;
const RESTORE_MAX_RETRIES = 15;
const POST_RESTORE_CORRECTION_DELAYS_MS = [250, 800];

const clamp01 = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(Math.max(parsed, 0), 1);
};

const parseOptionalNumber = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const parseOptionalIndex = (value) => {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

const getParagraphTargetScrollTop = ({ container, targetBlock, paragraphOffset, scrollableHeight }) => {
    if (!container || !targetBlock) return null;

    const containerRect = container.getBoundingClientRect();
    const targetRect = targetBlock.getBoundingClientRect();
    const targetTop = targetRect.top - containerRect.top + container.scrollTop;
    const targetHeight = Math.max(targetBlock.offsetHeight, targetRect.height, 1);
    const anchorOffset = container.clientHeight * RESUME_ANCHOR_RATIO;

    return Math.min(
        Math.max(targetTop + (targetHeight * paragraphOffset) - anchorOffset, 0),
        scrollableHeight
    );
};

const snapshotsEqual = (a, b) => {
    if (!a || !b) return false;
    return a.scrollPosition === b.scrollPosition
        && a.paragraphIndex === b.paragraphIndex
        && a.paragraphOffset === b.paragraphOffset;
};

const ReaderContent = ({ chapter, onContentReady }) => {
    const [editor] = useLexicalComposerContext();

    useEffect(() => {
        if (chapter?.content && editor) {
            try {
                const content = typeof chapter.content === 'string'
                    ? chapter.content
                    : JSON.stringify(chapter.content);
                const state = editor.parseEditorState(content);
                editor.setEditorState(state);
            } catch (err) {
                console.error('Failed to load chapter content:', err);
            }
            editor.setEditable(false);
            const removeListener = editor.registerUpdateListener(() => {
                removeListener();
                requestAnimationFrame(() => {
                    if (onContentReady) onContentReady();
                });
            });
        }
    }, [chapter?.id, editor, onContentReady]);

    return (
        <RichTextPlugin
            contentEditable={<ContentEditable className="chapter-reader-content" />}
            ErrorBoundary={LexicalErrorBoundary}
        />
    );
};

const ChapterReader = () => {
    const { storyId, chapterId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { session } = useAuth();
    const token = session?.access_token;

    const queryClient = useQueryClient();
    const { data: chapter, isLoading } = useChapter(storyId, chapterId, token);
    const { data: commentCounts } = useChapterCommentCounts(chapterId, token);
    const backupSaveIntervalRef = useRef(null);
    const scrollRef = useRef(0);
    const bodyRef = useRef(null);
    const hasRestoredRef = useRef(false);
    const isRestoringRef = useRef(false);
    const skipNextSaveRef = useRef(false);
    const ignoreScrollUntilRef = useRef(0);
    const liveProgressRef = useRef(null);
    const lastSavedProgressRef = useRef(null);
    const restoreFollowUpsCleanupRef = useRef(null);
    const [contentReady, setContentReady] = useState(false);
    const [activeComment, setActiveComment] = useState(null);
    const handleContentReady = useCallback(() => {
        setContentReady(true);
    }, []);

    const getScrollContainer = useCallback(() =>
        document.querySelector('#main-content.center-bar-holder-container')
        || document.querySelector('.center-bar-holder-container')
        || document.querySelector('.home-parent-container')
        || document.scrollingElement
        || document.documentElement
    , []);

    const getContentRoot = useCallback(() =>
        bodyRef.current?.querySelector('.chapter-reader-content') || null
    , []);

    const getReaderParagraphs = useCallback(() =>
        collectParagraphAnchors({ root: getContentRoot() })
    , [getContentRoot]);

    const syncStoryProgressCache = useCallback((progress) => {
        if (!storyId || !progress) return;

        queryClient.setQueryData(['story', storyId], (current) => {
            if (!current) return current;
            return {
                ...current,
                reading_progress: {
                    ...(current.reading_progress || {}),
                    ...progress,
                },
            };
        });
    }, [queryClient, storyId]);

    const getProgressSnapshot = useCallback(() => {
        const container = getScrollContainer();
        const scrollableHeight = Math.max(container.scrollHeight - container.clientHeight, 0);
        const scrollPosition = scrollableHeight > 0
            ? clamp01(container.scrollTop / scrollableHeight)
            : 0;
        const { paragraphIndex, paragraphOffset } = getActiveParagraphSnapshot({
            root: getContentRoot(),
            container,
            anchorRatio: RESUME_ANCHOR_RATIO,
        });

        return {
            scrollPosition,
            paragraphIndex,
            paragraphOffset,
        };
    }, [getContentRoot, getScrollContainer]);

    const captureLatestProgressSnapshot = useCallback(() => {
        const snapshot = getProgressSnapshot();
        liveProgressRef.current = snapshot;
        scrollRef.current = snapshot.scrollPosition;
        return snapshot;
    }, [getProgressSnapshot]);

    const persistProgress = useCallback(async (snapshot, { keepalive = false } = {}) => {
        if (!token || !storyId || !chapterId) return null;

        const payload = {
            chapter_id: chapterId,
            scroll_position: snapshot.scrollPosition,
            paragraph_index: snapshot.paragraphIndex,
            paragraph_offset: snapshot.paragraphOffset,
        };

        scrollRef.current = payload.scroll_position;

        if (keepalive) {
            return fetch(`${BASE_URL}/stories/${storyId}/progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
                keepalive: true,
            })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new Error('failed to save progress');
                    }
                    return response.json().catch(() => payload);
                })
                .then((saved) => {
                    const resolved = saved || payload;
                    syncStoryProgressCache(resolved);
                    return resolved;
                });
        }

        return saveReadingProgress(token, storyId, payload).then((saved) => {
            const resolved = saved || payload;
            syncStoryProgressCache(resolved);
            return resolved;
        });
    }, [chapterId, storyId, syncStoryProgressCache, token]);

    const saveProgressNow = useCallback(async (options = {}) => {
        if (!token || !storyId || !chapterId) return null;
        const liveSnapshot = liveProgressRef.current;
        const freshSnapshot = getProgressSnapshot();
        const snapshot = liveSnapshot?.paragraphIndex !== null ? liveSnapshot : freshSnapshot;
        const shouldSkip = !options.force && snapshotsEqual(snapshot, lastSavedProgressRef.current);

        if (shouldSkip) {
            return lastSavedProgressRef.current;
        }

        liveProgressRef.current = snapshot;

        return persistProgress(snapshot, options)
            .then((saved) => {
                const normalizedSaved = {
                    scrollPosition: clamp01(saved?.scroll_position ?? snapshot.scrollPosition),
                    paragraphIndex: parseOptionalIndex(saved?.paragraph_index ?? snapshot.paragraphIndex),
                    paragraphOffset: (() => {
                        const value = parseOptionalNumber(saved?.paragraph_offset ?? snapshot.paragraphOffset);
                        return value === null ? null : clamp01(value);
                    })(),
                };
                lastSavedProgressRef.current = normalizedSaved;
                liveProgressRef.current = normalizedSaved;
                return saved;
            })
            .catch(() => null);
    }, [chapterId, getProgressSnapshot, persistProgress, storyId, token]);

    const clearTransientState = useCallback(() => {
        if (location.state && Object.keys(location.state).length > 0) {
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, navigate]);

    const clearRestoreFollowUps = useCallback(() => {
        if (typeof restoreFollowUpsCleanupRef.current === 'function') {
            restoreFollowUpsCleanupRef.current();
        }
        restoreFollowUpsCleanupRef.current = null;
    }, []);

    const restoreProgress = useCallback((progress) => {
        if (!progress) return;

        const position = clamp01(progress.scroll_position ?? 0);
        const paragraphIndex = parseOptionalIndex(progress.paragraph_index);
        const paragraphOffsetValue = parseOptionalNumber(progress.paragraph_offset);
        const paragraphOffset = paragraphOffsetValue === null ? 0 : clamp01(paragraphOffsetValue);

        if (paragraphIndex === null && position <= 0) return;

        const container = getScrollContainer();
        let lastHeight = -1;
        let targetScrollTop = null;

        const applySavedProgress = (forceParagraphCorrection = false) => {
            const activeContainer = getScrollContainer();
            const scrollableHeight = Math.max(activeContainer.scrollHeight - activeContainer.clientHeight, 0);

            if (scrollableHeight <= 0) return false;

            let nextScrollTop = position > 0 ? scrollableHeight * position : null;

            if (paragraphIndex !== null) {
                const currentSnapshot = getActiveParagraphSnapshot({
                    root: getContentRoot(),
                    container: activeContainer,
                    anchorRatio: RESUME_ANCHOR_RATIO,
                });
                const needsParagraphCorrection = forceParagraphCorrection
                    || currentSnapshot.paragraphIndex !== paragraphIndex;

                if (needsParagraphCorrection) {
                    const targetBlock = getReaderParagraphs()[paragraphIndex]?.element;
                    const paragraphScrollTop = getParagraphTargetScrollTop({
                        container: activeContainer,
                        targetBlock,
                        paragraphOffset,
                        scrollableHeight,
                    });

                    if (paragraphScrollTop !== null) {
                        nextScrollTop = paragraphScrollTop;
                    }
                }
            }

            if (nextScrollTop === null) return false;

            isRestoringRef.current = true;
            skipNextSaveRef.current = true;
            ignoreScrollUntilRef.current = Date.now() + 200;
            activeContainer.scrollTop = nextScrollTop;
            targetScrollTop = nextScrollTop;
            return true;
        };

        const scheduleRestoreFollowUps = () => {
            clearRestoreFollowUps();

            const timeouts = POST_RESTORE_CORRECTION_DELAYS_MS.map((delay) => setTimeout(() => {
                if (!applySavedProgress()) return;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        isRestoringRef.current = false;
                        skipNextSaveRef.current = false;
                        captureLatestProgressSnapshot();
                    });
                });
            }, delay));

            const handleViewportChange = () => {
                if (!applySavedProgress()) return;

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        isRestoringRef.current = false;
                        skipNextSaveRef.current = false;
                        captureLatestProgressSnapshot();
                    });
                });
            };

            window.addEventListener('resize', handleViewportChange, { passive: true });

            const viewport = window.visualViewport;
            viewport?.addEventListener('resize', handleViewportChange, { passive: true });

            if (document.fonts?.ready) {
                document.fonts.ready.then(() => {
                    handleViewportChange();
                }).catch(() => {});
            }

            restoreFollowUpsCleanupRef.current = () => {
                timeouts.forEach(clearTimeout);
                window.removeEventListener('resize', handleViewportChange);
                viewport?.removeEventListener('resize', handleViewportChange);
            };
        };

        const attemptScroll = (retries = 0) => {
            setTimeout(() => {
                const scrollableHeight = Math.max(container.scrollHeight - container.clientHeight, 0);
                if (scrollableHeight <= 0 && retries < RESTORE_MAX_RETRIES) {
                    attemptScroll(retries + 1);
                    return;
                }

                if (scrollableHeight !== lastHeight && retries < RESTORE_MAX_RETRIES) {
                    lastHeight = scrollableHeight;
                    attemptScroll(retries + 1);
                    return;
                }

                let restored = false;
                const paragraphs = getReaderParagraphs();

                if (paragraphIndex !== null && paragraphs.length <= paragraphIndex && retries < RESTORE_MAX_RETRIES) {
                    attemptScroll(retries + 1);
                    return;
                }

                if (position > 0 && scrollableHeight > 0) {
                    restored = applySavedProgress();
                }
                else if (paragraphIndex !== null) {
                    const targetBlock = paragraphs[paragraphIndex]?.element;

                    if (targetBlock) {
                        targetScrollTop = getParagraphTargetScrollTop({
                            container,
                            targetBlock,
                            paragraphOffset,
                            scrollableHeight,
                        });
                        if (targetScrollTop !== null) {
                            isRestoringRef.current = true;
                            skipNextSaveRef.current = true;
                            ignoreScrollUntilRef.current = Date.now() + 150;
                            container.scrollTop = targetScrollTop;
                            restored = true;
                        }
                    }
                }

                if (restored) {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            if (paragraphIndex !== null) {
                                const restoredSnapshot = getActiveParagraphSnapshot({
                                    root: getContentRoot(),
                                    container,
                                    anchorRatio: RESUME_ANCHOR_RATIO,
                                });
                                const needsParagraphCorrection = restoredSnapshot.paragraphIndex !== paragraphIndex;

                                if (needsParagraphCorrection) {
                                    const latestParagraphs = getReaderParagraphs();
                                    const latestTarget = latestParagraphs[paragraphIndex]?.element;
                                    const latestScrollableHeight = Math.max(container.scrollHeight - container.clientHeight, 0);
                                    const correctedScrollTop = getParagraphTargetScrollTop({
                                        container,
                                        targetBlock: latestTarget,
                                        paragraphOffset,
                                        scrollableHeight: latestScrollableHeight,
                                    });

                                    if (correctedScrollTop !== null) {
                                        targetScrollTop = correctedScrollTop;
                                        container.scrollTop = correctedScrollTop;
                                    }
                                }
                            }

                            const restoredSnapshot = captureLatestProgressSnapshot();
                            scrollRef.current = restoredSnapshot.scrollPosition;
                            isRestoringRef.current = false;
                            skipNextSaveRef.current = false;
                            scheduleRestoreFollowUps();
                            clearTransientState();
                        });
                    });
                }
            }, retries === 0 ? 0 : RESTORE_RETRY_DELAY_MS);
        };

        attemptScroll();
    }, [captureLatestProgressSnapshot, clearRestoreFollowUps, clearTransientState, getContentRoot, getReaderParagraphs, getScrollContainer]);

    const navigateWithProgress = useCallback(async (targetPath) => {
        await saveProgressNow({ force: true });
        void queryClient.invalidateQueries({ queryKey: ['story', storyId] });
        navigate(targetPath);
    }, [navigate, queryClient, saveProgressNow, storyId]);

    useEffect(() => {
        const container = getScrollContainer();

        const handleScroll = () => {
            const scrollableHeight = Math.max(container.scrollHeight - container.clientHeight, 0);
            scrollRef.current = scrollableHeight > 0
                ? clamp01(container.scrollTop / scrollableHeight)
                : 0;
            captureLatestProgressSnapshot();

            if (skipNextSaveRef.current) {
                skipNextSaveRef.current = false;
                return;
            }

            if (Date.now() < ignoreScrollUntilRef.current) {
                return;
            }

            if (isRestoringRef.current) {
                return;
            }

            clearRestoreFollowUps();
        };

        const handleVisibilityChange = () => {
            if (document.hidden) {
                void saveProgressNow({ keepalive: true, force: true });
            }
        };

        const handleBeforeUnload = () => {
            void saveProgressNow({ keepalive: true, force: true });
        };

        const handlePageHide = () => {
            void saveProgressNow({ keepalive: true, force: true });
        };

        container.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('pagehide', handlePageHide);

        return () => {
            container.removeEventListener('scroll', handleScroll);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('pagehide', handlePageHide);
            isRestoringRef.current = false;
            skipNextSaveRef.current = false;
            ignoreScrollUntilRef.current = 0;
            void saveProgressNow({ force: true }).then(() => {
                void queryClient.invalidateQueries({ queryKey: ['story', storyId] });
            });
        };
    }, [captureLatestProgressSnapshot, clearRestoreFollowUps, getScrollContainer, queryClient, saveProgressNow, storyId]);

    useEffect(() => {
        if (backupSaveIntervalRef.current) {
            clearInterval(backupSaveIntervalRef.current);
        }

        backupSaveIntervalRef.current = setInterval(() => {
            if (isRestoringRef.current) return;
            if (!liveProgressRef.current) return;
            if (snapshotsEqual(liveProgressRef.current, lastSavedProgressRef.current)) return;
            void saveProgressNow();
        }, BACKUP_SAVE_INTERVAL_MS);

        return () => {
            if (backupSaveIntervalRef.current) {
                clearInterval(backupSaveIntervalRef.current);
                backupSaveIntervalRef.current = null;
            }
        };
    }, [saveProgressNow]);

    useEffect(() => {
        if (hasRestoredRef.current || !contentReady) return;
        hasRestoredRef.current = true;

        const locationProgress = {
            chapter_id: chapterId,
            scroll_position: parseOptionalNumber(location.state?.scrollPosition) ?? 0,
            paragraph_index: parseOptionalIndex(location.state?.paragraphIndex),
            paragraph_offset: parseOptionalNumber(location.state?.paragraphOffset),
        };

        const hasLocationProgress = locationProgress.paragraph_index !== null || locationProgress.scroll_position > 0;
        const restoreLocationFallback = () => {
            if (hasLocationProgress) {
                restoreProgress(locationProgress);
            }
        };

        if (token) {
            getReadingProgress(token, storyId).then((progress) => {
                const normalizedProgress = progress ? {
                    ...progress,
                    scroll_position: parseOptionalNumber(progress.scroll_position) ?? 0,
                    paragraph_index: parseOptionalIndex(progress.paragraph_index),
                    paragraph_offset: parseOptionalNumber(progress.paragraph_offset),
                } : null;

                const sameChapter = normalizedProgress?.chapter_id
                    && String(normalizedProgress.chapter_id) === String(chapterId);
                const hasServerProgress = sameChapter
                    && (normalizedProgress.paragraph_index !== null || normalizedProgress.scroll_position > 0);

                if (hasServerProgress) {
                    lastSavedProgressRef.current = {
                        scrollPosition: normalizedProgress.scroll_position,
                        paragraphIndex: normalizedProgress.paragraph_index,
                        paragraphOffset: normalizedProgress.paragraph_offset === null
                            ? null
                            : clamp01(normalizedProgress.paragraph_offset),
                    };
                    restoreProgress(normalizedProgress);
                    return;
                }

                restoreLocationFallback();
            }).catch(() => {
                restoreLocationFallback();
            });
        } else {
            restoreLocationFallback();
        }
    }, [chapterId, contentReady, location.state, restoreProgress, storyId, token]);

    useEffect(() => {
        setContentReady(false);
        setActiveComment(null);
        hasRestoredRef.current = false;
        isRestoringRef.current = false;
        skipNextSaveRef.current = false;
        ignoreScrollUntilRef.current = 0;
        liveProgressRef.current = null;
        lastSavedProgressRef.current = null;
        clearRestoreFollowUps();
    }, [chapterId, clearRestoreFollowUps]);

    useEffect(() => {
        if (!contentReady) return;
        captureLatestProgressSnapshot();
    }, [captureLatestProgressSnapshot, contentReady]);

    useEffect(() => {
        const bar = document.getElementById('chapter-progress-bar');
        if (!bar) return;
        const container = getScrollContainer();

        const updateBar = () => {
            const scrollableHeight = Math.max(container.scrollHeight - container.clientHeight, 0);
            const pct = scrollableHeight > 0 ? (container.scrollTop / scrollableHeight) * 100 : 0;
            bar.style.width = `${Math.min(pct, 100)}%`;
        };

        updateBar();
        container.addEventListener('scroll', updateBar, { passive: true });
        return () => container.removeEventListener('scroll', updateBar);
    }, [contentReady, getScrollContainer, isLoading]);

    const editorConfig = {
        namespace: 'ChapterReader',
        theme: EDITOR_THEME,
        nodes: VIEWER_NODES,
        editable: false,
        onError(error) { console.error('Lexical error:', error); },
    };

    if (isLoading) {
        return (
            <div className="chapter-reader">
                <div className="chapter-reader-loading">
                    <BeatLoader size={10} color="var(--text-muted)" />
                </div>
            </div>
        );
    }

    if (!chapter) {
        return (
            <div className="chapter-reader">
                <p className="chapter-reader-error">Chapter not found.</p>
            </div>
        );
    }

    const prevCh = chapter.prev_chapter;
    const nextCh = chapter.next_chapter;

    return (
        <>
        <div className="chapter-progress-track">
            <div id="chapter-progress-bar" className="chapter-progress-fill" />
        </div>

        <motion.div
            className="chapter-reader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
        >
            <div className="chapter-reader-header">
                <button
                    className="chapter-reader-back"
                    onClick={() => void navigateWithProgress(`/home/stories/${storyId}`)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="var(--text-secondary)">
                        <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                    </svg>
                </button>
                <div className="chapter-reader-header-info">
                    <span className="chapter-reader-chapter-label">Chapter {chapter.chapter_number}</span>
                    <h1 className="chapter-reader-title">{chapter.title}</h1>
                </div>
            </div>

            <div className="chapter-reader-body" ref={bodyRef}>
                <LexicalComposer initialConfig={editorConfig}>
                    <ReaderContent chapter={chapter} onContentReady={handleContentReady} />
                </LexicalComposer>
                <ParagraphCommentLayer
                    containerRef={bodyRef}
                    commentCounts={commentCounts}
                    onParagraphClick={setActiveComment}
                />
            </div>

            <AnimatePresence>
                {activeComment && (
                    <CommentPanel
                        chapterId={chapterId}
                        activeComment={activeComment}
                        onClose={() => setActiveComment(null)}
                    />
                )}
            </AnimatePresence>

            <div className="chapter-reader-nav">
                {prevCh ? (
                    <button
                        className="chapter-nav-btn chapter-nav-prev"
                        onClick={() => void navigateWithProgress(`/home/stories/${storyId}/chapter/${prevCh.id}`)}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                        </svg>
                        <span>Ch. {prevCh.chapter_number}: {prevCh.title}</span>
                    </button>
                ) : <div />}
                {nextCh ? (
                    <button
                        className="chapter-nav-btn chapter-nav-next"
                        onClick={() => void navigateWithProgress(`/home/stories/${storyId}/chapter/${nextCh.id}`)}
                    >
                        <span>Ch. {nextCh.chapter_number}: {nextCh.title}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                ) : <div />}
            </div>
        </motion.div>
        </>
    );
};

export default ChapterReader;
