/**
 * Container Skins (V5.1) — one-tap design bundles.
 *
 * Each skin is a cohesive `design` patch the user can apply to a container, then
 * fine-tune. Every field is a whitelisted design property (validated server-side),
 * so a skin is just a curated starting point — no special handling on save.
 *
 * Applying a skin RESETS the container's design to defaults + the skin (so a
 * previous look never bleeds through); the builder clears the other optional
 * fields when it applies one.
 */
export const CONTAINER_SKINS = [
    {
        id: "clean",
        label: "Clean",
        swatch: "linear-gradient(135deg, #ffffff, #f3f4f6)",
        design: { surface: "solid", bgColor: "#ffffff", textColor: "#2b2b2b", radiusPx: 16, shadowStrength: 0.28, border: "none", borderWidth: 0 },
    },
    {
        id: "glass",
        label: "Frosted",
        swatch: "linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2))",
        design: { surface: "glass", blur: 24, radiusPx: 24, shadowStrength: 0.3 },
    },
    {
        id: "polaroid",
        label: "Polaroid",
        swatch: "linear-gradient(135deg, #ffffff, #ededed)",
        design: { surface: "solid", bgColor: "#ffffff", textColor: "#2a2a2a", radiusPx: 4, shadowStrength: 0.55, tilt: -3, border: "none", borderWidth: 0, paddingPx: 16 },
    },
    {
        id: "sticky",
        label: "Sticky note",
        swatch: "linear-gradient(135deg, #fff39a, #ffe86b)",
        design: { surface: "solid", bgColor: "#fff39a", textColor: "#4a4220", font: "caveat", radiusPx: 3, tilt: 2, shadowStrength: 0.32, border: "none", borderWidth: 0, titleSize: "lg" },
    },
    {
        id: "magazine",
        label: "Magazine",
        swatch: "linear-gradient(135deg, #ffffff, #efe7da)",
        design: { surface: "paper", header: "banner", font: "playfair", titleSize: "lg", titleWeight: "black", titleSpacing: "tight", accent: "amber", radiusPx: 8 },
    },
    {
        id: "terminal",
        label: "Terminal",
        swatch: "linear-gradient(135deg, #0c0f0a, #14210f)",
        design: { surface: "solid", bgColor: "#0c0f0a", textColor: "#7dff9b", font: "spaceGrotesk", radiusPx: 6, borderWidth: 1, borderStyle: "solid", borderColor: "#2f7d4a", titleCase: "upper", titleSpacing: "wide" },
    },
    {
        id: "vintage",
        label: "Vintage",
        swatch: "linear-gradient(135deg, #f3e9d2, #e6d6b3)",
        design: { surface: "solid", bgColor: "#f3e9d2", textColor: "#4a3b22", font: "garamond", fillType: "pattern", pattern: "paper", patternColor: "#9b7d4a", patternScale: "m", patternOpacity: 0.22, radiusPx: 6, shadowStrength: 0.2 },
    },
    {
        id: "neon",
        label: "Neon",
        swatch: "linear-gradient(135deg, #7c3aed, #2563eb)",
        design: { surface: "solid", fillType: "gradient", gradFrom: "#7c3aed", gradTo: "#2563eb", gradAngle: 135, textColor: "#ffffff", radiusPx: 20, glow: "#7c3aed", titleWeight: "bold", border: "none", borderWidth: 0 },
    },
    {
        id: "pastel",
        label: "Pastel",
        swatch: "linear-gradient(120deg, #ffe0ec, #e0f0ff)",
        design: { surface: "solid", fillType: "gradient", gradFrom: "#ffe0ec", gradTo: "#e0f0ff", gradAngle: 120, textColor: "#5a4a55", radiusPx: 22, shadowStrength: 0.22, border: "none", borderWidth: 0 },
    },
    {
        id: "blueprint",
        label: "Blueprint",
        swatch: "linear-gradient(135deg, #15324f, #1d4e7a)",
        design: { surface: "solid", bgColor: "#15324f", textColor: "#dce9f5", fillType: "pattern", pattern: "grid", patternColor: "#5aa0e0", patternScale: "m", patternOpacity: 0.3, radiusPx: 10, borderWidth: 1, borderStyle: "solid", borderColor: "#3a6f9e" },
    },
];
