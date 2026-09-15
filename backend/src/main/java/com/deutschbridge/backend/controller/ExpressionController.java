package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExpressionResponse;
import com.deutschbridge.backend.model.enums.ExpressionType;
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

    @GetMapping
    public ResponseEntity<List<ExpressionResponse>> getAll(@RequestParam(required = false) ExpressionType type) {
        return ResponseEntity.ok(expressionService.findAllPublished(type));
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
}
