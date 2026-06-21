// Web Worker: encodes an animated background GIF off the main thread.
//
// The main thread posts { id, params } (see buildGenerationParams). The worker
// draws each frame to an OffscreenCanvas via the shared frame renderer, quantizes
// it, and feeds it to gifenc. It also grabs a static poster from frame 0 for the
// reduced-motion fallback. gifenc is imported dynamically so it's only fetched
// when a user actually generates a GIF. Progress is streamed back per frame.

import { renderGifBackgroundFrame } from "../utils/renderGifBackgroundFrame.js";

const makePoster = async (canvas) => {
    try {
        return await canvas.convertToBlob({ type: "image/webp", quality: 0.85 });
    } catch {
        try {
            return await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
        } catch {
            return null;
        }
    }
};

self.onmessage = async (event) => {
    const { id, params } = event.data || {};
    try {
        const { GIFEncoder, quantize, applyPalette } = await import("gifenc");
        const { presetId, width, height, frameCount, delay, colors, intensity, cycles } = params;

        const canvas = new OffscreenCanvas(width, height);
        const ctx = canvas.getContext("2d");
        const gif = GIFEncoder();
        let posterBlob = null;

        for (let i = 0; i < frameCount; i++) {
            const progress = i / frameCount;
            renderGifBackgroundFrame(ctx, {
                presetId,
                width,
                height,
                progress,
                cycles,
                intensity,
                colors,
            });

            if (i === 0) {
                posterBlob = await makePoster(canvas);
            }

            const { data } = ctx.getImageData(0, 0, width, height);
            const palette = quantize(data, 256);
            const index = applyPalette(data, palette);
            gif.writeFrame(index, width, height, { palette, delay, repeat: 0 });

            self.postMessage({ id, type: "progress", value: (i + 1) / frameCount });
        }

        gif.finish();
        const gifBlob = new Blob([gif.bytes()], { type: "image/gif" });
        self.postMessage({ id, type: "done", gifBlob, posterBlob });
    } catch (error) {
        self.postMessage({ id, type: "error", error: error?.message || "GIF encoding failed" });
    }
};
