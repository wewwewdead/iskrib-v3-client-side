export const estimateSectionHeight = (sectionId, size) => {
    if (sectionId === "stats") {
        return size === "lg" ? 120 : size === "sm" ? 78 : 96;
    }

    if (sectionId === "bio") {
        return size === "lg" ? 118 : size === "sm" ? 74 : 96;
    }

    return size === "lg" ? 72 : size === "sm" ? 52 : 62;
};
