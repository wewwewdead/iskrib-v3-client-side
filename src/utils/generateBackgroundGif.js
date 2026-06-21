import {
    qualitySetting,
    speedCycles,
    motionIntensity,
    frameDelayFor,
    getPreset,
} from "./gifBackgroundPresets.js";

/**
 * Translate the creator's UI selections (preset / colors / speed / motion /
 * quality) into the concrete encoder params the worker and frame renderer use.
 */
export const buildGenerationParams = ({ presetId, colors, speed, motion, quality }) => {
    const q = qualitySetting(quality);
    const preset = getPreset(presetId);
    return {
        presetId: preset.id,
        width: q.width,
        height: q.height,
        frameCount: q.frameCount,
        delay: frameDelayFor(q.frameCount),
        cycles: speedCycles(speed),
        intensity: motionIntensity(motion),
        colors: colors || preset.colors,
    };
};

// One lazily-created worker, reused across generations.
let worker = null;
const getWorker = () => {
    if (!worker) {
        worker = new Worker(
            new URL("../workers/gifBackgroundEncoder.worker.js", import.meta.url),
            { type: "module" }
        );
    }
    return worker;
};

let counter = 0;

/**
 * Encode an animated background GIF (+ static poster) off the main thread.
 * Returns a Promise resolving to { gifBlob, posterBlob }. `onProgress` (0..1)
 * is called per encoded frame.
 */
export const generateBackgroundGif = (opts, onProgress) => {
    const params = buildGenerationParams(opts);
    const id = `gif-${Date.now()}-${counter++}`;

    return new Promise((resolve, reject) => {
        let w;
        try {
            w = getWorker();
        } catch (error) {
            reject(error instanceof Error ? error : new Error("worker unavailable"));
            return;
        }

        const handler = (event) => {
            const msg = event.data;
            if (!msg || msg.id !== id) return;
            if (msg.type === "progress") {
                if (typeof onProgress === "function") onProgress(msg.value);
                return;
            }
            if (msg.type === "done") {
                w.removeEventListener("message", handler);
                resolve({ gifBlob: msg.gifBlob, posterBlob: msg.posterBlob });
                return;
            }
            if (msg.type === "error") {
                w.removeEventListener("message", handler);
                reject(new Error(msg.error || "GIF encoding failed"));
            }
        };

        w.addEventListener("message", handler);
        w.postMessage({ id, params });
    });
};
