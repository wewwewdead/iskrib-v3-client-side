import { useEffect, useMemo, useState } from "react";
import { Image as KonvaImage, Layer, Line, Rect, Stage, Text } from "react-konva";

const FONT_BRUSHES = {
    serif: {fontFamily: "\"Courier New\", \"Lucida Console\", monospace", fontStyle: "normal"},
    handwritten: {fontFamily: "\"Comic Sans MS\", \"Bradley Hand\", cursive", fontStyle: "normal"},
    bold: {fontFamily: "\"Trebuchet MS\", \"Gill Sans\", sans-serif", fontStyle: "bold"},
    serifDisplay: {fontFamily: "Georgia, \"Times New Roman\", serif", fontStyle: "normal"}
};

const FONT_STYLE_MAP = {
    serif: "serif",
    handwritten: "handwritten",
    bold: "bold",
    mono: "serif",
    serifDisplay: "serifDisplay"
};

const GRID_SIZE = 24;
const OBJECT_LIFT_MULTIPLIER = 1.03;
const DEFAULT_DOODLE_COLOR = "#ff2d55";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getSnippetMetrics = (snippet, stageWidth) => {
    const sizeScale = Number.isFinite(snippet?.sizeScale) ? snippet.sizeScale : 1;
    const styleKey = FONT_STYLE_MAP[snippet?.fontStyle] || "serif";
    const baseFontSize = styleKey === "bold" ? 34 : styleKey === "handwritten" ? 32 : 30;
    const fontSize = clamp(baseFontSize * sizeScale, 18, 92);
    const estimatedWidth = Math.max(120, Math.min(stageWidth * 0.78, Math.round(((snippet?.text?.length || 1) * fontSize) * 0.58)));
    const charsPerLine = Math.max(8, Math.floor(estimatedWidth / (fontSize * 0.56)));
    const lineCount = Math.max(1, Math.ceil((snippet?.text?.length || 1) / charsPerLine));
    const height = Math.max(68, Math.round(lineCount * fontSize * 1.14 + 18));

    return {width: estimatedWidth, height, fontSize};
};

const useLoadedImage = (src) => {
    const [image, setImage] = useState(null);

    useEffect(() => {
        if(!src){
            setImage(null);
            return;
        }

        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => setImage(img);
        img.onerror = () => setImage(null);
        img.src = src;

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src]);

    return image;
};

const CanvasImageNode = ({
    canvasImage,
    stageWidth,
    stageHeight,
    isSelected,
    isDragging,
    onSelect,
    onDragStart,
    onDragEnd,
    canInteract,
    preventTouchDefault,
    isBeingRemoved
}) => {
    const loadedImage = useLoadedImage(canvasImage?.src);
    const objectWidth = clamp((canvasImage?.width || 0.3) * stageWidth, 56, stageWidth * 0.95);
    const objectHeight = clamp((canvasImage?.height || 0.3) * stageHeight, 56, stageHeight * 0.95);
    const x = clamp((canvasImage?.x || 0) * stageWidth, 0, Math.max(0, stageWidth - objectWidth));
    const y = clamp((canvasImage?.y || 0) * stageHeight, 0, Math.max(0, stageHeight - objectHeight));
    const liftMultiplier = isDragging ? OBJECT_LIFT_MULTIPLIER + 0.02 : isSelected ? OBJECT_LIFT_MULTIPLIER : 1;
    const baseScaleX = canvasImage?.scaleX === -1 ? -1 : 1;

    return (
        <>
            <KonvaImage
                name={canvasImage?.id}
                x={x}
                y={y}
                width={objectWidth}
                height={objectHeight}
                image={loadedImage}
                draggable={canInteract && !isBeingRemoved}
                rotation={canvasImage?.rotation || 0}
                scaleX={baseScaleX * liftMultiplier}
                scaleY={liftMultiplier}
                shadowColor="rgba(0,0,0,0.3)"
                shadowBlur={isSelected || isDragging ? 16 : 8}
                shadowOffsetY={isSelected || isDragging ? 6 : 3}
                preventDefault={preventTouchDefault}
                onClick={canInteract ? onSelect : undefined}
                onTap={canInteract ? onSelect : undefined}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
            />
            {isSelected && (
                <Rect
                    x={x}
                    y={y}
                    width={objectWidth}
                    height={objectHeight}
                    stroke="#68d391"
                    strokeWidth={1.7}
                    dash={[6, 4]}
                    rotation={canvasImage?.rotation || 0}
                    listening={false}
                />
            )}
        </>
    );
};

