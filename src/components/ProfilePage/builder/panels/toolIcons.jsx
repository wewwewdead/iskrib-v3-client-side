/**
 * Small 18px tool icons for the container "tool tray" (V5 icon-only controls).
 * Each is a stroke-based SVG using currentColor, so it tints with the button.
 * Keyed by the control they represent (surface / tone / textColor / font / …).
 */
const svg = (children, fill = false) => (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={fill ? "currentColor" : "none"}
        stroke={fill ? "none" : "currentColor"}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

export const TOOL_ICONS = {
    // ── Design ──
    surface: svg(
        <>
            <rect x="3" y="7" width="13" height="13" rx="2" />
            <path d="M8 7V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
        </>
    ),
    bgColor: svg(
        <>
            <path d="M19 11 9 1 7.5 2.5 9.8 4.8 3 11.6a2 2 0 0 0 0 2.8l4.8 4.8a2 2 0 0 0 2.8 0L19 11Z" />
            <path d="M5 13h12" />
            <path d="M21 17s1.5 1.8 1.5 3a1.5 1.5 0 0 1-3 0c0-1.2 1.5-3 1.5-3Z" fill="currentColor" stroke="none" />
        </>
    ),
    tone: svg(
        <>
            <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z" />
            <path d="M12 3v17" />
            <path d="M12 20a6 6 0 0 0 6-6c0-1.4-.6-3-1.4-4.5L12 14Z" fill="currentColor" stroke="none" opacity="0.5" />
        </>
    ),
    textColor: svg(
        <>
            <path d="M7 16 11 5h2l4 11" />
            <path d="M8.5 12.5h7" />
            <rect x="5" y="19" width="14" height="2.5" rx="1" fill="currentColor" stroke="none" />
        </>
    ),
    font: svg(
        <>
            <path d="M4 7V5h16v2" />
            <path d="M9 19h6" />
            <path d="M12 5v14" />
        </>
    ),
    radius: svg(
        <>
            <path d="M5 20v-6a9 9 0 0 1 9-9h6" />
        </>
    ),
    shadow: svg(
        <>
            <rect x="3" y="3" width="13" height="13" rx="2" />
            <path d="M8 21h11a2 2 0 0 0 2-2V8" opacity="0.5" />
        </>
    ),
    border: svg(<rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />),
    padding: svg(
        <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <rect x="8" y="8" width="8" height="8" rx="1" fill="currentColor" stroke="none" opacity="0.55" />
        </>
    ),
    header: svg(
        <>
            <path d="M4 6h16" />
            <path d="M4 12h10" />
            <path d="M4 18h13" />
        </>
    ),
    titleAlign: svg(
        <>
            <path d="M4 6h16" />
            <path d="M7 12h10" />
            <path d="M5 18h14" />
        </>
    ),
    accent: svg(
        <path d="M12 3l1.9 4.6L19 9l-3.8 3.2L16 18l-4-2.6L8 18l.8-5.8L5 9l5.1-1.4L12 3Z" fill="currentColor" stroke="none" />,
        true
    ),

    // ── Content ──
    count: svg(
        <>
            <path d="M5 8h14" />
            <path d="M5 16h14" />
            <path d="M9 3 7.5 21" />
            <path d="M16.5 3 15 21" />
        </>
    ),
    source: svg(
        <>
            <path d="M4 6h16" />
            <path d="M7 12h10" />
            <path d="M10 18h4" />
        </>
    ),
    density: svg(
        <>
            <path d="M4 5h16" />
            <path d="M4 9h16" />
            <path d="M4 13h16" />
            <path d="M4 17h16" />
        </>
    ),
    imageShape: svg(
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="m4 18 5-5 4 4 3-3 4 4" />
        </>
    ),
    display: svg(
        <>
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
        </>
    ),

    // ── Design Studio (V5.1) ──
    skins: svg(
        <>
            <path d="m12 3 2.2 4.5 5 .7-3.6 3.5.85 5-4.45-2.35L7.55 16.7l.85-5L4.8 8.2l5-.7L12 3Z" />
            <path d="M5 19.5h14" />
        </>
    ),
    fill: svg(
        <>
            <path d="M19 11 9 1 7.5 2.5 9.8 4.8 3 11.6a2 2 0 0 0 0 2.8l4.8 4.8a2 2 0 0 0 2.8 0L19 11Z" />
            <path d="M5 13h12" />
            <path d="M21 17s1.5 1.8 1.5 3a1.5 1.5 0 0 1-3 0c0-1.2 1.5-3 1.5-3Z" fill="currentColor" stroke="none" />
        </>
    ),
    pattern: svg(
        <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
        </>
    ),
    title: svg(
        <>
            <path d="M4 7V5h16v2" />
            <path d="M9 19h6" />
            <path d="M12 5v14" />
        </>
    ),
    effects: svg(
        <>
            <path d="m14 6 1.2 2.6L18 9.8l-2.8 1.2L14 13.6l-1.2-2.6L10 9.8l2.8-1.2L14 6Z" fill="currentColor" stroke="none" />
            <path d="M6 14l.7 1.6L8.3 16.3l-1.6.7L6 18.6l-.7-1.6L3.7 16.3l1.6-.7L6 14Z" fill="currentColor" stroke="none" />
            <path d="M19 15l.5 1.1 1.1.5-1.1.5-.5 1.1-.5-1.1-1.1-.5 1.1-.5L19 15Z" fill="currentColor" stroke="none" />
        </>
    ),

    // ── Builder navigation tabs (desktop tool rail) ──
    presets: svg(
        <>
            <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" />
            <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" />
            <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" />
        </>
    ),
    colors: svg(
        <>
            <path d="M12 3a9 9 0 1 0 0 18c1 0 1.6-.8 1.6-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-3.9-4-7.4-9-7.4Z" />
            <circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
            <circle cx="16.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
        </>
    ),
    typography: svg(
        <>
            <path d="M6 19 11 5h2l5 14" />
            <path d="M8 13.5h8" />
        </>
    ),
    cards: svg(
        <>
            <rect x="3" y="6" width="14" height="14" rx="2" />
            <path d="M7 6V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" />
        </>
    ),
    layout: svg(
        <>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18" />
            <path d="M9 9v12" />
        </>
    ),
    sections: svg(
        <>
            <rect x="3" y="4.5" width="18" height="5" rx="1.5" />
            <rect x="3" y="14.5" width="18" height="5" rx="1.5" />
            <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
            <circle cx="7" cy="17" r="1" fill="currentColor" stroke="none" />
        </>
    ),
};
