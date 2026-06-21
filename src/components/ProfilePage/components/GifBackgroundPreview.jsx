import React, { useEffect, useState } from "react";

/**
 * Animated preview of a chosen/created GIF background. Owns the object-URL
 * lifecycle: it creates a URL.createObjectURL for the given File and revokes it
 * on change/unmount so blob URLs never leak. When given a `src` (already-uploaded
 * URL) instead of a `file`, it just renders that. The GIF is shown as a real
 * <img> so animation plays — no cropper, no canvas.
 */
const GifBackgroundPreview = ({ file, src, onRemove, label = "GIF background preview" }) => {
    const [objectUrl, setObjectUrl] = useState(null);

    useEffect(() => {
        if (!file) {
            setObjectUrl(null);
            return undefined;
        }
        const url = URL.createObjectURL(file);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    const displaySrc = objectUrl || src || null;
    if (!displaySrc) return null;

    return (
        <div className="gif-bg-preview">
            <img className="gif-bg-preview__img" src={displaySrc} alt={label} />
            {onRemove && (
                <button
                    type="button"
                    className="gif-bg-preview__remove"
                    aria-label="Remove GIF"
                    onClick={onRemove}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="20px"
                        viewBox="0 -960 960 960"
                        width="20px"
                        fill="currentColor"
                        aria-hidden="true"
                    >
                        <path d="m336-280-56-56 144-144-144-143 56-56 144 144 143-144 56 56-144 143 144 144-56 56-143-144-144 144Z" />
                    </svg>
                </button>
            )}
        </div>
    );
};

export default GifBackgroundPreview;
