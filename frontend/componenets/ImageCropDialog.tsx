"use client";

import { useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { getCroppedImageBlob } from "@/lib/cropImage";
import { toast } from "@/lib/toast";

interface ImageCropDialogProps {
    /** Object URL (or any loadable src) of the picked image. */
    imageSrc: string;
    /** width/height the crop box is locked to, e.g. 1 for avatars, 16 / 9 for covers. */
    aspectRatio: number;
    /** "round" shows a circular crop mask (the saved crop is still a square). */
    cropShape?: "rect" | "round";
    title?: string;
    zoomLabel?: string;
    cancelLabel?: string;
    confirmLabel?: string;
    busyLabel?: string;
    /** Receives the cropped PNG; the dialog stays in its busy state until this resolves. Throwing keeps it open. */
    onConfirm: (file: File) => Promise<void>;
    onCancel: () => void;
}

/** Shared "crop to a fixed aspect ratio" modal used by the admin image uploads and the profile photo. */
export default function ImageCropDialog({
    imageSrc,
    aspectRatio,
    cropShape = "rect",
    title = "Crop image",
    zoomLabel = "Zoom",
    cancelLabel = "Cancel",
    confirmLabel = "Use this crop",
    busyLabel = "Uploading...",
    onConfirm,
    onCancel,
}: Readonly<ImageCropDialogProps>) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [busy, setBusy] = useState(false);

    const confirm = async () => {
        if (!croppedAreaPixels) return;
        setBusy(true);
        try {
            let blob: Blob;
            try {
                blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed to crop the image.");
                return;
            }
            await onConfirm(new File([blob], "cropped-image.png", { type: "image/png" }));
        } catch {
            // The caller reports its own upload errors; just let the user retry.
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-lg rounded-2xl border border-border/60 bg-card p-6 shadow-lg">
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
                <div className="relative mt-4 h-80 w-full overflow-hidden rounded-lg bg-black/80">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        cropShape={cropShape}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
                    />
                </div>
                <div className="mt-4 flex items-center gap-3">
                    <span className="text-xs text-foreground/60 shrink-0">{zoomLabel}</span>
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
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-lg border border-border/60 bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={confirm}
                        disabled={busy || !croppedAreaPixels}
                        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
                    >
                        {busy ? busyLabel : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