export const getCanvasStageHeight = (width, aspectRatio) => (aspectRatio === "4:5" ? Math.round(width * 1.25) : width);

export const buildSortedCanvasObjects = (snippets = [], images = []) => {
    const snippetObjects = snippets.map((snippet) => ({kind: "snippet", payload: snippet}));
    const imageObjects = images.map((image) => ({kind: "image", payload: image}));
    return [...snippetObjects, ...imageObjects].sort((a, b) => (a?.payload?.zIndex || 0) - (b?.payload?.zIndex || 0));
};

const CanvasSurface = ({
    stageRef = null,
    viewportWidth,
    viewportHeight,
    stageWidth,
    stageHeight,
    fitScale = 1,
    fitOffsetX = 0,
    fitOffsetY = 0,
    viewport = {scale: 1, x: 0, y: 0},
    gridEnabled = false,
    theme = "light",
    doodles = [],
    isDrawing = false,
    currentDoodlePoints = [],
    doodleColor = DEFAULT_DOODLE_COLOR,
    doodleSize = 2.8,
    doodleStrokeScale = 1,
    sortedObjects = [],
    selectedObject = null,
    draggingObject = null,
    animatingRemovalId = null,
    canEditObjects = false,
    shouldPreventTouchDefault = false,
    activeTool = "select",
    className = "",
    children,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onStageClick,
    onStageTap,
    onSnippetSelect,
    onSnippetPress,
    onSnippetDragStart,
    onSnippetDragEnd,
    onImageSelect,
    onImagePress,
    onImageDragStart,
    onImageDragEnd
}) => {
    const layerTransform = useMemo(() => ({
        x: fitOffsetX + viewport.x,
        y: fitOffsetY + viewport.y,
        scaleX: fitScale * viewport.scale,
        scaleY: fitScale * viewport.scale
    }), [fitOffsetX, fitOffsetY, fitScale, viewport]);

    return (
        <Stage
            ref={stageRef}
            width={viewportWidth}
            height={viewportHeight}
            preventDefault={activeTool === "doodle"}
            style={{touchAction: activeTool === "doodle" ? "none" : "pan-y"}}
            onMouseDown={onPointerDown}
            onTouchStart={onPointerDown}
            onMouseMove={onPointerMove}
            onTouchMove={onPointerMove}
            onMouseUp={onPointerUp}
            onTouchEnd={onPointerUp}
            onTouchCancel={onPointerUp}
            onMouseLeave={onPointerUp}
            onClick={onStageClick}
            onTap={onStageTap}
            className={className}
        >
            {gridEnabled && (
                <Layer listening={false} {...layerTransform} opacity={clamp((viewport.scale - 0.8) / 0.5, 0.15, 1)}>
                    {Array.from({length: Math.floor(stageWidth / GRID_SIZE) + 1}).map((_, index) => (
                        <Rect
                            key={`grid-v-${index}`}
                            x={index * GRID_SIZE}
                            y={0}
                            width={1}
                            height={stageHeight}
                            fill={theme === "dark" ? "rgba(235,235,235,0.08)" : "rgba(24,24,24,0.09)"}
                        />
                    ))}
                    {Array.from({length: Math.floor(stageHeight / GRID_SIZE) + 1}).map((_, index) => (
                        <Rect
                            key={`grid-h-${index}`}
                            x={0}
                            y={index * GRID_SIZE}
                            width={stageWidth}
                            height={1}
                            fill={theme === "dark" ? "rgba(235,235,235,0.08)" : "rgba(24,24,24,0.09)"}
                        />
                    ))}
                </Layer>
            )}

            <Layer listening={false} {...layerTransform}>
                {doodles.map((doodle) => (
                    <Line
                        key={doodle.id}
                        points={(doodle.points || []).map((point, index) => (
                            index % 2 === 0 ? point * stageWidth : point * stageHeight
                        ))}
                        stroke={doodle.color || DEFAULT_DOODLE_COLOR}
                        strokeWidth={(Number(doodle.size) || 2.8) * doodleStrokeScale}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.35}
                    />
                ))}
                {isDrawing && currentDoodlePoints.length >= 2 && (
                    <Line
                        points={currentDoodlePoints.map((point, index) => (
                            index % 2 === 0 ? point * stageWidth : point * stageHeight
                        ))}
                        stroke={doodleColor}
                        strokeWidth={doodleSize * doodleStrokeScale}
                        lineCap="round"
                        lineJoin="round"
                        tension={0.35}
                    />
                )}
            </Layer>

            <Layer {...layerTransform}>
                {sortedObjects.map((object) => {
                    if(object.kind === "snippet"){
                        const snippet = object.payload;
                        const metrics = getSnippetMetrics(snippet, stageWidth);
                        const styleKey = FONT_STYLE_MAP[snippet.fontStyle] || "serif";
                        const brush = FONT_BRUSHES[styleKey] || FONT_BRUSHES.serif;
                        const snippetX = clamp(snippet.x * stageWidth, 0, Math.max(0, stageWidth - metrics.width));
                        const snippetY = clamp(snippet.y * stageHeight, 0, Math.max(0, stageHeight - metrics.height));
                        const isSelected = selectedObject?.kind === "snippet" && selectedObject?.id === snippet.id;
                        const isDragging = draggingObject?.kind === "snippet" && draggingObject?.id === snippet.id;
                        const liftMultiplier = isDragging ? OBJECT_LIFT_MULTIPLIER + 0.02 : isSelected ? OBJECT_LIFT_MULTIPLIER : 1;
                        const baseScaleX = snippet.scaleX === -1 ? -1 : 1;

                        return (
                            <Text
                                key={snippet.id}
                                name={snippet.id}
                                x={snippetX}
                                y={snippetY}
                                width={metrics.width}
                                height={metrics.height}
                                text={snippet.text}
                                fontFamily={brush.fontFamily}
                                fontStyle={brush.fontStyle}
                                fontSize={metrics.fontSize}
                                fill={theme === "dark" ? "#f8f7f1" : "#151513"}
                                align="center"
                                verticalAlign="middle"
                                padding={8}
                                wrap="word"
                                draggable={canEditObjects}
                                rotation={snippet.rotation || 0}
                                scaleX={baseScaleX * liftMultiplier}
                                scaleY={liftMultiplier}
                                stroke={isSelected ? "#68d391" : "transparent"}
                                strokeWidth={isSelected ? 1.2 : 0}
                                preventDefault={shouldPreventTouchDefault}
                                shadowColor={theme === "dark" ? "rgba(0,0,0,0.58)" : "rgba(0,0,0,0.22)"}
                                shadowBlur={isSelected || isDragging ? 16 : 6}
                                shadowOffsetY={isSelected || isDragging ? 6 : 2}
                                onClick={(event) => {
                                    if(canEditObjects){
                                        onSnippetSelect?.(snippet, event);
                                    }
                                    onSnippetPress?.(snippet, event);
                                }}
                                onTap={(event) => {
                                    if(canEditObjects){
                                        onSnippetSelect?.(snippet, event);
                                    }
                                    onSnippetPress?.(snippet, event);
                                }}
                                onDragStart={canEditObjects ? ((event) => onSnippetDragStart?.(snippet, event)) : undefined}
                                onDragEnd={canEditObjects ? ((event) => onSnippetDragEnd?.(snippet, event)) : undefined}
                            />
                        );
                    }

                    const image = object.payload;
                    const isSelected = selectedObject?.kind === "image" && selectedObject?.id === image.id;
                    const isDragging = draggingObject?.kind === "image" && draggingObject?.id === image.id;
                    return (
                        <CanvasImageNode
                            key={image.id}
                            canvasImage={image}
                            stageWidth={stageWidth}
                            stageHeight={stageHeight}
                            isSelected={isSelected}
                            isDragging={isDragging}
                            isBeingRemoved={animatingRemovalId === image.id}
                            canInteract={canEditObjects}
                            preventTouchDefault={shouldPreventTouchDefault}
                            onSelect={(event) => {
                                if(canEditObjects){
                                    onImageSelect?.(image, event);
                                }
                                onImagePress?.(image, event);
                            }}
                            onDragStart={canEditObjects ? ((event) => onImageDragStart?.(image, event)) : undefined}
                            onDragEnd={canEditObjects ? ((event) => onImageDragEnd?.(image, event)) : undefined}
                        />
                    );
                })}
            </Layer>
            {children}
        </Stage>
    );
};

export default CanvasSurface;
