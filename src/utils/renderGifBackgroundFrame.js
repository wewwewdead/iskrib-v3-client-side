// Pure, deterministic per-frame renderer for animated GIF backgrounds.
//
// It draws one frame onto ANY Canvas 2D context — a regular <canvas> (live
// preview on the main thread) or an OffscreenCanvas (the encoder worker). It has
// NO DOM dependency and reads nothing global, so the same code produces the same
// pixels in both places. `progress` is 0..1 across one loop; motion is built
// from sin/cos of `progress * cycles * 2π` (or whole-loop wraps) so frame 0 and
// frame N line up and the GIF loops seamlessly.

const TAU = Math.PI * 2;

// Cheap deterministic [0,1) hash — used to scatter particle seeds so the layout
// is stable frame-to-frame (motion comes from `progress`, not fresh randomness).
const hash = (n) => {
    const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
};

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

const toRgb = (hex) => {
    if (typeof hex !== "string") return { r: 0, g: 0, b: 0 };
    let h = hex.trim().replace(/^#/, "");
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    if (h.length !== 6) return { r: 0, g: 0, b: 0 };
    return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
    };
};

const rgba = (hex, alpha) => {
    const { r, g, b } = toRgb(hex);
    return `rgba(${r},${g},${b},${clamp01(alpha)})`;
};

const fillLinear = (ctx, width, height, angleDeg, from, to) => {
    const angle = (angleDeg * Math.PI) / 180;
    const cx = width / 2;
    const cy = height / 2;
    const dx = (Math.cos(angle) * Math.max(width, height)) / 2;
    const dy = (Math.sin(angle) * Math.max(width, height)) / 2;
    const grad = ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
    grad.addColorStop(0, from);
    grad.addColorStop(1, to);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
};

