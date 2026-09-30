package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingCategoryAdminResponse;
import com.deutschbridge.backend.model.dto.ReadingCategoryRequest;
import com.deutschbridge.backend.service.ReadingCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reading/categories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReadingCategoryController {

    private final ReadingCategoryService readingCategoryService;

    public AdminReadingCategoryController(ReadingCategoryService readingCategoryService) {
        this.readingCategoryService = readingCategoryService;
    }

    @GetMapping
    public ResponseEntity<List<ReadingCategoryAdminResponse>> getAll() {
        return ResponseEntity.ok(readingCategoryService.findAllForAdmin());
    }

    @PostMapping
    public ResponseEntity<ReadingCategoryAdminResponse> create(@RequestBody ReadingCategoryRequest request) {
        return ResponseEntity.ok(readingCategoryService.createCategory(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReadingCategoryAdminResponse> update(
            @PathVariable String id,
            @RequestBody ReadingCategoryRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(readingCategoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws DataNotFoundException {
        readingCategoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
