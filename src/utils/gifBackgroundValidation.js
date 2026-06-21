// Client-side gate for GIF profile-background uploads. This is a UX convenience
// only — the server independently re-validates mimetype, size, and GIF magic
// bytes, because client accept filters are not security.

export const MAX_GIF_BYTES = 8 * 1024 * 1024; // 8 MB

export const isGifFile = (file) => {
    if (!file) return false;
    const name = typeof file.name === "string" ? file.name.toLowerCase() : "";
    return file.type === "image/gif" || name.endsWith(".gif");
};

/**
 * Validate a user-selected GIF for use as a profile background.
 * Returns { ok: true } or { ok: false, error: <friendly message> }.
 */
export const validateGifFile = (file) => {
    if (!file) {
        return { ok: false, error: "No file selected." };
    }
    if (!isGifFile(file)) {
        return { ok: false, error: "That file isn't a GIF. Choose a .gif file." };
    }
    if (typeof file.size === "number" && file.size > MAX_GIF_BYTES) {
        return { ok: false, error: "That GIF is too large. Keep it under 8 MB." };
    }
    return { ok: true };
};
