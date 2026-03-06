const clamp01 = (value) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 0;
    return Math.min(Math.max(parsed, 0), 1);
};

export const collectParagraphAnchors = ({ root, offsetParent = root } = {}) => {
    if (!root || !offsetParent) return [];

    const offsetRect = offsetParent.getBoundingClientRect();
    const offsetScrollTop = typeof offsetParent.scrollTop === 'number' ? offsetParent.scrollTop : 0;
    const elements = Array.from(root.querySelectorAll('.editor-paragraph'));
    const anchors = [];
    let realIndex = 0;

    elements.forEach((element) => {
        const text = element.textContent?.trim();
        const rect = element.getBoundingClientRect();
        if (!text || rect.height <= 0) return;

        element.setAttribute('data-paragraph-index', String(realIndex));

        anchors.push({
            index: realIndex,
            element,
            top: rect.top - offsetRect.top + offsetScrollTop,
            height: rect.height,
            text,
            fingerprint: text.substring(0, 100),
        });

        realIndex += 1;
    });

    return anchors;
};

export const getActiveParagraphSnapshot = ({ root, container, anchorRatio = 0.25 } = {}) => {
    if (!root || !container) {
        return {
            paragraphIndex: null,
            paragraphOffset: null,
            anchors: [],
        };
    }

    const anchors = collectParagraphAnchors({ root });
    if (!anchors.length) {
        return {
            paragraphIndex: null,
            paragraphOffset: null,
            anchors,
        };
    }

    const containerRect = container.getBoundingClientRect();
    const anchorY = containerRect.top + (container.clientHeight * anchorRatio);
    let activeAnchor = anchors[0];

    anchors.forEach((anchor) => {
        if (anchor.element.getBoundingClientRect().top <= anchorY) {
            activeAnchor = anchor;
        }
    });

    const activeRect = activeAnchor.element.getBoundingClientRect();
    const paragraphOffset = activeRect.height > 0
        ? clamp01((anchorY - activeRect.top) / activeRect.height)
        : 0;

    return {
        paragraphIndex: activeAnchor.index,
        paragraphOffset: Number(paragraphOffset.toFixed(4)),
        anchors,
    };
};
