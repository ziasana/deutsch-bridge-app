"use client";

import { useRef, useState } from "react";

const SPEEDS = [0.75, 1, 1.25, 1.5];

const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
};

/**
 * Reusable audio player for Hoerverstehen listening clips - play/pause, replay, seek progress,
 * volume, and playback speed. Built on the native <audio> element (no external dependency),
 * intended to be reused for future Hoeren Teil 2-4. Render with `key={src}` at the call site so
 * switching to a different clip remounts this component instead of carrying over stale state.
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

    return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3 space-y-2">
            <audio
                ref={audioRef}
                src={src}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            />

            <div className="flex items-center gap-3">
                <button
                    type="button"
                    onClick={togglePlay}
                    aria-label={playing ? "Pause" : "Abspielen"}
                    className="w-9 h-9 shrink-0 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center"
                >
                    {playing ? "❚❚" : "▶"}
                </button>
                <button
                    type="button"
                    onClick={replay}
                    aria-label="Von vorne abspielen"
                    className="w-9 h-9 shrink-0 rounded-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 flex items-center justify-center"
                    title="Erneut abspielen"
                >
                    ⟲
                </button>

                <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="flex-1 accent-blue-600"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 tabular-nums w-20 text-right">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </span>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">🔊</span>
                    <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.05}
                        value={volume}
                        onChange={(e) => changeVolume(Number(e.target.value))}
                        className="w-20 accent-blue-600"
                        aria-label="Lautstärke"
                    />
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Tempo:</span>
                    {SPEEDS.map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => changeSpeed(s)}
                            className={`text-xs px-2 py-1 rounded ${
                                speed === s
                                    ? "bg-blue-600 text-white"
                                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
                            }`}
                        >
                            {s}×
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
