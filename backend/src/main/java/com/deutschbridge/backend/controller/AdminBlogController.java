package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.BlogPostAdminRow;
import com.deutschbridge.backend.model.dto.BlogPostRequest;
import com.deutschbridge.backend.model.dto.BlogPostResponse;
import com.deutschbridge.backend.model.dto.ImageUploadResponse;
import com.deutschbridge.backend.service.BlogPostService;
import com.deutschbridge.backend.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/blog")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBlogController {

    private final BlogPostService blogPostService;
    private final FileStorageService fileStorageService;

    public AdminBlogController(BlogPostService blogPostService, FileStorageService fileStorageService) {
        this.blogPostService = blogPostService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<List<BlogPostAdminRow>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        return ResponseEntity.ok(blogPostService.findAdminRows(status, search));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BlogPostResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(blogPostService.findByIdForAdmin(id));
    }

    @PostMapping(value = "/upload-image", consumes = "multipart/form-data")
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(new ImageUploadResponse(fileStorageService.storeBlogImage(file)));
    }

    @PostMapping
    public ResponseEntity<BlogPostResponse> create(@RequestBody BlogPostRequest request) {
        return ResponseEntity.ok(blogPostService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BlogPostResponse> update(@PathVariable String id, @RequestBody BlogPostRequest request)
            throws DataNotFoundException {
        return ResponseEntity.ok(blogPostService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws DataNotFoundException {
        blogPostService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
