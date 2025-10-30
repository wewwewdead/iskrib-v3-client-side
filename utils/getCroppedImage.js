
const getCroppedImage = async (imageSrc, crop) => {
    if(!imageSrc || !crop){
        console.warn('getCroppedImage called without valid image source or crop data')
        return null
    }
    const image = new Image();
    image.src = imageSrc;
    
    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
    );

    // convert to dataURL and file
    return new Promise((resolve) => {
    canvas.toBlob((blob) => {
        if (!blob) {
            console.error("Canvas toBlob failed");
            resolve(null);
            return;
        }
        const url = URL.createObjectURL(blob);
        const file = new File([blob], 'cropped-image.jpg', {type: 'image/jpeg'})
        resolve({
            url,
            file,
        });
        }, "image/jpeg", 0.9);
    });
};

export default getCroppedImage;