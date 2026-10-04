package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.BlogPostDetailResponse;
import com.deutschbridge.backend.model.dto.BlogPostPageResponse;
import com.deutschbridge.backend.model.dto.BlogPostSummaryResponse;
import com.deutschbridge.backend.service.BlogPostService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Unauthenticated read-only blog API for the public home page and /blog pages - published posts only. */
@RestController
@RequestMapping("/api/public/blog")
public class PublicBlogController {

    private final BlogPostService blogPostService;

    public PublicBlogController(BlogPostService blogPostService) {
        this.blogPostService = blogPostService;
    }

    @GetMapping
    public ResponseEntity<BlogPostPageResponse> getPublished(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size,
            @RequestParam(required = false) String category
    ) {
        return ResponseEntity.ok(blogPostService.findPublished(page, size, category));
    }

    @GetMapping("/home")
    public ResponseEntity<List<BlogPostSummaryResponse>> getForHome(@RequestParam(defaultValue = "3") int size) {
        return ResponseEntity.ok(blogPostService.findForHome(size));
    }

    @GetMapping("/categories")
    public ResponseEntity<List<String>> getCategories() {
        return ResponseEntity.ok(blogPostService.findPublishedCategories());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<BlogPostDetailResponse> getBySlug(@PathVariable String slug) throws DataNotFoundException {
        return ResponseEntity.ok(blogPostService.findPublishedBySlug(slug));
    }
}
