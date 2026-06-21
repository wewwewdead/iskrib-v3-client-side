// Built-in animated background presets for the GIF Creator. Pure data + small
// option maps — no DOM, no canvas. The actual per-frame drawing lives in
// renderGifBackgroundFrame.js (shared by the live preview and the encoder).

export const GIF_PRESETS = [
    {
        id: "aurora",
        name: "Aurora drift",
        description: "Soft diagonal ribbons of light",
        colors: { primary: "#0f172a", secondary: "#1e3a5f", accent: "#5eead4" },
    },
    {
        id: "floating-lights",
        name: "Floating lights",
        description: "Gentle orbs rising upward",
        colors: { primary: "#1a1033", secondary: "#3b1f5e", accent: "#f0abfc" },
    },
    {
        id: "soft-stars",
        name: "Soft stars",
        description: "Quietly twinkling night sky",
        colors: { primary: "#020617", secondary: "#0f172a", accent: "#e2e8f0" },
    },
    {
        id: "gradient-wave",
        name: "Gradient wave",
        description: "Slow rolling colour waves",
        colors: { primary: "#0c4a6e", secondary: "#155e75", accent: "#67e8f9" },
    },
    {
        id: "sparkle-dust",
        name: "Sparkle dust",
        description: "Fine drifting glitter",
        colors: { primary: "#1c1917", secondary: "#3f2d23", accent: "#fcd34d" },
    },
    {
        id: "calm-grain",
        name: "Calm grain",
        description: "Subtle living texture",
        colors: { primary: "#1f2937", secondary: "#374151", accent: "#9ca3af" },
    },
];

export const PRESET_IDS = GIF_PRESETS.map((p) => p.id);

export const getPreset = (id) => GIF_PRESETS.find((p) => p.id === id) || GIF_PRESETS[0];

// Number of full motion cycles across one (seamless) loop. Higher = faster.
export const SPEED_SETTINGS = {
    slow: { id: "slow", label: "Slow", cycles: 1 },
    normal: { id: "normal", label: "Normal", cycles: 2 },
    fast: { id: "fast", label: "Fast", cycles: 3 },
};

// Motion amplitude / particle energy multiplier (0..1).
export const MOTION_SETTINGS = {
    subtle: { id: "subtle", label: "Subtle", intensity: 0.4 },
    medium: { id: "medium", label: "Medium", intensity: 0.7 },
    lively: { id: "lively", label: "Lively", intensity: 1.0 },
};

// Output resolution + frame budget. Kept deliberately small so encoded GIFs stay
// light. Duration is held ~2.5s by deriving the per-frame delay from frameCount.
export const QUALITY_SETTINGS = {
    light: { id: "light", label: "Light", width: 480, height: 270, frameCount: 18 },
    standard: { id: "standard", label: "Standard", width: 640, height: 360, frameCount: 24 },
};

export const LOOP_DURATION_MS = 2500;

export const frameDelayFor = (frameCount) =>
    Math.max(20, Math.round(LOOP_DURATION_MS / Math.max(1, frameCount)));

export const DEFAULTS = {
    presetId: "aurora",
    speed: "normal",
    motion: "medium",
    quality: "light",
};

export const speedCycles = (speed) => (SPEED_SETTINGS[speed] || SPEED_SETTINGS.normal).cycles;
export const motionIntensity = (motion) =>
    (MOTION_SETTINGS[motion] || MOTION_SETTINGS.medium).intensity;
export const qualitySetting = (quality) => QUALITY_SETTINGS[quality] || QUALITY_SETTINGS.light;
