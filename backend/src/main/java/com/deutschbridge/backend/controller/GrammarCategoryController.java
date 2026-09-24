package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.CategoryTestStatusResponse;
import com.deutschbridge.backend.model.dto.CategoryTestSubmitRequest;
import com.deutschbridge.backend.model.dto.GrammarCategoryResponse;
import com.deutschbridge.backend.service.GrammarCategoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/grammar/categories")
public class GrammarCategoryController {

    private final GrammarCategoryService grammarCategoryService;

    public GrammarCategoryController(GrammarCategoryService grammarCategoryService) {
        this.grammarCategoryService = grammarCategoryService;
    }

    /** One category with its published lessons (quizzes included), for the category test page. */
    @GetMapping("/{id}")
    public ResponseEntity<GrammarCategoryResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(grammarCategoryService.findByIdForLearner(id));
    }

    @PostMapping("/{id}/test-result")
    public ResponseEntity<CategoryTestStatusResponse> submitTest(
            @PathVariable String id,
            @RequestBody CategoryTestSubmitRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(grammarCategoryService.submitTest(id, request));
    }

    @PostMapping("/{id}/test-result/complete")
    public ResponseEntity<CategoryTestStatusResponse> markComplete(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(grammarCategoryService.markComplete(id));
    }
}
