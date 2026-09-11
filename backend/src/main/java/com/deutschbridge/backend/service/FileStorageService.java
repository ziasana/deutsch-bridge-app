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

    private String storeImage(MultipartFile file, String subdirName) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("No file was uploaded.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Only JPEG, PNG, or WEBP images are allowed.");
        }

        String filename = NanoIdUtils.randomNanoId() + EXTENSION_BY_CONTENT_TYPE.get(contentType);
        Path subdir = uploadRoot.resolve(subdirName);

        try {
            Files.createDirectories(subdir);
            file.transferTo(subdir.resolve(filename));
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to store uploaded image.", e);
        }

        return "/uploads/" + subdirName + "/" + filename;
    }
}
