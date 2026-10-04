package com.deutschbridge.backend.service;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Set;

/**
 * Saves admin-uploaded files (e.g. reading article images) to a directory on disk, outside the
 * app's own classpath/jar so writes at runtime are always visible - and returns the relative URL
 * they're served under (see WebMvcConfig, which maps that same directory to /uploads/**).
 *
 * <p>Most images are expected to already be cropped client-side to their intended aspect ratio
 * (see the frontend's reusable ImageCropUpload component); this service then re-encodes each
 * cropped image to WebP at a purpose-appropriate size and discards the original upload. Callers
 * that need both a small list thumbnail and a larger detail/hero image ask the admin to crop and
 * upload each separately (see storeXThumbnail vs storeXImage) - each crop can frame its subject
 * differently for its own aspect ratio, rather than one crop being resized to serve both.
 * storeExamPassageImage is the one exception: no crop, no resize, just WebP re-encoding for
 * compression, since exam passage images are shown at whatever dimensions the admin uploaded.
 */
@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private static final String IMAGE_OUTPUT_EXTENSION = ".webp";
    private static final int DETAIL_MAX_WIDTH = 1400;
    private static final int THUMBNAIL_MAX_WIDTH = 480;
    /** Avatars are shown at most ~100px (2x for retina), so a 512px square is plenty. */
    private static final int AVATAR_MAX_WIDTH = 512;
    private static final float DETAIL_QUALITY = 0.82f;
    private static final float THUMBNAIL_QUALITY = 0.75f;
    /** For images that must keep their original width/height (no crop, no resize) - only the WebP re-encode compresses them. */
    private static final int PRESERVE_DIMENSIONS = Integer.MAX_VALUE;

    private static final String AUDIO_OUTPUT_EXTENSION = ".ogg";
    private static final int AUDIO_BITRATE_KBPS = 24;

    private static final Set<String> ALLOWED_AUDIO_CONTENT_TYPES = Set.of(
            "audio/mpeg", "audio/mp3", "audio/mp4", "audio/x-m4a", "audio/m4a",
            "audio/wav", "audio/x-wav", "audio/wave", "audio/ogg", "application/ogg"
    );

    /**
     * Browsers/OSes are unreliable about the multipart Content-Type they report for audio files
     * (e.g. some send "application/octet-stream" for .mp3/.m4a) - fall back to the filename
     * extension so a valid audio file is never rejected just because of a wrong/missing MIME type.
     */
    private static final Set<String> ALLOWED_AUDIO_FILE_SUFFIXES = Set.of(".mp3", ".m4a", ".wav", ".ogg");

    private final Path uploadRoot;
    private final WebpEncoder webpEncoder;
    private final OpusEncoder opusEncoder;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir, WebpEncoder webpEncoder,
                               OpusEncoder opusEncoder) {
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
        this.webpEncoder = webpEncoder;
        this.opusEncoder = opusEncoder;
    }

    public String storeReadingArticleImage(MultipartFile file) {
        return storeImage(file, "reading-articles", DETAIL_MAX_WIDTH, DETAIL_QUALITY);
    }

    public String storeReadingArticleThumbnail(MultipartFile file) {
        return storeImage(file, "reading-articles", THUMBNAIL_MAX_WIDTH, THUMBNAIL_QUALITY);
    }

    /** No crop/resize - exam passage images are shown at their original dimensions, just compressed to WebP. */
    public String storeExamPassageImage(MultipartFile file) {
        return storeImage(file, "exam-passages", PRESERVE_DIMENSIONS, DETAIL_QUALITY);
    }

    public String storeGrammarLessonImage(MultipartFile file) {
        return storeImage(file, "grammar-lessons", DETAIL_MAX_WIDTH, DETAIL_QUALITY);
    }

    public String storeExpressionImage(MultipartFile file) {
        return storeImage(file, "expressions", DETAIL_MAX_WIDTH, DETAIL_QUALITY);
    }

    public String storeExpressionThumbnail(MultipartFile file) {
        return storeImage(file, "expressions", THUMBNAIL_MAX_WIDTH, THUMBNAIL_QUALITY);
    }

    public String storeUserAvatar(MultipartFile file) {
        return storeImage(file, "avatars", AVATAR_MAX_WIDTH, THUMBNAIL_QUALITY);
    }

    /**
     * Transcodes an admin-uploaded audio file (any of MP3/M4A/WAV/OGG, typically 128-320kbps
     * stereo) to mono Opus at {@link #AUDIO_BITRATE_KBPS}kbps, discarding the original bytes -
     * same "re-encode and discard the original" approach as storeImage(), since exam listening
     * audio is spoken word and a low Opus bitrate is perceptually transparent for that while
     * being a fraction of the size.
     */
    public String storeExamPassageAudio(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file was uploaded.");
        }

        String contentType = file.getContentType();
        boolean allowed = (contentType != null && ALLOWED_AUDIO_CONTENT_TYPES.contains(contentType))
                || ALLOWED_AUDIO_FILE_SUFFIXES.contains(fileSuffix(file.getOriginalFilename()));
        if (!allowed) {
            throw new IllegalArgumentException("Only MP3, M4A, WAV, or OGG audio files are allowed.");
        }

        String subdirName = "exam-audio";
        String filename = NanoIdUtils.randomNanoId() + AUDIO_OUTPUT_EXTENSION;
        Path subdir = uploadRoot.resolve(subdirName);
        Path tempUpload = null;

        try {
            Files.createDirectories(subdir);
            tempUpload = Files.createTempFile("audio-upload-", fileSuffix(file.getOriginalFilename()));
            file.transferTo(tempUpload);
            opusEncoder.encode(tempUpload, subdir.resolve(filename), AUDIO_BITRATE_KBPS);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store uploaded audio.", e);
        } finally {
            if (tempUpload != null) {
                try {
                    Files.deleteIfExists(tempUpload);
                } catch (IOException e) {
                    log.warn("Failed to delete temporary audio upload {}", tempUpload, e);
                }
            }
        }

        return "/uploads/" + subdirName + "/" + filename;
    }

    private String fileSuffix(String filename) {
        if (filename == null) return "";
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex).toLowerCase() : "";
    }

    /**
     * Re-encodes an admin-uploaded image (already cropped client-side to its intended aspect
     * ratio) to WebP at {@code maxWidth}/{@code quality}, discarding the original bytes, and
     * returns its "/uploads/..." URL.
     */
    private String storeImage(MultipartFile file, String subdirName, int maxWidth, float quality) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file was uploaded.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, or WEBP images are allowed.");
        }

        BufferedImage image;
        try (InputStream in = file.getInputStream()) {
            image = ImageIO.read(in);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to read uploaded image.", e);
        }
        if (image == null) {
            throw new IllegalArgumentException("The uploaded file is not a readable image.");
        }

        String filename = NanoIdUtils.randomNanoId() + IMAGE_OUTPUT_EXTENSION;
        Path subdir = uploadRoot.resolve(subdirName);

        try {
            Files.createDirectories(subdir);
            writeResized(image, subdir.resolve(filename), maxWidth, quality);
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store uploaded image.", e);
        }

        return "/uploads/" + subdirName + "/" + filename;
    }

    /**
     * Resizes (never upscales) {@code source} to {@code maxWidth} with Thumbnailator, then hands
     * the result to {@link WebpEncoder} to encode as WebP at {@code target}. Resizing happens
     * here, in pure Java, rather than via cwebp's own {@code -resize} flag, specifically so this
     * method already knows the source's dimensions and never asks cwebp to upscale a small image.
     */
    private void writeResized(BufferedImage source, Path target, int maxWidth, float quality) throws IOException {
        int targetWidth = Math.min(maxWidth, source.getWidth());
        Path tempPng = Files.createTempFile("upload-resized-", ".png");
        try {
            Thumbnails.of(source).width(targetWidth).outputFormat("png").toFile(tempPng.toFile());
            webpEncoder.encode(tempPng, target, quality);
        } finally {
            Files.deleteIfExists(tempPng);
        }
    }

    /**
     * Deletes a previously stored file given its "/uploads/&lt;subdir&gt;/&lt;name&gt;" URL (as
     * returned by storeImage()/storeExamPassageAudio()), e.g. when an admin replaces or removes an
     * image or thumbnail. Silently no-ops for URLs that aren't ours (null/blank, or an external link an
     * admin pasted some other way) instead of throwing, since a missing/foreign file is not
     * itself an error for the caller. Callers that track an image and a separate thumbnail (e.g.
     * ReadingArticle.imageUrl/thumbnailUrl) must call this once per URL - the two are independent
     * uploads now, not a derived pair.
     */
    public void deleteFile(String relativeUrl) {
        if (relativeUrl == null || relativeUrl.isBlank() || !relativeUrl.startsWith("/uploads/")) return;

        Path path = uploadRoot.resolve(relativeUrl.substring("/uploads/".length())).normalize();
        if (!path.startsWith(uploadRoot)) {
            log.warn("Refusing to delete file outside the upload root: {}", relativeUrl);
            return;
        }

        try {
            Files.deleteIfExists(path);
        } catch (IOException e) {
            log.warn("Failed to delete old file {}", relativeUrl, e);
        }
    }
}
