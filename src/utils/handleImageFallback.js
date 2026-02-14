const DEFAULT_FALLBACK_IMAGE = "/assets/no-image.png";

export const handleImageFallback = (event, fallbackImage = DEFAULT_FALLBACK_IMAGE) => {
    const imageElement = event?.currentTarget;
    if(!imageElement){
        return;
    }

    if(imageElement.dataset.fallbackApplied === "true"){
        imageElement.style.display = "none";
        return;
    }

    imageElement.dataset.fallbackApplied = "true";
    imageElement.src = fallbackImage;
};

