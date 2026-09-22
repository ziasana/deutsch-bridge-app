package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.GrammarCategoryAdminResponse;
import com.deutschbridge.backend.model.dto.GrammarCategoryManualRequest;
import com.deutschbridge.backend.service.GrammarCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/grammar/categories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGrammarCategoryController {

    private final GrammarCategoryService grammarCategoryService;

    public AdminGrammarCategoryController(GrammarCategoryService grammarCategoryService) {
        this.grammarCategoryService = grammarCategoryService;
    }

    @GetMapping
    public ResponseEntity<List<GrammarCategoryAdminResponse>> getAll() {
        return ResponseEntity.ok(grammarCategoryService.findAllForAdmin());
    }

    @PostMapping
    public ResponseEntity<GrammarCategoryAdminResponse> create(@RequestBody GrammarCategoryManualRequest request) {
        return ResponseEntity.ok(grammarCategoryService.createCategory(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GrammarCategoryAdminResponse> update(
            @PathVariable String id,
            @RequestBody GrammarCategoryManualRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(grammarCategoryService.updateCategory(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws DataNotFoundException {
        grammarCategoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
