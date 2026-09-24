package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExpressionCollectionSummaryResponse;
import com.deutschbridge.backend.model.dto.ExpressionContinueLearningResponse;
import com.deutschbridge.backend.model.dto.ExpressionPageResponse;
import com.deutschbridge.backend.model.dto.ExpressionResponse;
import com.deutschbridge.backend.model.enums.ExpressionMasteryLevel;
import com.deutschbridge.backend.model.enums.ExpressionType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.ExpressionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Read-only for everyone - creating/editing/deleting/hiding entries is admin-only and lives in
 * AdminExpressionController (/api/admin/expressions) instead.
 */
@RestController
@RequestMapping("/api/expressions")
public class ExpressionController {

    private final ExpressionService expressionService;

    public ExpressionController(ExpressionService expressionService) {
        this.expressionService = expressionService;
    }

    /** Published count per collection (NVV/Redewendung), for the collection cards. */
    @GetMapping("/collection-summary")
    public ResponseEntity<List<ExpressionCollectionSummaryResponse>> getCollectionSummary() {
        return ResponseEntity.ok(expressionService.getCollectionSummary());
    }

    /** One page of a single collection's lightweight list (no examples/patterns/questions). page is zero-based. */
    @GetMapping
    public ResponseEntity<ExpressionPageResponse> getPage(
            @RequestParam ExpressionType type,
            @RequestParam(required = false) LearningLevel level,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false) ExpressionMasteryLevel progress,
            @RequestParam(required = false, defaultValue = "false") boolean bookmarked,
            @RequestParam(required = false, defaultValue = "recommended") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ResponseEntity.ok(expressionService.findListPage(type, level, search, progress, bookmarked, sort, page, size));
    }

    /** The current user's "Continue learning" shortlist for one collection. */
    @GetMapping("/continue-learning")
    public ResponseEntity<ExpressionContinueLearningResponse> getContinueLearning(@RequestParam ExpressionType type) {
        return ResponseEntity.ok(expressionService.getContinueLearning(type));
    }

    @GetMapping("/difficult")
    public ResponseEntity<List<ExpressionResponse>> getDifficult() {
        return ResponseEntity.ok(expressionService.findDifficultForCurrentUser());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpressionResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(expressionService.findByIdForStudent(id));
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<ExpressionResponse> markViewed(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(expressionService.markViewed(id));
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<ExpressionResponse> addBookmark(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(expressionService.addBookmark(id));
    }

    @DeleteMapping("/{id}/bookmark")
    public ResponseEntity<ExpressionResponse> removeBookmark(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(expressionService.removeBookmark(id));
    }
}
