package com.deutschbridge.backend.service;

import com.aventrix.jnanoid.jnanoid.NanoIdUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;

/**
 * Saves admin-uploaded files (e.g. reading article images) to a directory on disk, outside the
 * app's own classpath/jar so writes at runtime are always visible - and returns the relative URL
 * they're served under (see WebMvcConfig, which maps that same directory to /uploads/**).
 */
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final Map<String, String> EXTENSION_BY_CONTENT_TYPE = Map.of(
            "image/jpeg", ".jpg",
            "image/png", ".png",
            "image/webp", ".webp"
    );

    private static final Map<String, String> AUDIO_EXTENSION_BY_CONTENT_TYPE = Map.ofEntries(
            Map.entry("audio/mpeg", ".mp3"),
            Map.entry("audio/mp3", ".mp3"),
            Map.entry("audio/mp4", ".m4a"),
            Map.entry("audio/x-m4a", ".m4a"),
            Map.entry("audio/m4a", ".m4a"),
            Map.entry("audio/wav", ".wav"),
            Map.entry("audio/x-wav", ".wav"),
            Map.entry("audio/wave", ".wav"),
            Map.entry("audio/ogg", ".ogg"),
            Map.entry("application/ogg", ".ogg")
    );

    /**
     * Browsers/OSes are unreliable about the multipart Content-Type they report for audio files
     * (e.g. some send "application/octet-stream" for .mp3/.m4a) - fall back to the filename
     * extension so a valid audio file is never rejected just because of a wrong/missing MIME type.
     */
    private static final Map<String, String> AUDIO_EXTENSION_BY_FILE_SUFFIX = Map.of(
            ".mp3", ".mp3",
            ".m4a", ".m4a",
            ".wav", ".wav",
            ".ogg", ".ogg"
    );

    private final Path uploadRoot;

    public FileStorageService(@Value("${app.upload.dir}") String uploadDir) {
        this.uploadRoot = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    public String storeReadingArticleImage(MultipartFile file) {
        return storeImage(file, "reading-articles");
    }

    public String storeExamPassageImage(MultipartFile file) {
        return storeImage(file, "exam-passages");
    }

    public String storeExamPassageAudio(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file was uploaded.");
        }

        String extension = AUDIO_EXTENSION_BY_CONTENT_TYPE.get(file.getContentType());
        if (extension == null) {
            extension = AUDIO_EXTENSION_BY_FILE_SUFFIX.get(fileSuffix(file.getOriginalFilename()));
        }
        if (extension == null) {
            throw new IllegalArgumentException("Only MP3, M4A, WAV, or OGG audio files are allowed.");
        }

        return store(file, "exam-audio", extension, "Failed to store uploaded audio.");
    }

    private String fileSuffix(String filename) {
        if (filename == null) return "";
        int dotIndex = filename.lastIndexOf('.');
        return dotIndex >= 0 ? filename.substring(dotIndex).toLowerCase() : "";
    }

    private String storeImage(MultipartFile file, String subdirName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file was uploaded.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, or WEBP images are allowed.");
        }

        return store(file, subdirName, EXTENSION_BY_CONTENT_TYPE.get(contentType), "Failed to store uploaded image.");
    }

    private String store(MultipartFile file, String subdirName, String extension, String errorMessage) {
        String filename = NanoIdUtils.randomNanoId() + extension;
        Path subdir = uploadRoot.resolve(subdirName);

        try {
            Files.createDirectories(subdir);
            file.transferTo(subdir.resolve(filename));
        } catch (IOException e) {
            throw new UncheckedIOException(errorMessage, e);
        }

        return "/uploads/" + subdirName + "/" + filename;
    }
}
