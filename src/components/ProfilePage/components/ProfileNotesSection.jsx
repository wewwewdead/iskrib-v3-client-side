import React, { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../Context/useAuth";
import { updateProfileLayout } from "../../../../API/Api";
import {
    MAX_NOTES_COUNT,
    DEFAULT_NOTE_CONTAINER_STYLE,
    DEFAULT_PROFILE_LAYOUT,
} from "../../../utils/profileLayout/constants";
import NoteContainer from "./NoteContainer";
import "./notesSection.css";

const ProfileNotesSection = ({ notes: initialNotes, isOwner, userData, expandInnerContainerOnClick = false }) => {
    const [notes, setNotes] = useState(initialNotes || []);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const hasUnsavedChangesRef = useRef(false);
    const { session } = useAuth();
    const queryClient = useQueryClient();

    useEffect(() => {
        hasUnsavedChangesRef.current = hasUnsavedChanges;
    }, [hasUnsavedChanges]);

    useEffect(() => {
        if (hasUnsavedChangesRef.current) return;
        setNotes(initialNotes || []);
        setHasUnsavedChanges(false);
    }, [initialNotes]);

    const saveNotes = useCallback(
        async (updatedNotes) => {
            if (!session?.access_token || !userData) return;

            setIsSaving(true);
            try {
                const baseLayout = userData.profile_layout || DEFAULT_PROFILE_LAYOUT;
                const newLayout = {
                    ...baseLayout,
                    notes: updatedNotes,
                };
                await updateProfileLayout(session.access_token, newLayout);
                queryClient.invalidateQueries({ queryKey: ["userData"] });
                return true;
            } catch (err) {
                console.error("Failed to save notes:", err);
                return false;
            } finally {
                setIsSaving(false);
            }
        },
        [session, userData, queryClient]
    );

    const handleAddNote = () => {
        if (notes.length >= MAX_NOTES_COUNT) return;

        const newNote = {
            id: `note_${crypto.randomUUID()}`,
            order: notes.length,
            content: null,
            containerStyle: { ...DEFAULT_NOTE_CONTAINER_STYLE },
            fontColor: "#000000",
            fontFamily: "inherit",
        };

        const updatedNotes = [...notes, newNote];
        setNotes(updatedNotes);
        setHasUnsavedChanges(true);
    };

    const handleUpdateContent = useCallback(
        (noteId, content) => {
            setNotes((prev) => {
                let changed = false;
                const updated = prev.map((n) => {
                    if (n.id !== noteId) return n;
                    if (n.content === content) return n;
                    changed = true;
                    return { ...n, content };
                });
                if (changed) setHasUnsavedChanges(true);
                return updated;
            });
        },
        []
    );

    const handleUpdateStyle = useCallback(
        (noteId, styleData) => {
            setNotes((prev) => {
                const updated = prev.map((n) =>
                    n.id === noteId
                        ? {
                              ...n,
                              containerStyle: styleData.containerStyle,
                              fontColor: styleData.fontColor,
                              fontFamily: styleData.fontFamily,
                          }
                        : n
                );
                setHasUnsavedChanges(true);
                return updated;
            });
        },
        []
    );

    const handleDeleteNote = useCallback(
        async (noteId) => {
            const updated = notes
                .filter((n) => n.id !== noteId)
                .map((n, i) => ({ ...n, order: i }));

            setNotes(updated);
            const saved = await saveNotes(updated);
            setHasUnsavedChanges(!saved);
        },
        [notes, saveNotes]
    );

    const handleSaveAll = useCallback(async () => {
        const saved = await saveNotes(notes);
        if (saved) {
            setHasUnsavedChanges(false);
        }
        return saved;
    }, [notes, saveNotes]);

    const sortedNotes = [...notes].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    if (!isOwner && sortedNotes.length === 0) {
        return null;
    }

    return (
        <div className="profile-notes-section">
            {isOwner && (
                <div className="notes-actions">
                    <button
                        className="add-note-button"
                        onClick={handleAddNote}
                        disabled={notes.length >= MAX_NOTES_COUNT || isSaving}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px" fill="currentColor">
                            <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
                        </svg>
                        Add Note {notes.length > 0 && `(${notes.length}/${MAX_NOTES_COUNT})`}
                    </button>
                </div>
            )}

            {sortedNotes.length > 0 && (
                <div className="notes-list">
                    {sortedNotes.map((note, index) => (
                        <NoteContainer
                            key={note.id}
                            note={note}
                            isOwner={isOwner}
                            showHeading={index === 0}
                            expandInnerContainerOnClick={expandInnerContainerOnClick}
                            onUpdateContent={(content) => handleUpdateContent(note.id, content)}
                            onUpdateStyle={(styleData) => handleUpdateStyle(note.id, styleData)}
                            onDelete={() => handleDeleteNote(note.id)}
                            onSaveNotes={handleSaveAll}
                            hasUnsavedChanges={hasUnsavedChanges}
                            isSaving={isSaving}
                        />
                    ))}
                </div>
            )}

            {isSaving && (
                <div className="notes-saving-indicator">
                    <svg xmlns="http://www.w3.org/2000/svg" height="12px" viewBox="0 -960 960 960" width="12px" fill="currentColor">
                        <path d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z" />
                    </svg>
                    Saving...
                </div>
            )}
        </div>
    );
};

export default ProfileNotesSection;
