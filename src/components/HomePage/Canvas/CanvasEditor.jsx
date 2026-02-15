import { useEffect, useMemo, useRef, useState } from "react";
import { Image as KonvaImage, Layer, Rect, Stage, Text } from "react-konva";
import { BarLoader } from "react-spinners";
import { useQueryClient } from "@tanstack/react-query";
import { saveJournal, saveJournalImage } from "../../../../API/Api";
import { useAuth } from "../../../Context/useAuth";
import { parseCanvasDoc } from "../../../utils/canvasDoc";
import "./canvas.css";

const FONT_BRUSHES = {
    serif: {label: "Serif", fontFamily: "Georgia", fontStyle: "normal"},
    mono: {label: "Mono", fontFamily: "Courier New", fontStyle: "normal"},
    handwritten: {label: "Hand", fontFamily: "Comic Sans MS", fontStyle: "normal"},
    bold: {label: "Bold", fontFamily: "Trebuchet MS", fontStyle: "bold"},
};

const GRID_SIZE = 24;
const CANVAS_MAX_WIDTH = 560;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const createId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const getStageHeight = (width, aspectRatio) => {
    if(aspectRatio === "4:5"){
        return Math.round(width * 1.25);
    }
    return width;
};

const getSnippetMetrics = (snippet, stageWidth) => {
    const sizeScale = Number.isFinite(snippet.sizeScale) ? snippet.sizeScale : 1;
    const baseFontSize = snippet.fontStyle === "bold" ? 34 : snippet.fontStyle === "handwritten" ? 32 : 30;
    const fontSize = clamp(baseFontSize * sizeScale, 18, 92);
    const estimatedWidth = Math.max(120, Math.min(stageWidth * 0.78, Math.round((snippet.text.length || 1) * fontSize * 0.58)));
    const charsPerLine = Math.max(8, Math.floor(estimatedWidth / (fontSize * 0.56)));
    const lineCount = Math.max(1, Math.ceil((snippet.text.length || 1) / charsPerLine));
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

const CanvasImageNode = ({canvasImage, stageWidth, stageHeight, isSelected, onSelect, onDragEnd}) => {
    const loadedImage = useLoadedImage(canvasImage?.src);
    const objectWidth = clamp((canvasImage?.width || 0.3) * stageWidth, 56, stageWidth * 0.95);
    const objectHeight = clamp((canvasImage?.height || 0.3) * stageHeight, 56, stageHeight * 0.95);
    const x = clamp((canvasImage?.x || 0) * stageWidth, 0, Math.max(0, stageWidth - objectWidth));
    const y = clamp((canvasImage?.y || 0) * stageHeight, 0, Math.max(0, stageHeight - objectHeight));

    return (
        <>
            <KonvaImage
                x={x}
                y={y}
                width={objectWidth}
                height={objectHeight}
                image={loadedImage}
                draggable
                rotation={canvasImage?.rotation || 0}
                scaleX={canvasImage?.scaleX === -1 ? -1 : 1}
                shadowColor="rgba(0,0,0,0.24)"
                shadowBlur={8}
                shadowOffsetY={3}
                onClick={onSelect}
                onTap={onSelect}
                onDragEnd={onDragEnd}
            />
            {isSelected && (
                <Rect
                    x={x}
                    y={y}
                    width={objectWidth}
                    height={objectHeight}
                    stroke="#2f80ed"
                    strokeWidth={1.6}
                    dash={[6, 4]}
                    rotation={canvasImage?.rotation || 0}
                    listening={false}
                />
            )}
        </>
    );
};

const CanvasEditor = ({title, onCloseOnSave, addUploadedImagePath, initialCanvasDoc = null, remixSource = null}) => {
    const {session, user} = useAuth();
    const queryClient = useQueryClient();
    const shellRef = useRef(null);
    const hasHydratedInitialDocRef = useRef(false);
    const [shellWidth, setShellWidth] = useState(CANVAS_MAX_WIDTH);

    const [snippetInput, setSnippetInput] = useState("");
    const [selectedObject, setSelectedObject] = useState(null); // {kind: 'snippet'|'image', id}
    const [isSending, setIsSending] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [canvasMeta, setCanvasMeta] = useState({
        aspectRatio: "1:1",
        gridEnabled: true,
        snapEnabled: true,
        theme: "light"
    });
    const [snippets, setSnippets] = useState([]);
    const [images, setImages] = useState([]);

    useEffect(() => {
        if(hasHydratedInitialDocRef.current || !initialCanvasDoc){
            return;
        }

        const parsedDoc = parseCanvasDoc(initialCanvasDoc);
        setCanvasMeta((prev) => ({
            ...prev,
            aspectRatio: parsedDoc?.meta?.aspectRatio === '4:5' ? '4:5' : '1:1',
            gridEnabled: Boolean(parsedDoc?.meta?.gridEnabled),
            theme: parsedDoc?.meta?.theme === 'dark' ? 'dark' : 'light'
        }));
        setSnippets((parsedDoc?.snippets || []).map((snippet) => ({
            ...snippet,
            id: snippet.id || createId('snippet'),
            zIndex: Number.isFinite(snippet?.zIndex) ? snippet.zIndex : 0
        })));
        setImages((parsedDoc?.images || []).map((image) => ({
            ...image,
            id: image.id || createId('image'),
            zIndex: Number.isFinite(image?.zIndex) ? image.zIndex : 0
        })));
        hasHydratedInitialDocRef.current = true;
    }, [initialCanvasDoc]);

    useEffect(() => {
        const updateShellWidth = () => {
            const nextWidth = shellRef.current?.clientWidth || CANVAS_MAX_WIDTH;
            setShellWidth(nextWidth);
        };

        updateShellWidth();
        window.addEventListener("resize", updateShellWidth);

        let resizeObserver = null;
        if(typeof ResizeObserver !== "undefined" && shellRef.current){
            resizeObserver = new ResizeObserver(updateShellWidth);
            resizeObserver.observe(shellRef.current);
        }

        return () => {
            window.removeEventListener("resize", updateShellWidth);
            if(resizeObserver){
                resizeObserver.disconnect();
            }
        };
    }, []);

    const stageWidth = useMemo(() => Math.max(280, Math.min(CANVAS_MAX_WIDTH, shellWidth - 24)), [shellWidth]);
    const stageHeight = getStageHeight(stageWidth, canvasMeta.aspectRatio);

    const getNextZIndex = () => {
        const allZ = [
            ...snippets.map((snippet) => snippet.zIndex || 0),
            ...images.map((image) => image.zIndex || 0)
        ];
        return allZ.length ? Math.max(...allZ) + 1 : 0;
    };

    const sortedObjects = useMemo(() => {
        const snippetObjects = snippets.map((snippet) => ({kind: "snippet", payload: snippet}));
        const imageObjects = images.map((image) => ({kind: "image", payload: image}));
        return [...snippetObjects, ...imageObjects].sort((a, b) => (a.payload?.zIndex || 0) - (b.payload?.zIndex || 0));
    }, [snippets, images]);

    const selectedSnippet = selectedObject?.kind === "snippet"
        ? snippets.find((snippet) => snippet.id === selectedObject.id) || null
        : null;
    const selectedImage = selectedObject?.kind === "image"
        ? images.find((image) => image.id === selectedObject.id) || null
        : null;

    const updateSnippet = (snippetId, updater) => {
        setSnippets((prev) => prev.map((snippet) => {
            if(snippet.id !== snippetId){
                return snippet;
            }
            const nextValue = typeof updater === "function" ? updater(snippet) : updater;
            return {...snippet, ...nextValue};
        }));
    };

    const updateImage = (imageId, updater) => {
        setImages((prev) => prev.map((image) => {
            if(image.id !== imageId){
                return image;
            }
            const nextValue = typeof updater === "function" ? updater(image) : updater;
            return {...image, ...nextValue};
        }));
    };

    const addSnippet = () => {
        const trimmed = snippetInput.trim();
        if(!trimmed){
            return;
        }

        const snippet = {
            id: createId("snippet"),
            text: trimmed,
            x: 0.16,
            y: 0.2,
            rotation: 0,
            fontStyle: "serif",
            scaleX: 1,
            sizeScale: 1,
            zIndex: getNextZIndex()
        };
        setSnippets((prev) => [...prev, snippet]);
        setSelectedObject({kind: "snippet", id: snippet.id});
        setSnippetInput("");
    };

    const addImageFromFile = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async(event) => {
            const file = event.target.files?.[0];
            if(!file){
                return;
            }

            setIsUploadingImage(true);
            try {
                const dimensions = await new Promise((resolve) => {
                    const tempImg = new window.Image();
                    const objectUrl = URL.createObjectURL(file);
                    tempImg.onload = () => {
                        resolve({
                            width: tempImg.naturalWidth || 1200,
                            height: tempImg.naturalHeight || 800
                        });
                        URL.revokeObjectURL(objectUrl);
                    };
                    tempImg.onerror = () => {
                        resolve({width: 1200, height: 800});
                        URL.revokeObjectURL(objectUrl);
                    };
                    tempImg.src = objectUrl;
                });

                const formdata = new FormData();
                formdata.append("image", file);
                const uploaded = await saveJournalImage(session?.access_token, formdata);
                const imageSrc = uploaded?.img_url;
                if(!imageSrc){
                    return;
                }

                const filePath = imageSrc.split('/journal-images/').pop();
                if(filePath && addUploadedImagePath){
                    addUploadedImagePath(filePath);
                }

                const ratio = dimensions.width / dimensions.height;
                const baseWidth = 0.34;
                const rawHeight = ratio > 0 ? baseWidth / ratio : 0.24;
                const imageObject = {
                    id: createId("image"),
                    src: imageSrc,
                    x: 0.18,
                    y: 0.24,
                    width: clamp(baseWidth, 0.14, 0.8),
                    height: clamp(rawHeight, 0.12, 0.8),
                    rotation: 0,
                    scaleX: 1,
                    zIndex: getNextZIndex()
                };

                setImages((prev) => [...prev, imageObject]);
                setSelectedObject({kind: "image", id: imageObject.id});
            } catch (error) {
                console.error("Canvas image upload failed:", error);
            } finally {
                setIsUploadingImage(false);
            }
        };

        input.click();
    };

    const bringToFront = () => {
        if(!selectedObject){
            return;
        }
        const nextZ = getNextZIndex();
        if(selectedObject.kind === "snippet"){
            updateSnippet(selectedObject.id, {zIndex: nextZ});
        } else {
            updateImage(selectedObject.id, {zIndex: nextZ});
        }
    };

    const sendToBack = () => {
        if(!selectedObject){
            return;
        }
        const allZ = [
            ...snippets.map((snippet) => snippet.zIndex || 0),
            ...images.map((image) => image.zIndex || 0)
        ];
        const minZ = allZ.length ? Math.min(...allZ) - 1 : -1;
        if(selectedObject.kind === "snippet"){
            updateSnippet(selectedObject.id, {zIndex: minZ});
        } else {
            updateImage(selectedObject.id, {zIndex: minZ});
        }
    };

    const removeSelectedObject = () => {
        if(!selectedObject){
            return;
        }
        if(selectedObject.kind === "snippet"){
            setSnippets((prev) => prev.filter((snippet) => snippet.id !== selectedObject.id));
        } else {
            setImages((prev) => prev.filter((image) => image.id !== selectedObject.id));
        }
        setSelectedObject(null);
    };

    const resizeSelectedObject = (direction) => {
        if(!selectedObject){
            return;
        }

        const resizeFactor = direction === "up" ? 1.1 : 0.9;
        if(selectedObject.kind === "snippet"){
            updateSnippet(selectedObject.id, (snippet) => ({
                sizeScale: clamp((snippet.sizeScale || 1) * resizeFactor, 0.6, 2.5)
            }));
        } else {
            updateImage(selectedObject.id, (image) => ({
                width: clamp((image.width || 0.3) * resizeFactor, 0.08, 0.95),
                height: clamp((image.height || 0.3) * resizeFactor, 0.08, 1.15)
            }));
        }
    };

    const rotateSelectedObject = (delta) => {
        if(!selectedObject){
            return;
        }
        if(selectedObject.kind === "snippet"){
            updateSnippet(selectedObject.id, (snippet) => ({rotation: (snippet.rotation || 0) + delta}));
        } else {
            updateImage(selectedObject.id, (image) => ({rotation: (image.rotation || 0) + delta}));
        }
    };

    const flipSelectedObject = () => {
        if(!selectedObject){
            return;
        }
        if(selectedObject.kind === "snippet"){
            updateSnippet(selectedObject.id, (snippet) => ({scaleX: snippet.scaleX === -1 ? 1 : -1}));
        } else {
            updateImage(selectedObject.id, (image) => ({scaleX: image.scaleX === -1 ? 1 : -1}));
        }
    };

    const handleDragEndSnippet = (snippet, evt) => {
        const metrics = getSnippetMetrics(snippet, stageWidth);
        const maxX = Math.max(0, stageWidth - metrics.width);
        const maxY = Math.max(0, stageHeight - metrics.height);

        let nextX = clamp(evt.target.x(), 0, maxX);
        let nextY = clamp(evt.target.y(), 0, maxY);

        if(canvasMeta.snapEnabled){
            nextX = clamp(Math.round(nextX / GRID_SIZE) * GRID_SIZE, 0, maxX);
            nextY = clamp(Math.round(nextY / GRID_SIZE) * GRID_SIZE, 0, maxY);
        }

        updateSnippet(snippet.id, {
            x: stageWidth > 0 ? nextX / stageWidth : 0,
            y: stageHeight > 0 ? nextY / stageHeight : 0
        });
    };

    const handleDragEndImage = (image, evt) => {
        const objectWidth = clamp((image?.width || 0.3) * stageWidth, 56, stageWidth * 0.95);
        const objectHeight = clamp((image?.height || 0.3) * stageHeight, 56, stageHeight * 0.95);
        const maxX = Math.max(0, stageWidth - objectWidth);
        const maxY = Math.max(0, stageHeight - objectHeight);

        let nextX = clamp(evt.target.x(), 0, maxX);
        let nextY = clamp(evt.target.y(), 0, maxY);

        if(canvasMeta.snapEnabled){
            nextX = clamp(Math.round(nextX / GRID_SIZE) * GRID_SIZE, 0, maxX);
            nextY = clamp(Math.round(nextY / GRID_SIZE) * GRID_SIZE, 0, maxY);
        }

        updateImage(image.id, {
            x: stageWidth > 0 ? nextX / stageWidth : 0,
            y: stageHeight > 0 ? nextY / stageHeight : 0
        });
    };

    const saveCanvas = async() => {
        if(!title || (snippets.length === 0 && images.length === 0)){
            return;
        }

        const canvasDoc = {
            version: 1,
            meta: {
                aspectRatio: canvasMeta.aspectRatio,
                gridEnabled: canvasMeta.gridEnabled,
                theme: canvasMeta.theme
            },
            snippets: snippets.map((snippet) => ({
                id: snippet.id,
                text: snippet.text,
                x: Number(snippet.x.toFixed(5)),
                y: Number(snippet.y.toFixed(5)),
                rotation: Number((snippet.rotation || 0).toFixed(2)),
                fontStyle: snippet.fontStyle,
                scaleX: snippet.scaleX === -1 ? -1 : 1,
                sizeScale: Number((snippet.sizeScale || 1).toFixed(3)),
                zIndex: snippet.zIndex || 0
            })),
            images: images.map((image) => ({
                id: image.id,
                src: image.src,
                x: Number((image.x || 0).toFixed(5)),
                y: Number((image.y || 0).toFixed(5)),
                width: Number((image.width || 0.3).toFixed(5)),
                height: Number((image.height || 0.3).toFixed(5)),
                rotation: Number((image.rotation || 0).toFixed(2)),
                scaleX: image.scaleX === -1 ? -1 : 1,
                zIndex: image.zIndex || 0
            }))
        };

        try {
            setIsSending(true);
            const formdata = new FormData();
            formdata.append("title", title);
            formdata.append("post_type", "canvas");
            formdata.append("canvas_doc", JSON.stringify(canvasDoc));
            if(remixSource?.journalId){
                formdata.append("remix_source_journal_id", remixSource.journalId);
                formdata.append("is_remix", "true");
            }
            await saveJournal(session?.access_token, formdata);

            queryClient.invalidateQueries({queryKey: ["journals"]});
            queryClient.invalidateQueries({queryKey: ["userJournals", user?.userData?.[0]?.id]});
            onCloseOnSave();
        } catch (error) {
            console.error("Error saving canvas journal:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="canvas-editor-root">
            {remixSource?.journalId && (
                <div className="canvas-remix-banner">
                    Remixing {remixSource?.authorName ? `${remixSource.authorName}'s` : 'a'} canvas
                </div>
            )}
            <div className="canvas-editor-controls">
                <input
                    value={snippetInput}
                    onChange={(event) => setSnippetInput(event.target.value)}
                    className="canvas-snippet-input"
                    placeholder="Type snippet and add magnet..."
                    maxLength={220}
                />
                <button type="button" className="canvas-control-btn" onClick={addSnippet}>
                    Add Text
                </button>
                <button
                    type="button"
                    className={`canvas-control-btn ${isUploadingImage ? "is-active" : ""}`}
                    onClick={addImageFromFile}
                    disabled={isUploadingImage}
                >
                    {isUploadingImage ? "Uploading..." : "Add Image"}
                </button>
                <select
                    value={canvasMeta.aspectRatio}
                    onChange={(event) => setCanvasMeta((prev) => ({...prev, aspectRatio: event.target.value === "4:5" ? "4:5" : "1:1"}))}
                    className="canvas-select"
                >
                    <option value="1:1">1:1</option>
                    <option value="4:5">4:5</option>
                </select>
                <button
                    type="button"
                    className={`canvas-control-btn ${canvasMeta.gridEnabled ? "is-active" : ""}`}
                    onClick={() => setCanvasMeta((prev) => ({...prev, gridEnabled: !prev.gridEnabled}))}
                >
                    Grid
                </button>
                <button
                    type="button"
                    className={`canvas-control-btn ${canvasMeta.snapEnabled ? "is-active" : ""}`}
                    onClick={() => setCanvasMeta((prev) => ({...prev, snapEnabled: !prev.snapEnabled}))}
                >
                    Snap
                </button>
                <button
                    type="button"
                    className={`canvas-control-btn ${canvasMeta.theme === "dark" ? "is-active" : ""}`}
                    onClick={() => setCanvasMeta((prev) => ({...prev, theme: prev.theme === "dark" ? "light" : "dark"}))}
                >
                    {canvasMeta.theme === "dark" ? "Dark" : "Light"}
                </button>
            </div>

            {selectedObject && (
                <div className="canvas-editor-selection-bar">
                    {selectedSnippet && Object.entries(FONT_BRUSHES).map(([styleKey, styleValue]) => (
                        <button
                            key={styleKey}
                            type="button"
                            className={`canvas-brush-btn ${selectedSnippet.fontStyle === styleKey ? "is-active" : ""}`}
                            onClick={() => updateSnippet(selectedSnippet.id, {fontStyle: styleKey})}
                        >
                            {styleValue.label}
                        </button>
                    ))}
                    <button type="button" className="canvas-control-btn" onClick={() => resizeSelectedObject("down")}>
                        Resize -
                    </button>
                    <button type="button" className="canvas-control-btn" onClick={() => resizeSelectedObject("up")}>
                        Resize +
                    </button>
                    <button type="button" className="canvas-control-btn" onClick={() => rotateSelectedObject(-8)}>
                        Rotate -
                    </button>
                    <button type="button" className="canvas-control-btn" onClick={() => rotateSelectedObject(8)}>
                        Rotate +
                    </button>
                    <button type="button" className="canvas-control-btn" onClick={flipSelectedObject}>
                        Flip
                    </button>
                    <button type="button" className="canvas-control-btn" onClick={bringToFront}>
                        Front
                    </button>
                    <button type="button" className="canvas-control-btn" onClick={sendToBack}>
                        Back
                    </button>
                    <button type="button" className="canvas-control-btn" onClick={removeSelectedObject}>
                        Remove
                    </button>
                </div>
            )}

            <div ref={shellRef} className={`canvas-stage-shell ${canvasMeta.theme === "dark" ? "is-dark" : ""}`}>
                <Stage
                    width={stageWidth}
                    height={stageHeight}
                    onMouseDown={(event) => {
                        if(event.target === event.target.getStage()){
                            setSelectedObject(null);
                        }
                    }}
                >
                    {canvasMeta.gridEnabled && (
                        <Layer listening={false}>
                            {Array.from({length: Math.floor(stageWidth / GRID_SIZE) + 1}).map((_, index) => (
                                <Rect
                                    key={`grid-v-${index}`}
                                    x={index * GRID_SIZE}
                                    y={0}
                                    width={1}
                                    height={stageHeight}
                                    fill={canvasMeta.theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                                />
                            ))}
                            {Array.from({length: Math.floor(stageHeight / GRID_SIZE) + 1}).map((_, index) => (
                                <Rect
                                    key={`grid-h-${index}`}
                                    x={0}
                                    y={index * GRID_SIZE}
                                    width={stageWidth}
                                    height={1}
                                    fill={canvasMeta.theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}
                                />
                            ))}
                        </Layer>
                    )}

                    <Layer>
                        {sortedObjects.map((object) => {
                            if(object.kind === "snippet"){
                                const snippet = object.payload;
                                const metrics = getSnippetMetrics(snippet, stageWidth);
                                const brush = FONT_BRUSHES[snippet.fontStyle] || FONT_BRUSHES.serif;
                                const snippetX = clamp(snippet.x * stageWidth, 0, Math.max(0, stageWidth - metrics.width));
                                const snippetY = clamp(snippet.y * stageHeight, 0, Math.max(0, stageHeight - metrics.height));
                                const isSelected = selectedObject?.kind === "snippet" && selectedObject?.id === snippet.id;

                                return (
                                    <Text
                                        key={snippet.id}
                                        x={snippetX}
                                        y={snippetY}
                                        width={metrics.width}
                                        height={metrics.height}
                                        text={snippet.text}
                                        fontFamily={brush.fontFamily}
                                        fontStyle={brush.fontStyle}
                                        fontSize={metrics.fontSize}
                                        fill={canvasMeta.theme === "dark" ? "#f8f8f8" : "#151515"}
                                        align="center"
                                        verticalAlign="middle"
                                        padding={8}
                                        wrap="word"
                                        draggable
                                        rotation={snippet.rotation || 0}
                                        scaleX={snippet.scaleX === -1 ? -1 : 1}
                                        stroke={isSelected ? "#2f80ed" : "transparent"}
                                        strokeWidth={isSelected ? 1 : 0}
                                        shadowColor={canvasMeta.theme === "dark" ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.15)"}
                                        shadowBlur={6}
                                        shadowOffsetY={2}
                                        onClick={() => setSelectedObject({kind: "snippet", id: snippet.id})}
                                        onTap={() => setSelectedObject({kind: "snippet", id: snippet.id})}
                                        onDragEnd={(event) => handleDragEndSnippet(snippet, event)}
                                    />
                                );
                            }

                            const image = object.payload;
                            const isSelected = selectedObject?.kind === "image" && selectedObject?.id === image.id;
                            return (
                                <CanvasImageNode
                                    key={image.id}
                                    canvasImage={image}
                                    stageWidth={stageWidth}
                                    stageHeight={stageHeight}
                                    isSelected={isSelected}
                                    onSelect={() => setSelectedObject({kind: "image", id: image.id})}
                                    onDragEnd={(event) => handleDragEndImage(image, event)}
                                />
                            );
                        })}
                    </Layer>
                </Stage>
            </div>

            <div className="editor-loader-wrapper">
                {(isSending || isUploadingImage) && (
                    <BarLoader loading={isSending || isUploadingImage} width={"100%"} height={3} color="var(--accent-purple)" speedMultiplier={0.7} />
                )}
            </div>

            <div className="editor-footer">
                <span className="editor-word-count">
                    {snippets.length} {snippets.length === 1 ? "text block" : "text blocks"} · {images.length} {images.length === 1 ? "image" : "images"}
                </span>
                <button
                    type="button"
                    disabled={!title || (snippets.length === 0 && images.length === 0) || isSending}
                    onClick={saveCanvas}
                    className={title && (snippets.length > 0 || images.length > 0) ? "editor-save-bttn" : "editor-save-bttn-disabled"}
                >
                    Share
                </button>
            </div>
        </div>
    );
};

export default CanvasEditor;
