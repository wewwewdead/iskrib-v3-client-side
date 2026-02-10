import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import InlineNoteEditor from "./InlineNoteEditor";
import ReadOnlyNoteView from "./ReadOnlyNoteView";
import NoteStyleEditor from "./NoteStyleEditor";

const NoteContainer = ({
    note,
    isOwner,
    expandInnerContainerOnClick,
    onUpdateContent,
    onUpdateStyle,
    onDelete,
    onSaveNotes,
    hasUnsavedChanges,
    isSaving,
    showHeading,
}) => {
    const [showStyleEditor, setShowStyleEditor] = useState(false);

    const containerStyles = {
        backgroundColor: note.containerStyle?.bgColor || "rgba(255,255,255,0.15)",
        borderColor: note.containerStyle?.borderColor || "#888888",
        borderWidth: `${note.containerStyle?.borderWidth ?? 1}px`,
        borderStyle: note.containerStyle?.borderStyle || "solid",
        borderRadius: `${note.containerStyle?.borderRadius ?? 8}px`,
        color: note.fontColor || "#000000",
        fontFamily: note.fontFamily === "inherit" ? undefined : note.fontFamily,
    };

    const handleSaveStyle = (styleData) => {
        onUpdateStyle(styleData);
        setShowStyleEditor(false);
    };

    return (
        <>
            <div className="profile-note-container" style={containerStyles}>
                {showHeading && <h2 className="notes-section-heading">Notes</h2>}

                {isOwner && (
                    <div className="note-controls">
                        <button
                            className="note-control-btn"
                            onClick={() => setShowStyleEditor(true)}
                            title="Edit style"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                                <path d="M480-400q-33 0-56.5-23.5T400-480q0-33 23.5-56.5T480-560q33 0 56.5 23.5T560-480q0 33-23.5 56.5T480-400ZM320-240h320v-23q0-24-13-44t-36-30q-26-11-53.5-17t-57.5-6q-30 0-57.5 6T369-337q-23 10-36 30t-13 44v23ZM720-80H240q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80Z" />
                            </svg>
                        </button>
                        <button
                            type="button"
                            className="note-control-btn delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete();
                            }}
                            title="Delete note"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor">
                                <path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" />
                            </svg>
                        </button>
                    </div>
                )}

                {isOwner ? (
                    <InlineNoteEditor
                        initialContent={note.content}
                        onSave={onUpdateContent}
                        onExplicitSave={onSaveNotes}
                        hasUnsavedChanges={hasUnsavedChanges}
                        isSaving={isSaving}
                    />
                ) : (
                    <ReadOnlyNoteView
                        content={note.content}
                        expandInnerContainerOnClick={expandInnerContainerOnClick}
                    />
                )}
            </div>

            <AnimatePresence>
                {showStyleEditor && (
                    <NoteStyleEditor
                        containerStyle={note.containerStyle}
                        fontColor={note.fontColor}
                        fontFamily={note.fontFamily}
                        onSave={handleSaveStyle}
                        onClose={() => setShowStyleEditor(false)}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default NoteContainer;
