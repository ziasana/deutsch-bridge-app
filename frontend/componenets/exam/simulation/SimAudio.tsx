"use client";

import { useState } from "react";
import { Headphones } from "lucide-react";
import AudioPlayer from "@/componenets/AudioPlayer";
import { playSimulationAudio } from "@/services/examSimulationService";
import { simulationErrorMessage } from "@/lib/examSimulation";
import { toast } from "@/lib/toast";

interface Props {
    attemptId: string;
    partKey: string;
    passageId: string;
    src: string;
    /** Plays allowed for this clip; null = unlimited (the normal audio player). */
    maxPlays: number | null;
    initialPlaysUsed: number;
    disabled: boolean;
}

/**
 * Listening clip of the exam. Without a limit it is the normal player; with a limit every play is first counted on the
 * server (so a refresh cannot give plays back), the clip plays once without replay or seeking back, and the button shows
 * the plays that remain.
 */
export default function SimAudio({ attemptId, partKey, passageId, src, maxPlays, initialPlaysUsed, disabled }: Readonly<Props>) {
    const [used, setUsed] = useState(initialPlaysUsed);
    const [playing, setPlaying] = useState(false);
    const [busy, setBusy] = useState(false);

    if (maxPlays == null) return <AudioPlayer key={src} src={src} />;

    const remaining = Math.max(0, maxPlays - used);
    const start = async () => {
        setBusy(true);
        try {
            const res = await playSimulationAudio(attemptId, partKey, passageId);
            setUsed(res.data.playsUsed);
            setPlaying(true);
        } catch (error) {
            toast.error(simulationErrorMessage(error, "Die Audiodatei kann nicht abgespielt werden."));
        } finally {
            setBusy(false);
        }
    };

    if (playing) {
        return <AudioPlayer key={`${src}-${used}`} src={src} autoPlay allowReplay={false} onEnded={() => setPlaying(false)} />;
    }
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/15">
            <p className="text-sm text-foreground/75">
                {remaining > 0
                    ? `Dieser Text wird ${maxPlays === 1 ? "einmal" : `${maxPlays}-mal`} abgespielt. Noch ${remaining} ${remaining === 1 ? "Wiedergabe" : "Wiedergaben"}.`
                    : "Dieser Text kann nicht mehr abgespielt werden."}
            </p>
            <button
                type="button"
                disabled={disabled || busy || remaining === 0}
                onClick={start}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Headphones className="size-4" aria-hidden /> {used === 0 ? "Abspielen" : "Nochmal abspielen"}
            </button>
        </div>
    );
}
