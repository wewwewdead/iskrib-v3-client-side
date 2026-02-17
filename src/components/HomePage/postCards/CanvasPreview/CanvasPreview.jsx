import { useEffect, useMemo, useRef, useState } from 'react';
import CanvasSurface, { buildSortedCanvasObjects, getCanvasStageHeight } from '../../Canvas/CanvasSurface';
import { parseCanvasDoc } from '../../../../utils/canvasDoc';
import './canvaspreview.css';

const CANVAS_BASE_WIDTH = 560;
const PREVIEW_MIN_WIDTH = 120;
const PREVIEW_FALLBACK_WIDTH = 220;
const PREVIEW_MIN_HEIGHT = 90;
const PREVIEW_LAZY_ROOT_MARGIN = '320px 0px';

const CanvasPreview = ({ canvasDoc }) => {
    const containerRef = useRef(null);
    const [containerSize, setContainerSize] = useState({
        width: PREVIEW_FALLBACK_WIDTH,
        height: PREVIEW_FALLBACK_WIDTH,
    });
    const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
    const parsed = useMemo(() => parseCanvasDoc(canvasDoc), [canvasDoc]);
    const { meta, snippets, images, doodles } = parsed;
    const isEmpty = snippets.length === 0 && images.length === 0 && doodles.length === 0;
    const isDark = meta.theme === 'dark';
    const aspectClass = meta.aspectRatio === '4:5' ? 'is-4-5' : 'is-1-1';

    useEffect(() => {
        const updateWidth = () => {
            const nextWidth = containerRef.current?.clientWidth || PREVIEW_FALLBACK_WIDTH;
            const nextHeight = containerRef.current?.clientHeight || PREVIEW_FALLBACK_WIDTH;
            setContainerSize((prev) => (
                prev.width === nextWidth && prev.height === nextHeight
                    ? prev
                    : { width: nextWidth, height: nextHeight }
            ));
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);

        let resizeObserver = null;
        if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
            resizeObserver = new ResizeObserver(updateWidth);
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            window.removeEventListener('resize', updateWidth);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        if (isEmpty || hasEnteredViewport) {
            return;
        }

        const element = containerRef.current;
        if (!element) {
            return;
        }

        if (typeof IntersectionObserver !== 'function') {
            setHasEnteredViewport(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting || entry.intersectionRatio > 0)) {
                    setHasEnteredViewport(true);
                    observer.disconnect();
                }
            },
            {
                root: null,
                rootMargin: PREVIEW_LAZY_ROOT_MARGIN,
                threshold: 0.01,
            }
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [isEmpty, hasEnteredViewport]);

    const sortedObjects = useMemo(() => buildSortedCanvasObjects(snippets, images), [snippets, images]);
    const viewportWidth = Math.max(PREVIEW_MIN_WIDTH, containerSize.width);
    const fallbackHeight = getCanvasStageHeight(viewportWidth, meta.aspectRatio);
    const viewportHeight = Math.max(PREVIEW_MIN_HEIGHT, containerSize.height || fallbackHeight);
    const stageWidth = CANVAS_BASE_WIDTH;
    const stageHeight = getCanvasStageHeight(stageWidth, meta.aspectRatio);
    const fitScale = Math.min(viewportWidth / stageWidth, viewportHeight / stageHeight);
    const fitOffsetX = (viewportWidth - stageWidth * fitScale) / 2;
    const fitOffsetY = (viewportHeight - stageHeight * fitScale) / 2;

    return (
        <div
            ref={containerRef}
            className={`canvas-preview ${isDark ? 'is-dark' : 'is-light'} ${aspectClass}`}
            aria-hidden="true"
        >
            <div className="canvas-preview-dots" />

            {isEmpty ? (
                <span className="canvas-preview-empty">Canvas</span>
            ) : hasEnteredViewport ? (
                <CanvasSurface
                    viewportWidth={viewportWidth}
                    viewportHeight={viewportHeight}
                    stageWidth={stageWidth}
                    stageHeight={stageHeight}
                    fitScale={fitScale}
                    fitOffsetX={fitOffsetX}
                    fitOffsetY={fitOffsetY}
                    viewport={{ scale: 1, x: 0, y: 0 }}
                    gridEnabled={Boolean(meta.gridEnabled)}
                    theme={meta.theme}
                    doodles={doodles}
                    sortedObjects={sortedObjects}
                    className="canvas-preview-stage"
                />
            ) : (
                <span className="canvas-preview-loading">Loading canvas...</span>
            )}
        </div>
    );
};

export default CanvasPreview;
