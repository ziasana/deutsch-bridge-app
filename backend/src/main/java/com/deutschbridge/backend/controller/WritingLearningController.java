package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.WritingLearningResponse;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.WritingLearningService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Read-only learner access to the "Schreiben lernen" content. */
@RestController
@RequestMapping("/api/writing")
public class WritingLearningController {

    private final WritingLearningService service;

    public WritingLearningController(WritingLearningService service) {
        this.service = service;
    }

    @GetMapping("/learn")
    public ResponseEntity<WritingLearningResponse> learn(@RequestParam LearningLevel level) {
        return ResponseEntity.ok(service.getForLevel(level));
    }
}
