import React from "react";
import formatCounts from "../../../../helpers/fomatCounts";
import { PROFILE_SECTION_CODES, PROFILE_WIDGET_TYPES, isPhotoNoteType } from "../../../utils/profileLayout/constants";
import { getWidgetBlockCanvasStyle } from "../../../utils/profileLayout/layoutEstimators";

const ProfileLayoutCanvas = (props) => {
    const {
        sectionCanvasRef,
        showLayoutBuilder,
        sectionCanvasHeight,
        visibleProfileSections,
        getProfileSectionSize,
        draggingSectionId,
        activeSectionId,
        activeWidgetId,
        sectionDropTarget,
        floatingProfileWidgets,
        draggingWidgetId,
        widgetResizeState,
        widgetHeightResizeState,
        blockResizeState,
        widgetUploadingState,
        selectedBlockId,
        editingWidgetId,
        blockUploadingState,
        widgetImageResizeState,
        blockImageResizeState,
        activeBlockImageState,
        pinnedWidgetsBySection,
        isMobileLayoutViewport,
        mobileCanvasWidth,
        user,
        userData,
        setActiveWidgetId,
        setActiveSectionId,
        setSectionDropTarget,
        setDraggingWidgetId,
        setSelectedBlockId,
        setEditingWidgetId,
        setActiveBlockImageState,
        widgetColorInputRefs,
        widgetImageInputRefs,
        blockColorInputRefs,
        blockImageInputRefs,
        handleDropWidgetToSection,
        handleStartSectionContainerMove,
        handleStartSectionResize,
        handleStartSectionHeightResize,
        handleWidgetDragStart,
        handleStartWidgetContainerInteraction,
        handleUndockWidget,
        handleRemoveWidget,
        handleStartWidgetHeightResize,
        handleStartWidgetResize,
        handleStartWidgetCornerResize,
        handleDeleteWidgetImage,
        handleStartWidgetImageResize,
        handleAddBlock,
        handleConvertToBlocks,
        handleWidgetFieldChange,
        handleOpenWidgetImagePicker,
        handleWidgetImageUpload,
        handleRemoveBlock,
        handleBlockFieldChange,
        handleOpenBlockColorPicker,
        handleBlockColorChange,
        handleOpenBlockImagePicker,
        handleDeleteBlockImage,
        handleBlockImageUpload,
        handleOpenWidgetColorPicker,
        handleWidgetColorChange,
        handleToggleWidgetEdit,
        handleConfirmWidgetEdit,
        handleCancelWidgetEdit,
        handleStartBlockDrag,
        handleStartBlockResize,
        handleResetBlockImageSize,
        handleStartBlockImageResize,
        triggerAutoSave
    } = props;

    const renderWidgetImage = (widget) => (
        <div
            className={`profile-widget-image-wrapper${widgetImageResizeState?.widgetId === widget.id ? ' is-resizing' : ''}`}
            style={{width: Number.isFinite(widget.image_width) ? `${widget.image_width}px` : undefined}}
        >
            <img
                className="profile-widget-image"
                src={widget.image_url}
                alt={widget.title || 'widget'}
                draggable="false"
                style={{
                    height: Number.isFinite(widget.image_height) ? `${widget.image_height}px` : undefined,
                    width: Number.isFinite(widget.image_width) ? '100%' : undefined
                }}
            />
            <button
                type="button"
                className="profile-widget-image-delete-btn"
                onClick={() => handleDeleteWidgetImage(widget.id, widget.image_url)}
                aria-label="Remove image"
            >
                <svg xmlns="http://www.w3.org/2000/svg" height="12px" viewBox="0 -960 960 960" width="12px" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
            </button>
            {(Number.isFinite(widget.image_width) || Number.isFinite(widget.image_height)) && (
                <div className="profile-widget-image-dimensions">
                    {widget.image_width ?? '—'} &times; {widget.image_height ?? '—'}
                </div>
            )}
            <button type="button" className="profile-widget-image-handle corner-tl" onPointerDown={(e) => handleStartWidgetImageResize(e, widget.id, 'corner-tl')} aria-label="Resize from top-left" />
            <button type="button" className="profile-widget-image-handle corner-tr" onPointerDown={(e) => handleStartWidgetImageResize(e, widget.id, 'corner-tr')} aria-label="Resize from top-right" />
            <button type="button" className="profile-widget-image-handle corner-bl" onPointerDown={(e) => handleStartWidgetImageResize(e, widget.id, 'corner-bl')} aria-label="Resize from bottom-left" />
            <button type="button" className="profile-widget-image-handle corner-br" onPointerDown={(e) => handleStartWidgetImageResize(e, widget.id, 'corner-br')} aria-label="Resize from bottom-right" />
            <button type="button" className="profile-widget-image-handle side-right" onPointerDown={(e) => handleStartWidgetImageResize(e, widget.id, 'right')} aria-label="Resize width" />
            <button type="button" className="profile-widget-image-handle side-bottom" onPointerDown={(e) => handleStartWidgetImageResize(e, widget.id, 'bottom')} aria-label="Resize height" />
        </div>
    );
    const renderBlockImage = (widgetId, block, { onDragStart, elementKey } = {}) => {
        if(!block?.image_url){
            return null;
        }
        const isActive = activeBlockImageState?.widgetId === widgetId && activeBlockImageState?.blockId === block.id;
        const isResizing = blockImageResizeState?.widgetId === widgetId && blockImageResizeState?.blockId === block.id;
        return (
            <div
                key={elementKey}
                className={`profile-widget-block-image-wrapper${isActive ? ' is-active' : ''}${isResizing ? ' is-resizing' : ''}`}
                style={{width: Number.isFinite(block.image_width) ? `${block.image_width}px` : undefined}}
                onPointerDown={(e) => {
                    if(!(e.target instanceof Element)) return;
                    if(e.target.closest('button')){
                        e.stopPropagation();
                        return;
                    }
                    if(onDragStart){
                        onDragStart(e, widgetId, block.id);
                    }
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    setActiveWidgetId(widgetId);
                    setActiveBlockImageState({widgetId, blockId: block.id});
                }}
            >
                <img
                    className="profile-widget-block-image"
                    src={block.image_url}
                    alt={block.title || 'block'}
                    draggable="false"
                    style={{
                        height: Number.isFinite(block.image_height) ? `${block.image_height}px` : undefined,
                        width: Number.isFinite(block.image_width) ? '100%' : undefined
                    }}
                />
                {(Number.isFinite(block.image_width) || Number.isFinite(block.image_height)) && (
                    <div className="profile-widget-image-dimensions">
                        {block.image_width ?? '—'} &times; {block.image_height ?? '—'}
                    </div>
                )}
                {(Number.isFinite(block.image_width) || Number.isFinite(block.image_height)) && (
                    <button
                        type="button"
                        className="profile-widget-block-image-reset-btn"
                        onPointerDown={(e) => {
                            e.stopPropagation();
                        }}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleResetBlockImageSize(widgetId, block.id);
                        }}
                    >
                        Reset
                    </button>
                )}
                <button type="button" className="profile-widget-image-handle corner-tl" onPointerDown={(e) => handleStartBlockImageResize(e, widgetId, block.id, 'corner-tl')} aria-label="Resize block image from top-left" />
                <button type="button" className="profile-widget-image-handle corner-tr" onPointerDown={(e) => handleStartBlockImageResize(e, widgetId, block.id, 'corner-tr')} aria-label="Resize block image from top-right" />
                <button type="button" className="profile-widget-image-handle corner-bl" onPointerDown={(e) => handleStartBlockImageResize(e, widgetId, block.id, 'corner-bl')} aria-label="Resize block image from bottom-left" />
                <button type="button" className="profile-widget-image-handle corner-br" onPointerDown={(e) => handleStartBlockImageResize(e, widgetId, block.id, 'corner-br')} aria-label="Resize block image from bottom-right" />
                <button type="button" className="profile-widget-image-handle side-right" onPointerDown={(e) => handleStartBlockImageResize(e, widgetId, block.id, 'right')} aria-label="Resize block image width" />
                <button type="button" className="profile-widget-image-handle side-bottom" onPointerDown={(e) => handleStartBlockImageResize(e, widgetId, block.id, 'bottom')} aria-label="Resize block image height" />
            </div>
        );
    };
    const renderReadOnlyBlockContent = (widgetId, block) => {
        if(block.type === 'text'){
            return <p className="profile-widget-block-text">{block.content}</p>;
        }
        if(block.type !== 'image'){
            return null;
        }

        const imageContent = [];
        if(block.title){
            imageContent.push(
                <p key={`${block.id}-title`} className="profile-widget-block-title">{block.title}</p>
            );
        }

        const imageNode = renderBlockImage(widgetId, block, {
            onDragStart: handleStartBlockDrag,
            elementKey: `${block.id}-image`
        });
        if(imageNode){
            imageContent.push(imageNode);
        }

        if(block.note){
            imageContent.push(
                <p key={`${block.id}-note`} className="profile-widget-block-note">{block.note}</p>
            );
        }

        return imageContent;
    };
    const renderBlockResizeHandles = (widgetId, block) => (
        <>
            <button
                type="button"
                className="profile-widget-block-resize-handle side-right"
                onPointerDown={(e) => handleStartBlockResize(e, widgetId, block.id, 'right')}
                aria-label="Resize block width"
            />
            <button
                type="button"
                className="profile-widget-block-resize-handle side-bottom"
                onPointerDown={(e) => handleStartBlockResize(e, widgetId, block.id, 'bottom')}
                aria-label="Resize block height"
            />
            <button
                type="button"
                className="profile-widget-block-resize-handle corner-br"
                onPointerDown={(e) => handleStartBlockResize(e, widgetId, block.id, 'corner-br')}
                aria-label="Resize block"
            />
        </>
    );
    const renderWidgetCardResizeHandles = (widget, isVisible = false) => {
        if(!isVisible){
            return null;
        }
        return (
            <>
                <button
                    type="button"
                    className="profile-widget-block-resize-handle side-left profile-widget-card-resize-handle"
                    onPointerDown={(e) => handleStartWidgetResize(e, widget.id, 'left')}
                    aria-label="Resize widget width from left"
                />
                <button
                    type="button"
                    className="profile-widget-block-resize-handle side-right profile-widget-card-resize-handle"
                    onPointerDown={(e) => handleStartWidgetResize(e, widget.id, 'right')}
                    aria-label="Resize widget width from right"
                />
                <button
                    type="button"
                    className="profile-widget-block-resize-handle side-top profile-widget-card-resize-handle"
                    onPointerDown={(e) => handleStartWidgetHeightResize(e, widget.id, 'top')}
                    aria-label="Resize widget height from top"
                />
                <button
                    type="button"
                    className="profile-widget-block-resize-handle side-bottom profile-widget-card-resize-handle"
                    onPointerDown={(e) => handleStartWidgetHeightResize(e, widget.id, 'bottom')}
                    aria-label="Resize widget height from bottom"
                />
                <button
                    type="button"
                    className="profile-widget-block-resize-handle side-right-corners profile-widget-card-resize-handle"
                    onPointerDown={(e) => handleStartWidgetCornerResize(e, widget.id, 'side-right-corners')}
                    aria-label="Resize widget from corner"
                />
            </>
        );
    };
    return(
                    <div
                        ref={sectionCanvasRef}
                        className={`profile-layout-sections ${showLayoutBuilder ? 'is-editing' : ''}`}
                            style={{
                                minHeight: `${sectionCanvasHeight}px`,
                                ...(isMobileLayoutViewport
                                    ? {maxWidth: Number.isFinite(mobileCanvasWidth) ? `${mobileCanvasWidth}px` : '100%'}
                                    : null)
                            }}
                        >
                            {visibleProfileSections.map((section) => {
                                if(['stats', 'bio', 'joined_date'].includes(section.id)) return null;
                                const sectionSize = getProfileSectionSize(section.id);
                                let sectionNode = null;

                                const sectionContentStyle = {
                                    width: Number.isFinite(section.content_width) ? `${section.content_width}px` : undefined,
                                    minHeight: Number.isFinite(section.content_height) ? `${section.content_height}px` : undefined
                                };

                                if(section.id === 'stats'){
                                    sectionNode = (
                                        <div className="profile-stats-container" style={sectionContentStyle}>
                                            <div className="profile-stat-item">
                                                <span className="stat-number">{formatCounts(user?.followerCount)}</span>
                                                <span className="stat-label">Followers</span>
                                            </div>
                                            <div className="profile-stat-item">
                                                <span className="stat-number">{formatCounts(user?.followingCount)}</span>
                                                <span className="stat-label">Following</span>
                                            </div>
                                        </div>
                                    );
                                }

                                if(section.id === 'bio'){
                                    sectionNode = (
                                        <div className="profile-bio-container" style={sectionContentStyle}>
                                            <p className="profile-bio">
                                                {userData?.bio}
                                            </p>
                                        </div>
                                    );
                                }

                                if(section.id === 'joined_date'){
                                    sectionNode = (
                                        <div className="profile-joined-date" style={sectionContentStyle}>
                                            <p className="profile-date-joined">Joined {new Date(userData?.created_at).toLocaleDateString('en-US', {
                                                month: 'long',
                                                day: '2-digit',
                                                year: 'numeric'
                                            })}</p>
                                        </div>
                                    );
                                }

                                if(!sectionNode){
                                    return null;
                                }

                                return (
                                    <div
                                        key={section.id}
                                        data-section-id={section.id}
                                        className={`profile-layout-editable-card profile-section-size-${sectionSize} ${showLayoutBuilder ? 'is-editing' : ''} ${draggingSectionId === section.id ? 'is-dragging' : ''} ${!showLayoutBuilder && activeSectionId === section.id ? 'is-section-active' : ''}`}
                                        style={{
                                            left: `${Number.isFinite(section?.x) ? section.x : 0}px`,
                                            top: `${Number.isFinite(section?.y) ? section.y : 0}px`
                                        }}
                                        onClick={(e) => {
                                            if(showLayoutBuilder){
                                                return;
                                            }
                                            e.stopPropagation();
                                            setActiveWidgetId(null);
                                            setActiveSectionId((prev) => prev === section.id ? null : section.id);
                                        }}
                                        onDragOver={(e) => {
                                            if(!showLayoutBuilder){
                                                return;
                                            }
                                            e.preventDefault();
                                            setSectionDropTarget(section.id);
                                        }}
                                        onDragLeave={() => setSectionDropTarget(null)}
                                        onDrop={(e) => handleDropWidgetToSection(e, section.id)}
                                        onPointerDown={(e) => handleStartSectionContainerMove(e, section.id)}
                                    >
                                        {showLayoutBuilder && (
                                            <div className="profile-inline-editor-row">
                                                <span className="profile-layout-item-code">{PROFILE_SECTION_CODES[section.id] || 'N/A'}</span>
                                            </div>
                                        )}
                                        <div className="profile-resize-shell">
                                            {(showLayoutBuilder || activeSectionId === section.id) && (
                                                <button
                                                    type="button"
                                                    className="profile-side-resize-handle left"
                                                    onPointerDown={(e) => handleStartSectionResize(e, section.id, 'left')}
                                                    aria-label="Resize section from left"
                                                />
                                            )}
                                            {sectionNode}
                                            {(showLayoutBuilder || activeSectionId === section.id) && (
                                                <button
                                                    type="button"
                                                    className="profile-side-resize-handle right"
                                                    onPointerDown={(e) => handleStartSectionResize(e, section.id, 'right')}
                                                    aria-label="Resize section from right"
                                                />
                                            )}
                                        </div>
                                        {pinnedWidgetsBySection[section.id]?.length > 0 && (
                                            <div className="profile-section-pinned-widgets">
                                                {pinnedWidgetsBySection[section.id].map((widget) => (
                                                    <div
                                                        key={widget.id}
                                                        data-widget-id={widget.id}
                                                        className={`profile-widget-card profile-widget-size-${widget.size || 'md'} ${showLayoutBuilder ? 'is-editing is-pinned' : 'is-pinned'} ${activeWidgetId === widget.id ? 'is-widget-active' : ''} ${(widgetResizeState?.widgetId === widget.id || widgetHeightResizeState?.widgetId === widget.id) ? 'is-resizing' : ''}`}
                                                        style={{minHeight: Number.isFinite(widget?.height) ? `${widget.height}px` : undefined, backgroundColor: widget.bg_color || undefined}}
                                                        draggable={showLayoutBuilder}
                                                        onDragStart={(e) => handleWidgetDragStart(e, widget.id)}
                                                        onDragEnd={() => setDraggingWidgetId(null)}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveSectionId(null);
                                                            setActiveWidgetId(widget.id);
                                                        }}
                                                        onPointerDown={(e) => handleStartWidgetContainerInteraction(e, widget.id, {requireActive: false})}
                                                    >
                                                        {showLayoutBuilder && (
                                                            <div className="profile-inline-editor-row">
                                                                <button type="button" onClick={() => handleUndockWidget(widget.id)} className="profile-widget-upload-button">Undock</button>
                                                                <button type="button" onClick={() => handleRemoveWidget(widget.id)} className="profile-widget-remove-button">Remove</button>
                                                            </div>
                                                        )}
                                                        {(!widget.blocks || widget.blocks.length === 0) && (
                                                            <>
                                                                {widget.title && <p className="profile-widget-title">{widget.title}</p>}
                                                                {isPhotoNoteType(widget?.type) && widget.image_url && renderWidgetImage(widget)}
                                                                {widget.note && <p className="profile-widget-note">{widget.note}</p>}
                                                            </>
                                                        )}
                                                        {widget.blocks && widget.blocks.length > 0 && (
                                                            <div className="profile-widget-block-canvas" style={getWidgetBlockCanvasStyle(widget)}>
                                                                {widget.blocks.map((block) => (
                                                                    <div
                                                                        key={block.id}
                                                                        data-block-id={block.id}
                                                                        className={`profile-widget-block profile-widget-block-${block.type}${blockResizeState?.widgetId === widget.id && blockResizeState?.blockId === block.id ? ' is-resizing' : ''}`}
                                                                        style={{
                                                                            left: `${block.x || 0}px`,
                                                                            top: `${block.y || 0}px`,
                                                                            width: `${block.width || 160}px`,
                                                                            minHeight: `${block.height || 40}px`,
                                                                            backgroundColor: block.bg_color || 'transparent'
                                                                        }}
                                                                        onPointerDown={(e) => handleStartBlockDrag(e, widget.id, block.id)}
                                                                    >
                                                                        {renderReadOnlyBlockContent(widget.id, block)}
                                                                        {renderBlockResizeHandles(widget.id, block)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {showLayoutBuilder && (
                                                            <button
                                                                type="button"
                                                                className="profile-vertical-resize-handle"
                                                                onPointerDown={(e) => handleStartWidgetHeightResize(e, widget.id)}
                                                                aria-label="Resize widget height"
                                                            />
                                                        )}
                                                        {renderWidgetCardResizeHandles(widget, showLayoutBuilder || activeWidgetId === widget.id)}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {showLayoutBuilder && sectionDropTarget === section.id && (
                                            <div className="profile-section-drop-hint">Drop note here</div>
                                        )}
                                        {(showLayoutBuilder || activeSectionId === section.id) && (
                                            <button
                                                type="button"
                                                className="profile-vertical-resize-handle"
                                                onPointerDown={(e) => handleStartSectionHeightResize(e, section.id)}
                                                aria-label="Resize section height"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                            {showLayoutBuilder && floatingProfileWidgets.map((widget) => (
                                <div
                                    key={widget.id}
                                    data-widget-id={widget.id}
                                    draggable={showLayoutBuilder}
                                    onDragStart={(e) => handleWidgetDragStart(e, widget.id)}
                                    onDragEnd={() => setDraggingWidgetId(null)}
                                    className={`profile-widget-card profile-widget-size-${widget.size || 'md'} is-editing ${draggingWidgetId === widget.id ? 'is-dragging' : ''} ${(widgetResizeState?.widgetId === widget.id || widgetHeightResizeState?.widgetId === widget.id) ? 'is-resizing' : ''}`}
                                    style={{
                                        left: `${Number.isFinite(widget?.x) ? widget.x : 0}px`,
                                        top: `${Number.isFinite(widget?.y) ? widget.y : 0}px`,
                                        width: Number.isFinite(widget?.width) ? `${widget.width}px` : undefined,
                                        minHeight: Number.isFinite(widget?.height) ? `${widget.height}px` : undefined,
                                        backgroundColor: widget.bg_color || undefined
                                    }}
                                    onPointerDown={(e) => handleStartWidgetContainerInteraction(e, widget.id, {requireActive: false})}
                                >
                                    <div className="profile-inline-editor-row">
                                        <button type="button" onClick={() => handleRemoveWidget(widget.id)} className="profile-widget-remove-button">Remove</button>
                                    </div>
                                    <div className="profile-widget-block-color-row">
                                        <label>BG</label>
                                        <div className="profile-widget-block-color-swatch" style={{backgroundColor: widget.bg_color || 'transparent'}} onClick={() => handleOpenWidgetColorPicker(widget.id)} />
                                        {widget.bg_color && (
                                            <button type="button" className="profile-widget-clear-image-button" onClick={() => handleWidgetColorChange(widget.id, null)}>Clear</button>
                                        )}
                                        <input ref={(node) => { if(node) widgetColorInputRefs.current[widget.id] = node; else delete widgetColorInputRefs.current[widget.id]; }} type="color" value={widget.bg_color || '#ffffff'} style={{display: 'none'}} onChange={(e) => handleWidgetColorChange(widget.id, e.target.value)} />
                                    </div>

                                    <div className="profile-widget-block-toolbar">
                                        <button type="button" className="profile-widget-block-add-btn" onClick={() => handleAddBlock(widget.id, 'text')}>+ Text</button>
                                        <button type="button" className="profile-widget-block-add-btn" onClick={() => handleAddBlock(widget.id, 'image')}>+ Image</button>
                                        {(!widget.blocks || widget.blocks.length === 0) && (widget.title || widget.note || widget.image_url) && (
                                            <button type="button" className="profile-widget-block-add-btn" onClick={() => handleConvertToBlocks(widget.id)}>Convert to blocks</button>
                                        )}
                                    </div>
                                    {(!widget.blocks || widget.blocks.length === 0) && (
                                        <>
                                            <div className="profile-widget-row">
                                                <label>Type</label>
                                                <select value={widget.type} onChange={(e) => handleWidgetFieldChange(widget.id, 'type', e.target.value)}>
                                                    {PROFILE_WIDGET_TYPES.map((type) => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="profile-widget-row">
                                                <label>Title</label>
                                                <input
                                                    type="text"
                                                    value={widget.title}
                                                    onChange={(e) => handleWidgetFieldChange(widget.id, 'title', e.target.value)}
                                                    maxLength={40}
                                                />
                                            </div>
                                            {isPhotoNoteType(widget?.type) && (
                                                <div className="profile-widget-row">
                                                    <label>Image</label>
                                                    <div className="profile-widget-image-upload-container">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenWidgetImagePicker(widget.id)}
                                                            className="profile-widget-upload-button"
                                                        >
                                                            {widgetUploadingState[widget.id] ? 'Uploading...' : (widget.image_url ? 'Change image' : 'Upload image')}
                                                        </button>
                                                        {widget.image_url && (
                                                            <button
                                                                type="button"
                                                                className="profile-widget-clear-image-button"
                                                                onClick={() => handleDeleteWidgetImage(widget.id, widget.image_url)}
                                                            >
                                                                Remove
                                                            </button>
                                                        )}
                                                        <input
                                                            ref={(node) => {
                                                                if(node){
                                                                    widgetImageInputRefs.current[widget.id] = node;
                                                                } else {
                                                                    delete widgetImageInputRefs.current[widget.id];
                                                                }
                                                            }}
                                                            type="file"
                                                            accept="image/*"
                                                            style={{display: 'none'}}
                                                            onChange={(e) => handleWidgetImageUpload(widget.id, e.target.files?.[0])}
                                                        />
                                                    </div>
                                                    {widget.image_url && renderWidgetImage(widget)}
                                                </div>
                                            )}
                                            <div className="profile-widget-row is-column">
                                                <label>Note</label>
                                                <textarea
                                                    value={widget.note}
                                                    onChange={(e) => handleWidgetFieldChange(widget.id, 'note', e.target.value)}
                                                    maxLength={220}
                                                    rows={3}
                                                />
                                            </div>
                                        </>
                                    )}
                                    {widget.blocks && widget.blocks.length > 0 && (
                                        <div className="profile-widget-block-list">
                                            {widget.blocks.map((block) => (
                                                <div key={block.id} className={`profile-widget-block-editor ${selectedBlockId === block.id ? 'is-selected' : ''}`} onClick={() => setSelectedBlockId(block.id)}>
                                                    <div className="profile-widget-block-editor-header">
                                                        <span className="profile-widget-block-type-badge">{block.type}</span>
                                                        <button type="button" className="profile-widget-block-remove-btn" onClick={(e) => { e.stopPropagation(); handleRemoveBlock(widget.id, block.id); }}>x</button>
                                                    </div>
                                                    {block.type === 'text' && (
                                                        <>
                                                            <textarea value={block.content} onChange={(e) => handleBlockFieldChange(widget.id, block.id, 'content', e.target.value)} maxLength={300} rows={2} placeholder="Text content" />
                                                            <div className="profile-widget-block-color-row">
                                                                <label>BG</label>
                                                                <div className="profile-widget-block-color-swatch" style={{backgroundColor: block.bg_color || 'transparent'}} onClick={() => handleOpenBlockColorPicker(block.id)} />
                                                                {block.bg_color && (
                                                                    <button type="button" className="profile-widget-clear-image-button" onClick={() => handleBlockColorChange(widget.id, block.id, null)}>Clear</button>
                                                                )}
                                                                <input ref={(node) => { if(node) blockColorInputRefs.current[block.id] = node; else delete blockColorInputRefs.current[block.id]; }} type="color" value={block.bg_color || '#ffffff'} style={{display: 'none'}} onChange={(e) => handleBlockColorChange(widget.id, block.id, e.target.value)} />
                                                            </div>
                                                        </>
                                                    )}
                                                    {block.type === 'image' && (
                                                        <>
                                                            <input type="text" value={block.title || ''} placeholder="Title" onChange={(e) => handleBlockFieldChange(widget.id, block.id, 'title', e.target.value)} maxLength={40} />
                                                            <div className="profile-widget-image-upload-container">
                                                                <button type="button" onClick={() => handleOpenBlockImagePicker(block.id)} className="profile-widget-upload-button">
                                                                    {blockUploadingState[block.id] ? 'Uploading...' : (block.image_url ? 'Change' : 'Upload')}
                                                                </button>
                                                                {block.image_url && (
                                                                    <button type="button" className="profile-widget-clear-image-button" onClick={() => handleDeleteBlockImage(widget.id, block.id, block.image_url)}>Remove</button>
                                                                )}
                                                                <input ref={(node) => { if(node) blockImageInputRefs.current[block.id] = node; else delete blockImageInputRefs.current[block.id]; }} type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { handleBlockImageUpload(widget.id, block.id, e.target.files?.[0]); }} />
                                                            </div>
                                                            {block.image_url && renderBlockImage(widget.id, block)}
                                                            <textarea value={block.note || ''} placeholder="Note" onChange={(e) => handleBlockFieldChange(widget.id, block.id, 'note', e.target.value)} maxLength={200} rows={2} />
                                                            <div className="profile-widget-block-color-row">
                                                                <label>BG</label>
                                                                <div className="profile-widget-block-color-swatch" style={{backgroundColor: block.bg_color || 'transparent'}} onClick={() => handleOpenBlockColorPicker(block.id)} />
                                                                {block.bg_color && (
                                                                    <button type="button" className="profile-widget-clear-image-button" onClick={() => handleBlockColorChange(widget.id, block.id, null)}>Clear</button>
                                                                )}
                                                                <input ref={(node) => { if(node) blockColorInputRefs.current[block.id] = node; else delete blockColorInputRefs.current[block.id]; }} type="color" value={block.bg_color || '#ffffff'} style={{display: 'none'}} onChange={(e) => handleBlockColorChange(widget.id, block.id, e.target.value)} />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {renderWidgetCardResizeHandles(widget, true)}
                                </div>
                            ))}
                            {!showLayoutBuilder && floatingProfileWidgets.map((widget) => (
                                <div
                                    key={widget.id}
                                    data-widget-id={widget.id}
                                    className={`profile-widget-card profile-widget-size-${widget.size || 'md'} ${draggingWidgetId === widget.id ? 'is-dragging' : ''} ${editingWidgetId === widget.id ? 'is-view-editing' : ''} ${activeWidgetId === widget.id ? 'is-widget-active' : ''} ${(widgetResizeState?.widgetId === widget.id || widgetHeightResizeState?.widgetId === widget.id) ? 'is-resizing' : ''}`}
                                    style={{
                                        left: `${Number.isFinite(widget?.x) ? widget.x : 0}px`,
                                        top: `${Number.isFinite(widget?.y) ? widget.y : 0}px`,
                                        width: Number.isFinite(widget?.width) ? `${widget.width}px` : undefined,
                                        minHeight: Number.isFinite(widget?.height) ? `${widget.height}px` : undefined,
                                        backgroundColor: widget.bg_color || undefined
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveSectionId(null);
                                        setActiveWidgetId(widget.id);
                                    }}
                                    onPointerDown={(e) => handleStartWidgetContainerInteraction(e, widget.id, {requireActive: true})}
                                >
                                    <div className="profile-widget-top-actions profile-widget-view-handle">
                                        {editingWidgetId === widget.id ? (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleConfirmWidgetEdit(e, widget.id)}
                                                    className="profile-widget-confirm-button"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleCancelWidgetEdit(e, widget.id)}
                                                    className="profile-widget-cancel-button"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={(e) => handleToggleWidgetEdit(e, widget.id)}
                                                className="profile-widget-dots-button"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="M480-160q-33 0-56.5-23.5T400-240q0-33 23.5-56.5T480-320q33 0 56.5 23.5T560-240q0 33-23.5 56.5T480-160Zm0-240q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400Zm0-240q-33 0-56.5-23.5T400-720q0-33 23.5-56.5T480-800q33 0 56.5 23.5T560-720q0 33-23.5 56.5T480-640Z"/></svg>
                                            </button>
                                        )}
                                    </div>
                                    {editingWidgetId === widget.id && (
                                        <div className="profile-widget-edit-panel">
                                            <div className="profile-widget-block-toolbar">
                                                <button type="button" className="profile-widget-block-add-btn" onClick={() => handleAddBlock(widget.id, 'text')}>+ Text</button>
                                                <button type="button" className="profile-widget-block-add-btn" onClick={() => handleAddBlock(widget.id, 'image')}>+ Image</button>
                                                {(!widget.blocks || widget.blocks.length === 0) && (widget.title || widget.note || widget.image_url) && (
                                                    <button type="button" className="profile-widget-block-add-btn" onClick={() => handleConvertToBlocks(widget.id)}>Convert to blocks</button>
                                                )}
                                            </div>
                                            {(!widget.blocks || widget.blocks.length === 0) && (
                                                <>
                                                    <div className="profile-widget-row">
                                                        <label>Type</label>
                                                        <select value={widget.type} onChange={(e) => { handleWidgetFieldChange(widget.id, 'type', e.target.value); triggerAutoSave(); }}>
                                                            {PROFILE_WIDGET_TYPES.map((type) => (
                                                                <option key={type} value={type}>{type}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="profile-widget-row">
                                                        <label>Title</label>
                                                        <input type="text" value={widget.title} onChange={(e) => handleWidgetFieldChange(widget.id, 'title', e.target.value)} onBlur={() => triggerAutoSave()} maxLength={40} />
                                                    </div>
                                                    {isPhotoNoteType(widget?.type) && (
                                                        <div className="profile-widget-row">
                                                            <label>Image</label>
                                                            <div className="profile-widget-image-upload-container">
                                                                <button type="button" onClick={() => handleOpenWidgetImagePicker(widget.id)} className="profile-widget-upload-button">
                                                                    {widgetUploadingState[widget.id] ? 'Uploading...' : (widget.image_url ? 'Change' : 'Upload')}
                                                                </button>
                                                                {widget.image_url && (
                                                                    <button type="button" className="profile-widget-clear-image-button" onClick={() => handleDeleteWidgetImage(widget.id, widget.image_url)}>Remove</button>
                                                                )}
                                                                <input ref={(node) => { if(node) widgetImageInputRefs.current[widget.id] = node; else delete widgetImageInputRefs.current[widget.id]; }} type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { handleWidgetImageUpload(widget.id, e.target.files?.[0]).then(() => triggerAutoSave()); }} />
                                                            </div>
                                                            {widget.image_url && renderWidgetImage(widget)}
                                                        </div>
                                                    )}
                                                    <div className="profile-widget-row is-column">
                                                        <label>Note</label>
                                                        <textarea value={widget.note} onChange={(e) => handleWidgetFieldChange(widget.id, 'note', e.target.value)} onBlur={() => triggerAutoSave()} maxLength={220} rows={3} />
                                                    </div>
                                                </>
                                            )}
                                            {widget.blocks && widget.blocks.length > 0 && (
                                                <div className="profile-widget-block-list">
                                                    {widget.blocks.map((block) => (
                                                        <div key={block.id} className={`profile-widget-block-editor ${selectedBlockId === block.id ? 'is-selected' : ''}`} onClick={() => setSelectedBlockId(block.id)}>
                                                            <div className="profile-widget-block-editor-header">
                                                                <span className="profile-widget-block-type-badge">{block.type}</span>
                                                                <button type="button" className="profile-widget-block-remove-btn" onClick={(e) => { e.stopPropagation(); handleRemoveBlock(widget.id, block.id); }}>x</button>
                                                            </div>
                                                            {block.type === 'text' && (
                                                                <>
                                                                    <textarea value={block.content} onChange={(e) => handleBlockFieldChange(widget.id, block.id, 'content', e.target.value)} onBlur={() => triggerAutoSave()} maxLength={300} rows={2} placeholder="Text content" />
                                                                    <div className="profile-widget-block-color-row">
                                                                        <label>BG</label>
                                                                        <div className="profile-widget-block-color-swatch" style={{backgroundColor: block.bg_color || 'transparent'}} onClick={() => handleOpenBlockColorPicker(block.id)} />
                                                                        {block.bg_color && (
                                                                            <button type="button" className="profile-widget-clear-image-button" onClick={() => handleBlockColorChange(widget.id, block.id, null)}>Clear</button>
                                                                        )}
                                                                        <input ref={(node) => { if(node) blockColorInputRefs.current[block.id] = node; else delete blockColorInputRefs.current[block.id]; }} type="color" value={block.bg_color || '#ffffff'} style={{display: 'none'}} onChange={(e) => handleBlockColorChange(widget.id, block.id, e.target.value)} />
                                                                    </div>
                                                                </>
                                                            )}
                                                            {block.type === 'image' && (
                                                                <>
                                                                    <input type="text" value={block.title || ''} placeholder="Title" onChange={(e) => handleBlockFieldChange(widget.id, block.id, 'title', e.target.value)} onBlur={() => triggerAutoSave()} maxLength={40} />
                                                                    <div className="profile-widget-image-upload-container">
                                                                        <button type="button" onClick={() => handleOpenBlockImagePicker(block.id)} className="profile-widget-upload-button">
                                                                            {blockUploadingState[block.id] ? 'Uploading...' : (block.image_url ? 'Change' : 'Upload')}
                                                                        </button>
                                                                        {block.image_url && (
                                                                            <button type="button" className="profile-widget-clear-image-button" onClick={() => handleDeleteBlockImage(widget.id, block.id, block.image_url)}>Remove</button>
                                                                        )}
                                                                        <input ref={(node) => { if(node) blockImageInputRefs.current[block.id] = node; else delete blockImageInputRefs.current[block.id]; }} type="file" accept="image/*" style={{display: 'none'}} onChange={(e) => { handleBlockImageUpload(widget.id, block.id, e.target.files?.[0]).then(() => triggerAutoSave()); }} />
                                                                    </div>
                                                                    {block.image_url && renderBlockImage(widget.id, block)}
                                                                    <textarea value={block.note || ''} placeholder="Note" onChange={(e) => handleBlockFieldChange(widget.id, block.id, 'note', e.target.value)} onBlur={() => triggerAutoSave()} maxLength={200} rows={2} />
                                                                    <div className="profile-widget-block-color-row">
                                                                        <label>BG</label>
                                                                        <div className="profile-widget-block-color-swatch" style={{backgroundColor: block.bg_color || 'transparent'}} onClick={() => handleOpenBlockColorPicker(block.id)} />
                                                                        {block.bg_color && (
                                                                            <button type="button" className="profile-widget-clear-image-button" onClick={() => handleBlockColorChange(widget.id, block.id, null)}>Clear</button>
                                                                        )}
                                                                        <input ref={(node) => { if(node) blockColorInputRefs.current[block.id] = node; else delete blockColorInputRefs.current[block.id]; }} type="color" value={block.bg_color || '#ffffff'} style={{display: 'none'}} onChange={(e) => handleBlockColorChange(widget.id, block.id, e.target.value)} />
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="profile-widget-block-color-row">
                                                <label>BG</label>
                                                <div className="profile-widget-block-color-swatch" style={{backgroundColor: widget.bg_color || 'transparent'}} onClick={() => handleOpenWidgetColorPicker(widget.id)} />
                                                {widget.bg_color && (
                                                    <button type="button" className="profile-widget-clear-image-button" onClick={() => handleWidgetColorChange(widget.id, null)}>Clear</button>
                                                )}
                                                <input ref={(node) => { if(node) widgetColorInputRefs.current[widget.id] = node; else delete widgetColorInputRefs.current[widget.id]; }} type="color" value={widget.bg_color || '#ffffff'} style={{display: 'none'}} onChange={(e) => handleWidgetColorChange(widget.id, e.target.value)} />
                                            </div>
                                            <button type="button" onClick={() => { handleRemoveWidget(widget.id); setEditingWidgetId(null); triggerAutoSave(); }} className="profile-widget-remove-button">Remove widget</button>
                                        </div>
                                    )}
                                    {editingWidgetId !== widget.id && (
                                        <>
                                            {(!widget.blocks || widget.blocks.length === 0) && (
                                                <>
                                                    {widget.title && (
                                                        <p className="profile-widget-title">{widget.title}</p>
                                                    )}
                                                    {isPhotoNoteType(widget?.type) && widget.image_url && renderWidgetImage(widget)}
                                                    {widget.note && (
                                                        <p className="profile-widget-note">{widget.note}</p>
                                                    )}
                                                </>
                                            )}
                                            {widget.blocks && widget.blocks.length > 0 && (
                                                <div className="profile-widget-block-canvas" style={getWidgetBlockCanvasStyle(widget)}>
                                                    {widget.blocks.map((block) => (
                                                        <div
                                                            key={block.id}
                                                            data-block-id={block.id}
                                                            className={`profile-widget-block profile-widget-block-${block.type}${blockResizeState?.widgetId === widget.id && blockResizeState?.blockId === block.id ? ' is-resizing' : ''}`}
                                                            style={{
                                                                left: `${block.x || 0}px`,
                                                                top: `${block.y || 0}px`,
                                                                width: `${block.width || 160}px`,
                                                                minHeight: `${block.height || 40}px`,
                                                                backgroundColor: block.bg_color || 'transparent'
                                                            }}
                                                            onPointerDown={(e) => handleStartBlockDrag(e, widget.id, block.id)}
                                                        >
                                                            {renderReadOnlyBlockContent(widget.id, block)}
                                                            {renderBlockResizeHandles(widget.id, block)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {renderWidgetCardResizeHandles(widget, activeWidgetId === widget.id)}
                                </div>
                            ))}
                    </div>
    )

};

export default ProfileLayoutCanvas;

