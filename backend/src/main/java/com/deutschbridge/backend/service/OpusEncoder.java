package com.deutschbridge.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

/**
 * Transcodes an uploaded audio file to mono Opus (in an Ogg container) by shelling out to the
 * {@code ffmpeg} command-line tool, mirroring how {@link WebpEncoder} shells out to {@code cwebp}
 * for images - same rationale: avoids JNI-based codec libraries that only ship prebuilt binaries
 * for specific architectures.
 *
 * <p>Exam listening audio is spoken word, not music, so mono at a low Opus bitrate is
 * perceptually transparent for this use case while being a fraction of the size of the original
 * upload (typically 128-320kbps stereo MP3/M4A/WAV).
 */
@Component
class OpusEncoder {

    private final String ffmpegPath;

    OpusEncoder(@Value("${app.audio.ffmpeg-path:ffmpeg}") String ffmpegPath) {
        this.ffmpegPath = ffmpegPath;
    }

    /** @param bitrateKbps target Opus VBR bitrate in kbps, e.g. 24 for spoken-word exam audio. */
    void encode(Path input, Path target, int bitrateKbps) throws IOException {
        ProcessBuilder processBuilder = new ProcessBuilder(
                ffmpegPath, "-y", "-i", input.toString(),
                "-vn", "-ac", "1", "-c:a", "libopus", "-b:a", bitrateKbps + "k", "-vbr", "on",
                target.toString()
        ).redirectErrorStream(true);

        Process process;
        try {
            process = processBuilder.start();
        } catch (IOException e) {
            throw new IllegalStateException(
                    "Audio transcoding requires the 'ffmpeg' command-line tool to be installed and "
                            + "on PATH. Install it with 'brew install ffmpeg' (macOS) or "
                            + "'apt-get install ffmpeg' (Debian/Ubuntu), or point app.audio.ffmpeg-path "
                            + "at its location.",
                    e
            );
        }

        String output;
        try (InputStream in = process.getInputStream()) {
            output = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }

        int exitCode;
        try {
            exitCode = process.waitFor();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while transcoding audio to Opus.", e);
        }

        if (exitCode != 0) {
            throw new IllegalStateException("ffmpeg failed (exit " + exitCode + "): " + output.trim());
        }
    }
}
