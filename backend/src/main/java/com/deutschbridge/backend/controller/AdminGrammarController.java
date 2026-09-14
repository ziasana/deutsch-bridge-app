package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.GrammarLessonManualRequest;
import com.deutschbridge.backend.model.dto.GrammarLessonResponse;
import com.deutschbridge.backend.model.dto.ImageUploadResponse;
import com.deutschbridge.backend.service.FileStorageService;
import com.deutschbridge.backend.service.GrammarService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/grammar")
@PreAuthorize("hasRole('ADMIN')")
public class AdminGrammarController {

    private final GrammarService grammarService;
    private final FileStorageService fileStorageService;

    public AdminGrammarController(GrammarService grammarService, FileStorageService fileStorageService) {
        this.grammarService = grammarService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<List<GrammarLessonResponse>> getAll() {
        return ResponseEntity.ok(grammarService.findAllForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<GrammarLessonResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(grammarService.findByIdForAdmin(id));
    }

    @PostMapping(value = "/upload-image", consumes = "multipart/form-data")
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(new ImageUploadResponse(fileStorageService.storeGrammarLessonImage(file)));
    }

    @PostMapping
    public ResponseEntity<GrammarLessonResponse> create(@RequestBody GrammarLessonManualRequest request) {
        return ResponseEntity.ok(grammarService.createManual(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GrammarLessonResponse> update(
            @PathVariable String id,
            @RequestBody GrammarLessonManualRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(grammarService.updateManual(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws DataNotFoundException {
        grammarService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
