"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { toast } from "@/lib/toast";
import { getCroppedImageBlob } from "@/lib/cropImage";

interface ImageCropUploadProps {
    /** Resolved, absolute preview src for the currently stored image (or a default/fallback), or null/undefined for no image. */
    previewSrc?: string | null;
    /** True once an image has actually been uploaded (as opposed to previewSrc showing a fallback), so "Remove" only shows when there's something to remove. */
    hasImage: boolean;
    /** width/height, e.g. 16 / 9. The crop UI locks to this ratio so every upload for this field comes out consistently sized. */
    aspectRatio: number;
    /** Uploads the cropped file and resolves with the stored relative URL (e.g. "/uploads/reading-articles/<id>.webp"). */
    onUpload: (file: File) => Promise<{ data: { url: string } }>;
    onUploaded: (url: string) => void;
    onRemove: () => void;
    accept?: string;
    previewClassName?: string;
    removeLabel?: string;
}

/**
 * Reusable "pick an image, crop it to a fixed aspect ratio, upload the crop" control for admin
 * forms (reading article covers, expression illustrations, etc). The server re-encodes whatever
 * crop it receives into its own small WebP derivatives, so this component's only job is getting
 * a consistently-framed, reasonably-sized image out of whatever the admin picked.
 */
export default function ImageCropUpload({
    previewSrc,
    hasImage,
    aspectRatio,
    onUpload,
    onUploaded,
    onRemove,
    accept = "image/jpeg,image/png,image/webp",
    previewClassName = "w-24 h-16 object-cover rounded-lg border border-gray-300 dark:border-gray-700",
    removeLabel = "Remove image",
}: Readonly<ImageCropUploadProps>) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        setSelectedImageSrc(URL.createObjectURL(file));
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
    };

    const closeCropper = useCallback(() => {
        if (selectedImageSrc) URL.revokeObjectURL(selectedImageSrc);
        setSelectedImageSrc(null);
    }, [selectedImageSrc]);

    const confirmCrop = async () => {
        if (!selectedImageSrc || !croppedAreaPixels) return;

        setIsUploading(true);
        try {
            const blob = await getCroppedImageBlob(selectedImageSrc, croppedAreaPixels);
            const file = new File([blob], "cropped-image.png", { type: "image/png" });
            const res = await onUpload(file);
            onUploaded(res.data.url);
            toast.success("Image uploaded.");
            closeCropper();
        } catch (err) {
            const message =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                "Failed to upload image.";
            toast.error(message);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-4">
                {previewSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewSrc} alt="" className={previewClassName} />
                ) : (
                    <div className={`${previewClassName} border-dashed flex items-center justify-center text-[10px] text-gray-400 text-center px-1`}>
                        No image
                    </div>
                )}
                <div className="flex flex-col gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={accept}
                        onChange={onFileSelected}
                        className="text-sm text-gray-600 dark:text-gray-300"
                    />
                    {hasImage && (
                        <button
                            type="button"
                            className="text-xs text-left underline text-gray-500 dark:text-gray-400 w-fit"
                            onClick={onRemove}
                        >
                            {removeLabel}
                        </button>
                    )}
                </div>
            </div>

            {selectedImageSrc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
                        <h2 className="text-base font-semibold text-foreground">Crop image</h2>
                        <div className="relative mt-4 h-80 w-full overflow-hidden rounded-lg bg-black/80">
                            <Cropper
                                image={selectedImageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={aspectRatio}
                                onCropChange={setCrop}
                                onZoomChange={setZoom}
                                onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                            />
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                            <span className="text-xs text-foreground/60 shrink-0">Zoom</span>
                            <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.05}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-full"
                            />
                        </div>

                        <div className="mt-5 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeCropper}
                                disabled={isUploading}
                                className="rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmCrop}
                                disabled={isUploading || !croppedAreaPixels}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                            >
                                {isUploading ? "Uploading..." : "Use this crop"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
