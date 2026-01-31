const VerifiedBadge = ({ badge, size = 18 }) => {
    if (!badge) return null;

    const colors = {
        legend: {
            bg: '#FFD700',
            icon: '#FFFFFF',
            glow: 'rgba(255, 215, 0, 0.35)',
        },
        og: {
            bg: '#9B59FF',
            icon: '#FFFFFF',
            glow: 'rgba(155, 89, 255, 0.35)',
        },
    };

    const scheme = colors[badge];
    if (!scheme) return null;

    return (
        <span
            className="verified-badge"
            title={badge === 'legend' ? 'Legend' : 'OG'}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                filter: `drop-shadow(0 0 4px ${scheme.glow})`,
            }}
        >
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Starburst / shield shape */}
                <path
                    d="M12 1.5L14.09 3.64L17 2.9L17.18 5.88L19.8 7.32L18.46 10.02L19.8 12.72L17.18 14.16L17 17.14L14.09 16.4L12 18.54L9.91 16.4L7 17.14L6.82 14.16L4.2 12.72L5.54 10.02L4.2 7.32L6.82 5.88L7 2.9L9.91 3.64L12 1.5Z"
                    fill={scheme.bg}
                />
                {/* Checkmark */}
                <path
                    d="M9.5 11.5L11 13.5L15 9"
                    stroke={scheme.icon}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </span>
    );
};

export default VerifiedBadge;
