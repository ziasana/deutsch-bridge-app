"use client";

import { useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SPEEDS = [0.75, 1, 1.25, 1.5];
const BARS = [40, 70, 50, 90, 60, 100, 45, 80, 55, 95, 65, 75, 50, 85, 60, 70];

const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * Audio player for Hörverstehen clips: a big play button, an equalizer that moves while the clip plays, a seek bar,
 * replay, volume and playback speed. Built on the native <audio> element. Colours follow the surrounding theme
 * (`primary`, `--lesson-from` / `--lesson-to`). Render with `key={src}` so switching clips remounts it instead of carrying stale state.
 */
export default function AudioPlayer({ src }: Readonly<{ src: string }>) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [speed, setSpeed] = useState(1);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.paused) {
            audio.play();
        } else {
            audio.pause();
        }
    };

    const replay = () => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = 0;
        audio.play();
    };

    const seek = (value: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = value;
        setCurrentTime(value);
    };

    const changeVolume = (value: number) => {
        setVolume(value);
        if (audioRef.current) audioRef.current.volume = value;
    };

    const changeSpeed = (value: number) => {
        setSpeed(value);
        if (audioRef.current) audioRef.current.playbackRate = value;
    };

    const ratio = duration > 0 ? currentTime / duration : 0;

    return (
        <div className="space-y-3 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 ring-1 ring-primary/15">
            <audio
                ref={audioRef}
                src={src}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Pause" : "Abspielen"}
                    className={cn(
                        "flex size-14 shrink-0 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2",
                        playing && "animate-pulse",
                    )}
                >
                    {playing ? <Pause className="size-6" fill="currentColor" aria-hidden="true" /> : <Play className="size-6 translate-x-0.5" fill="currentColor" aria-hidden="true" />}
                </button>

                <div className="min-w-0 flex-1">
                    <div className="flex h-10 items-end gap-1" aria-hidden="true">
                        {BARS.map((height, i) => {
                            const reached = i / BARS.length < ratio;
                            return (
                                <span
                                    key={i}
                                    className={cn("flex-1 rounded-full transition-colors", reached ? "bg-primary" : "bg-primary/25", playing && "animate-bounce")}
                                    style={{ height: `${height}%`, animationDelay: `${(i % 6) * 90}ms`, animationDuration: "900ms" }}
                                />
                            );
                        })}
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                        <input
                            type="range"
                            min={0}
                            max={duration || 0}
                            step={0.1}
                            value={currentTime}
                            onChange={(e) => seek(Number(e.target.value))}
                            className="h-1.5 flex-1 cursor-pointer accent-[var(--primary)]"
                            aria-label="Position"
                        />
                        <span className="w-24 text-right text-xs font-semibold tabular-nums text-foreground/60">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={replay}
                    aria-label="Von vorne abspielen"
                    title="Erneut abspielen"
                    className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground/70 transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                    <RotateCcw className="size-4" aria-hidden="true" />
                </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <Volume2 className="size-4 text-foreground/50" aria-hidden="true" />
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(e) => changeVolume(Number(e.target.value))}
                        className="w-24 cursor-pointer accent-[var(--primary)]"
                        aria-label="Lautstärke"
                    />
                </div>
                <div className="flex items-center gap-1" role="group" aria-label="Tempo">
                    <span className="me-1 text-xs font-medium text-foreground/50">Tempo</span>
                    {SPEEDS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            aria-pressed={speed === s}
                            onClick={() => changeSpeed(s)}
                            className={cn(
                                "cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                                speed === s ? "bg-primary text-primary-foreground shadow-sm" : "bg-card text-foreground/60 ring-1 ring-border hover:bg-accent",
                            )}
                        >
                            {s}×
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
