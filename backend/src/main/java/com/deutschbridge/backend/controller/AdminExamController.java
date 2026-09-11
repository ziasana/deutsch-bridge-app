package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExerciseManualRequest;
import com.deutschbridge.backend.model.dto.ExamExerciseResponse;
import com.deutschbridge.backend.service.ExamExerciseService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/exam")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamController {

    private final ExamExerciseService examExerciseService;

    public AdminExamController(ExamExerciseService examExerciseService) {
        this.examExerciseService = examExerciseService;
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
