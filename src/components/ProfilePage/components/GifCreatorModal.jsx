import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { BarLoader } from "react-spinners";
import "./gifCreator.css";
import {
    GIF_PRESETS,
    SPEED_SETTINGS,
    MOTION_SETTINGS,
    QUALITY_SETTINGS,
    DEFAULTS,
    getPreset,
    speedCycles,
    motionIntensity,
} from "../../../utils/gifBackgroundPresets";
import { renderGifBackgroundFrame } from "../../../utils/renderGifBackgroundFrame";
import { generateBackgroundGif } from "../../../utils/generateBackgroundGif";
import { uploadBackgroundGif } from "../../../../API/Api";
import GifBackgroundPreview from "./GifBackgroundPreview";
import usePrefersReducedMotion from "../../../hooks/usePrefersReducedMotion";

const PREVIEW_W = 480;
const PREVIEW_H = 270;
const LOOP_MS = 2500;

const COLOR_FIELDS = [
    { key: "primary", label: "Primary" },
    { key: "secondary", label: "Secondary" },
    { key: "accent", label: "Accent" },
];

const Segmented = ({ legend, value, options, onChange, disabled }) => (
    <div className="gif-creator__field">
        <span className="gif-creator__label">{legend}</span>
        <div className="gif-creator__seg" role="group" aria-label={legend}>
            {options.map((opt) => (
                <button
                    key={opt.id}
                    type="button"
                    className={`gif-creator__seg-btn${value === opt.id ? " is-active" : ""}`}
                    aria-pressed={value === opt.id}
                    disabled={disabled}
                    onClick={() => onChange(opt.id)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

const GifCreatorModal = ({ open, onClose, token, onApply }) => {
    const prefersReducedMotion = usePrefersReducedMotion();

    const [presetId, setPresetId] = useState(DEFAULTS.presetId);
    const [colors, setColors] = useState(getPreset(DEFAULTS.presetId).colors);
    const [speed, setSpeed] = useState(DEFAULTS.speed);
    const [motion, setMotion] = useState(DEFAULTS.motion);
    const [quality, setQuality] = useState(DEFAULTS.quality);

    const [isEncoding, setIsEncoding] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const [generated, setGenerated] = useState(null); // { gifBlob, posterBlob }
    const [error, setError] = useState("");

    const canvasRef = useRef(null);
    const rafRef = useRef(0);
    const busy = isEncoding || isUploading;

    // Selecting a preset resets the colour pickers to that preset's palette and
    // clears any previously generated GIF (it no longer matches the controls).
    const handlePickPreset = (id) => {
        setPresetId(id);
        setColors(getPreset(id).colors);
        setGenerated(null);
    };

    const patchColor = (key, value) => {
        setColors((prev) => ({ ...prev, [key]: value }));
        setGenerated(null);
    };

    // Live canvas preview — instant, no encoding. Animates by wall-clock time so
    // it matches the encoded loop. Honors reduced motion by drawing a still frame.
    useEffect(() => {
        if (!open) return undefined;
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const ctx = canvas.getContext("2d");
        if (!ctx) return undefined;

        const cycles = speedCycles(speed);
        const intensity = motionIntensity(motion);
        const draw = (progressValue) =>
            renderGifBackgroundFrame(ctx, {
                presetId,
                width: PREVIEW_W,
                height: PREVIEW_H,
                progress: progressValue,
                cycles,
                intensity,
                colors,
            });

        if (prefersReducedMotion) {
            draw(0);
            return undefined;
        }

        let start = null;
        const loop = (now) => {
            if (start === null) start = now;
            const progressValue = ((now - start) % LOOP_MS) / LOOP_MS;
            draw(progressValue);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, [open, presetId, colors, speed, motion, prefersReducedMotion]);

    // Reset transient state whenever the modal is closed.
    useEffect(() => {
        if (!open) {
            setIsEncoding(false);
            setIsUploading(false);
            setProgress(0);
            setGenerated(null);
            setError("");
        }
    }, [open]);

    const encode = useCallback(async () => {
        setError("");
        setIsEncoding(true);
        setProgress(0);
        try {
            const result = await generateBackgroundGif(
                { presetId, colors, speed, motion, quality },
                (value) => setProgress(value)
            );
            setGenerated(result);
            return result;
        } catch {
            setError("Couldn't create the GIF. Try a lighter quality.");
            return null;
        } finally {
            setIsEncoding(false);
        }
    }, [presetId, colors, speed, motion, quality]);

    const handleUse = useCallback(async () => {
        if (busy) return;
        const result = generated || (await encode());
        if (!result || !result.gifBlob) return;

        setIsUploading(true);
        setError("");
        try {
            const formData = new FormData();
            formData.append("gif", result.gifBlob, "background.gif");
            if (result.posterBlob) {
                formData.append("poster", result.posterBlob, "poster.webp");
            }
            const { gifUrl, posterUrl } = await uploadBackgroundGif(token, formData);
            onApply?.({
                mediaType: "gif",
                backgroundImage: `url(${gifUrl})`,
                ...(posterUrl ? { backgroundPosterImage: `url(${posterUrl})` } : {}),
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
            });
            onClose?.();
        } catch {
            setError("Couldn't save the GIF background. Please try again.");
        } finally {
            setIsUploading(false);
        }
    }, [busy, generated, encode, token, onApply, onClose]);

    if (!open) return null;

    return (
        <AnimatePresence>
            <div className="gif-creator-overlay" onClick={() => !busy && onClose?.()}>
                <Motion.div
                    className="gif-creator"
                    onClick={(e) => e.stopPropagation()}
                    initial={{ scale: 0.94, opacity: 0, y: 16 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 10 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Create a GIF background"
                >
                    <div className="gif-creator__header">
                        <h2 className="gif-creator__title">Create a motion background</h2>
                        <button
                            type="button"
                            className="gif-creator__close"
                            aria-label="Close"
                            disabled={busy}
                            onClick={() => onClose?.()}
                        >
                            ✕
                        </button>
                    </div>

                    <p className="gif-creator__hint">
                        Keep it subtle for readability. Motion plays only as a profile background.
                    </p>

                    <div className="gif-creator__preview">
                        {generated ? (
                            <GifBackgroundPreview file={generated.gifBlob} label="Generated GIF preview" />
                        ) : (
                            <canvas
                                ref={canvasRef}
                                width={PREVIEW_W}
                                height={PREVIEW_H}
                                className="gif-creator__canvas"
                                aria-label="Background preview"
                            />
                        )}
                    </div>

                    <div className="gif-creator__field">
                        <span className="gif-creator__label">Preset</span>
                        <div className="gif-creator__presets" role="group" aria-label="Preset">
                            {GIF_PRESETS.map((preset) => (
                                <button
                                    key={preset.id}
                                    type="button"
                                    className={`gif-creator__preset${presetId === preset.id ? " is-active" : ""}`}
                                    aria-pressed={presetId === preset.id}
                                    disabled={busy}
                                    onClick={() => handlePickPreset(preset.id)}
                                    title={preset.description}
                                >
                                    {preset.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="gif-creator__field">
                        <span className="gif-creator__label">Colors</span>
                        <div className="gif-creator__colors">
                            {COLOR_FIELDS.map(({ key, label }) => (
                                <label key={key} className="gif-creator__color">
                                    <input
                                        type="color"
                                        value={colors[key]}
                                        disabled={busy}
                                        onChange={(e) => patchColor(key, e.target.value)}
                                        aria-label={`${label} color`}
                                    />
                                    <span>{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <Segmented
                        legend="Speed"
                        value={speed}
                        options={Object.values(SPEED_SETTINGS)}
                        onChange={(v) => {
                            setSpeed(v);
                            setGenerated(null);
                        }}
                        disabled={busy}
                    />
                    <Segmented
                        legend="Motion strength"
                        value={motion}
                        options={Object.values(MOTION_SETTINGS)}
                        onChange={(v) => {
                            setMotion(v);
                            setGenerated(null);
                        }}
                        disabled={busy}
                    />
                    <Segmented
                        legend="Quality"
                        value={quality}
                        options={Object.values(QUALITY_SETTINGS)}
                        onChange={(v) => {
                            setQuality(v);
                            setGenerated(null);
                        }}
                        disabled={busy}
                    />

                    {error && <div className="gif-creator__error">{error}</div>}

                    {(isEncoding || isUploading) && (
                        <div className="gif-creator__progress">
                            <span>
                                {isUploading
                                    ? "Saving…"
                                    : `Encoding… ${Math.round(progress * 100)}%`}
                            </span>
                            <BarLoader width={"100%"} color="var(--accent-purple)" speedMultiplier={0.7} />
                        </div>
                    )}

                    <div className="gif-creator__actions">
                        <button
                            type="button"
                            className="gif-creator__btn gif-creator__btn--ghost"
                            disabled={busy}
                            onClick={() => onClose?.()}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="gif-creator__btn gif-creator__btn--secondary"
                            disabled={busy}
                            onClick={encode}
                        >
                            {isEncoding ? "Generating…" : generated ? "Regenerate" : "Generate"}
                        </button>
                        <button
                            type="button"
                            className="gif-creator__btn gif-creator__btn--primary"
                            disabled={busy}
                            onClick={handleUse}
                        >
                            Use as background
                        </button>
                    </div>
                </Motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GifCreatorModal;
