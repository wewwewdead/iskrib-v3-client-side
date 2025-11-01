// import sharp from 'sharp';
import supabase from "./supabaseClient";
const BASE_URL = import.meta.env.VITE_BACKEND_URL;

const getCroppedImage = async (imageSrc, crop, userId) => {
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
    canvas.toBlob(async(blob) => {
        if (!blob) {
            console.error("Canvas toBlob failed");
            resolve(null);
            return;
        }

        const formdata = new FormData();
        formdata.append('image', blob);
        formdata.append('userId', userId)

        try {
            const response = await fetch(`${BASE_URL}/uploadBackground`, {
                method: 'POST',
                body: formdata,
            })
            if(!response.ok){
                throw new Error('Upload failed');
            }
            const {data} = await response.json();

            const url = data;
            const file = new File([blob], 'cropped-image.jpg', {type: 'image/jpeg'});

            resolve({
                url: url,
                file: file,
            });

        } catch (error) {
            console.error('Error uploading to server:', error);
            resolve(null);
        }
        }, "image/jpeg", 0.9);
    });
};

export default getCroppedImage;