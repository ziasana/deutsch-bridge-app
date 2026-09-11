package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.dto.ExamExerciseResponse;
import com.deutschbridge.backend.model.dto.ImageUploadResponse;
import com.deutschbridge.backend.service.ExamExerciseService;
import com.deutschbridge.backend.service.FileStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/admin/exam")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamController {

    private final ExamExerciseService examExerciseService;
    private final FileStorageService fileStorageService;

    public AdminExamController(ExamExerciseService examExerciseService, FileStorageService fileStorageService) {
        this.examExerciseService = examExerciseService;
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(value = "/upload-image", consumes = "multipart/form-data")
    public ResponseEntity<ImageUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(new ImageUploadResponse(fileStorageService.storeExamPassageImage(file)));
    }

    @GetMapping
    public ResponseEntity<List<ExamExerciseResponse>> getAll() {
        return ResponseEntity.ok(examExerciseService.findAllForAdmin());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamExerciseResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(examExerciseService.getForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<ExamExerciseResponse> create(@RequestBody ExamExerciseManualRequest request) {
        return ResponseEntity.ok(examExerciseService.createManual(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamExerciseResponse> update(
            @PathVariable String id,
            @RequestBody ExamExerciseManualRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(examExerciseService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws DataNotFoundException {
        examExerciseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
