// Design Delight Phase 1 — section header primitive.
// eyebrow / title / subtitle / action slots. App-UI rule: headings state what
// the area is or what the user can do.
import "./iskribUi.css";

const IskribSectionHeader = ({
    eyebrow,
    title,
    subtitle,
    action,
    as: TitleTag = "h2",
    className = "",
}) => {
    return (
        <div className={`iskrib-section-header ${className}`.trim()}>
            <div className="iskrib-section-header-text">
                {eyebrow && <span className="iskrib-section-eyebrow">{eyebrow}</span>}
                {title && <TitleTag className="iskrib-section-title">{title}</TitleTag>}
                {subtitle && <p className="iskrib-section-subtitle">{subtitle}</p>}
            </div>
            {action && <div className="iskrib-section-action">{action}</div>}
        </div>
    );
};

export default IskribSectionHeader;
