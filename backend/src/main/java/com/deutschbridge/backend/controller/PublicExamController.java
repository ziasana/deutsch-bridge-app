package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.PublicExamCount;
import com.deutschbridge.backend.repository.ExamExerciseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Unauthenticated, read-only exercise counts for the public exam pages (/exams/telc, /exams/dtz). */
@RestController
@RequestMapping("/api/public/exam")
public class PublicExamController {

    private final ExamExerciseRepository repository;

    public PublicExamController(ExamExerciseRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/overview")
    public ResponseEntity<List<PublicExamCount>> overview() {
        return ResponseEntity.ok(repository.countPublishedByExamLevelSection());
    }
}
