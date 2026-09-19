package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExpressionBulkImportResult;
import com.deutschbridge.backend.model.dto.ExpressionManualRequest;
import com.deutschbridge.backend.model.dto.ExpressionResponse;
import com.deutschbridge.backend.model.dto.ImageUploadResponse;
import com.deutschbridge.backend.service.ExpressionService;
import com.deutschbridge.backend.service.FileStorageService;
import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/expressions")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExpressionController {

    private final ExpressionService expressionService;
    private final FileStorageService fileStorageService;

    public AdminExpressionController(ExpressionService expressionService, FileStorageService fileStorageService) {
        this.expressionService = expressionService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<List<ExpressionResponse>> getAll() {
        return ResponseEntity.ok(expressionService.findAllForAdmin());
    }

    @PostMapping(value = "/upload-image", consumes = "multipart/form-data")
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(new ImageUploadResponse(fileStorageService.storeExpressionImage(file)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpressionResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(expressionService.findByIdForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<ExpressionResponse> create(@RequestBody ExpressionManualRequest request) {
        return ResponseEntity.ok(expressionService.createManual(request));
    }

    /** Best-effort bulk import - see ExpressionService.bulkImport for the per-row validation behavior. */
    @PostMapping("/bulk")
    public ResponseEntity<ExpressionBulkImportResult> bulkImport(@RequestBody List<JsonNode> rows) {
        return ResponseEntity.ok(expressionService.bulkImport(rows));
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