const drawAurora = (ctx, o) => {
    const { width, height, progress, cycles, intensity, colors } = o;
    fillLinear(ctx, width, height, 135, colors.primary, colors.secondary);
    const ribbons = 3;
    for (let i = 0; i < ribbons; i++) {
        const phase = progress * cycles * TAU + i * 2.1;
        const baseY = height * (0.3 + 0.2 * i);
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        const steps = 24;
        for (let s = 0; s <= steps; s++) {
            const x = (s / steps) * width;
            const y =
                baseY +
                Math.sin(phase + (s / steps) * TAU) * height * 0.12 * intensity +
                Math.sin(phase * 0.5 + s) * height * 0.03 * intensity;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fillStyle = rgba(colors.accent, 0.12 + 0.05 * i);
        ctx.fill();
    }
};

const drawFloatingLights = (ctx, o) => {
    const { width, height, progress, intensity, colors } = o;
    fillLinear(ctx, width, height, 160, colors.primary, colors.secondary);
    const count = 14;
    for (let i = 0; i < count; i++) {
        const baseX = hash(i) * width;
        const baseY = hash(i + 99) * height;
        const r = (6 + hash(i + 7) * 22) * (0.6 + intensity * 0.8);
        // Drift up exactly one full height per loop → seamless wrap.
        const y = (baseY - progress * height + Math.sin(progress * TAU + i) * 12 * intensity) % height;
        const yy = y < 0 ? y + height : y;
        const x = baseX + Math.sin(progress * TAU + i * 1.3) * 18 * intensity;
        const grad = ctx.createRadialGradient(x, yy, 0, x, yy, r);
        grad.addColorStop(0, rgba(colors.accent, 0.35));
        grad.addColorStop(1, rgba(colors.accent, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, yy, r, 0, TAU);
        ctx.fill();
    }
};

const drawSoftStars = (ctx, o) => {
    const { width, height, progress, cycles, intensity, colors } = o;
    fillLinear(ctx, width, height, 180, colors.primary, colors.secondary);
    const count = 90;
    for (let i = 0; i < count; i++) {
        const x = hash(i) * width;
        const y = hash(i + 41) * height;
        const twinkle = 0.5 + 0.5 * Math.sin(progress * cycles * TAU + hash(i + 13) * TAU);
        const r = (0.6 + hash(i + 5) * 1.6) * (0.7 + intensity * 0.6);
        ctx.fillStyle = rgba(colors.accent, 0.15 + 0.6 * twinkle * intensity);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, TAU);
        ctx.fill();
    }
};

const drawGradientWave = (ctx, o) => {
    const { width, height, progress, cycles, intensity, colors } = o;
    const shift = Math.sin(progress * cycles * TAU) * 30 * intensity;
    fillLinear(ctx, width, height, 90 + shift, colors.primary, colors.secondary);
    const bands = 4;
    for (let i = 0; i < bands; i++) {
        const phase = progress * cycles * TAU + i * 1.4;
        const baseY = (height / bands) * i + height / (bands * 2);
        ctx.beginPath();
        ctx.moveTo(0, baseY);
        const steps = 28;
        for (let s = 0; s <= steps; s++) {
            const x = (s / steps) * width;
            const y = baseY + Math.sin(phase + (s / steps) * TAU * 1.5) * height * 0.06 * intensity;
            ctx.lineTo(x, y);
        }
        ctx.lineTo(width, baseY + height / bands);
        ctx.lineTo(0, baseY + height / bands);
        ctx.closePath();
        ctx.fillStyle = rgba(colors.accent, 0.06 + 0.03 * i);
        ctx.fill();
    }
};

const drawSparkleDust = (ctx, o) => {
    const { width, height, progress, cycles, intensity, colors } = o;
    fillLinear(ctx, width, height, 120, colors.primary, colors.secondary);
    const count = 120;
    for (let i = 0; i < count; i++) {
        const baseX = hash(i) * width;
        const baseY = hash(i + 71) * height;
        const drift = (baseY + progress * height * 0.5) % height;
        const x = baseX + Math.sin(progress * cycles * TAU + i) * 10 * intensity;
        const sparkle = 0.5 + 0.5 * Math.sin(progress * cycles * TAU * 2 + hash(i + 3) * TAU);
        const r = (0.4 + hash(i + 9) * 1.2) * (0.6 + intensity);
        ctx.fillStyle = rgba(colors.accent, 0.1 + 0.7 * sparkle * intensity);
        ctx.beginPath();
        ctx.arc(x, drift, r, 0, TAU);
        ctx.fill();
    }
};

const drawCalmGrain = (ctx, o) => {
    const { width, height, progress, intensity, colors } = o;
    fillLinear(ctx, width, height, 135, colors.primary, colors.secondary);
    // Coarse moving "grain" — a sparse grid of low-opacity dots that slides a
    // little each frame, returning to start at progress 1 (seamless).
    const cols = 48;
    const rows = 27;
    const cw = width / cols;
    const ch = height / rows;
    const offset = progress * TAU;
    for (let cxi = 0; cxi < cols; cxi++) {
        for (let cyi = 0; cyi < rows; cyi++) {
            const seed = hash(cxi * 31 + cyi * 7);
            const flick = 0.5 + 0.5 * Math.sin(offset + seed * TAU);
            const a = (0.015 + 0.05 * flick) * (0.5 + intensity);
            ctx.fillStyle = rgba(colors.accent, a);
            ctx.fillRect(cxi * cw, cyi * ch, cw * 0.7, ch * 0.7);
        }
    }
};

const RENDERERS = {
    aurora: drawAurora,
    "floating-lights": drawFloatingLights,
    "soft-stars": drawSoftStars,
    "gradient-wave": drawGradientWave,
    "sparkle-dust": drawSparkleDust,
    "calm-grain": drawCalmGrain,
};

/**
 * Draw a single animated-background frame.
 *
 * @param {CanvasRenderingContext2D} ctx - target 2D context (canvas or offscreen)
 * @param {object} opts
 * @param {string} opts.presetId
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {number} opts.progress - 0..1 position within the loop
 * @param {number} [opts.cycles=2] - full motion cycles per loop
 * @param {number} [opts.intensity=0.7] - 0..1 motion amplitude
 * @param {{primary:string,secondary:string,accent:string}} opts.colors
 */
export const renderGifBackgroundFrame = (ctx, opts) => {
    const {
        presetId,
        width,
        height,
        progress = 0,
        cycles = 2,
        intensity = 0.7,
        colors,
    } = opts || {};
    const renderer = RENDERERS[presetId] || drawAurora;
    const safeColors = {
        primary: (colors && colors.primary) || "#0f172a",
        secondary: (colors && colors.secondary) || "#1e293b",
        accent: (colors && colors.accent) || "#5eead4",
    };
    renderer(ctx, {
        width,
        height,
        progress: clamp01(progress),
        cycles,
        intensity: clamp01(intensity),
        colors: safeColors,
    });
};

export default renderGifBackgroundFrame;
