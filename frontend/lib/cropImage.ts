export interface PixelCrop {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** The backend re-encodes/resizes every uploaded image anyway, so there's no benefit to
 *  uploading a crop larger than this on its longest side - capping it here keeps the upload
 *  payload (and the canvas work to produce it) small even for a huge source photo. */
const MAX_OUTPUT_DIMENSION = 2000;

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Failed to load the selected image."));
        image.src = src;
    });
}

/**
 * Crops `src` to `crop` (in source-image pixels, as reported by react-easy-crop's
 * onCropComplete) and returns a PNG blob of the cropped region.
 */
export async function getCroppedImageBlob(src: string, crop: PixelCrop): Promise<Blob> {
    const image = await loadImage(src);

    const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(crop.width, crop.height));
    const outputWidth = Math.max(1, Math.round(crop.width * scale));
    const outputHeight = Math.max(1, Math.round(crop.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");

    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outputWidth, outputHeight);

    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to export the cropped image."));
        }, "image/png");
    });
}
