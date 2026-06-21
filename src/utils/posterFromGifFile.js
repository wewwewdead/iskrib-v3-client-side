/**
 * Build a static poster (first frame) from an uploaded GIF file. Used as the
 * reduced-motion fallback so a GIF background degrades to a still image. Draws
 * the GIF's first painted frame to a canvas and returns a JPEG Blob (or null on
 * failure — callers treat a missing poster as non-fatal).
 */
export const posterFromGifFile = (file, maxWidth = 1280) =>
    new Promise((resolve) => {
        if (!file || typeof URL === "undefined" || typeof document === "undefined") {
            resolve(null);
            return;
        }
        const url = URL.createObjectURL(file);
        const img = new Image();

        img.onload = () => {
            try {
                const naturalW = img.naturalWidth || img.width || 0;
                const naturalH = img.naturalHeight || img.height || 0;
                if (!naturalW || !naturalH) {
                    URL.revokeObjectURL(url);
                    resolve(null);
                    return;
                }
                const scale = naturalW > maxWidth ? maxWidth / naturalW : 1;
                const w = Math.max(1, Math.round(naturalW * scale));
                const h = Math.max(1, Math.round(naturalH * scale));
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                    (blob) => {
                        URL.revokeObjectURL(url);
                        resolve(blob || null);
                    },
                    "image/jpeg",
                    0.85
                );
            } catch {
                URL.revokeObjectURL(url);
                resolve(null);
            }
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(null);
        };
        img.src = url;
    });

export default posterFromGifFile;
