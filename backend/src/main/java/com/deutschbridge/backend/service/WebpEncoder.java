package com.deutschbridge.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;

/**
 * Encodes an already-decoded/resized image file to WebP by shelling out to the {@code cwebp}
 * command-line tool (from Google's libwebp), rather than using a JNI-based ImageIO writer.
 *
 * <p>The JNI writer libraries (e.g. org.sejda.imageio:webp-imageio and its forks) only ship
 * prebuilt native binaries for x86_64 - they throw {@link UnsatisfiedLinkError} on Apple Silicon
 * and other ARM hosts. Shelling out avoids that entirely: each platform's own package manager
 * (Homebrew, apt, ...) builds cwebp for whatever architecture it's installed on.
 */
@Component
class WebpEncoder {

    private final String cwebpPath;

    WebpEncoder(@Value("${app.image.cwebp-path:cwebp}") String cwebpPath) {
        this.cwebpPath = cwebpPath;
    }

    /** @param quality 0.0-1.0, matching Thumbnailator's outputQuality scale. */
    void encode(Path input, Path target, float quality) throws IOException {
        int qualityPercent = Math.round(quality * 100);
        ProcessBuilder processBuilder = new ProcessBuilder(
                cwebpPath, "-quiet", "-q", String.valueOf(qualityPercent),
                input.toString(), "-o", target.toString()
        ).redirectErrorStream(true);

        Process process;
        try {
            process = processBuilder.start();
        } catch (IOException e) {
            throw new IllegalStateException(
                    "WebP encoding requires the 'cwebp' command-line tool (from the libwebp/webp "
                            + "package) to be installed and on PATH. Install it with 'brew install webp' "
                            + "(macOS) or 'apt-get install webp' (Debian/Ubuntu), or point app.image.cwebp-path "
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
            throw new IllegalStateException("Interrupted while encoding image to WebP.", e);
        }

        if (exitCode != 0) {
            throw new IllegalStateException("cwebp failed (exit " + exitCode + "): " + output.trim());
        }
    }
}
