package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExpressionManualRequest;
import com.deutschbridge.backend.model.dto.ExpressionResponse;
import com.deutschbridge.backend.service.ExpressionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/expressions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExpressionController {

    private final ExpressionService expressionService;

    public AdminExpressionController(ExpressionService expressionService) {
        this.expressionService = expressionService;
    }

    @GetMapping
    public ResponseEntity<List<ExpressionResponse>> getAll() {
        return ResponseEntity.ok(expressionService.findAllForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpressionResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(expressionService.findByIdForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<ExpressionResponse> create(@RequestBody ExpressionManualRequest request) {
        return ResponseEntity.ok(expressionService.createManual(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpressionResponse> update(
            @PathVariable String id,
            @RequestBody ExpressionManualRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(expressionService.updateManual(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws DataNotFoundException {
        expressionService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
