package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.WritingAttemptRequest;
import com.deutschbridge.backend.model.dto.WritingAttemptResponse;
import com.deutschbridge.backend.model.dto.WritingProgressResponse;
import com.deutschbridge.backend.service.WritingAttemptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The learner's own submitted writing texts. */
@RestController
@RequestMapping("/api/writing/attempts")
public class WritingAttemptController {

    private final WritingAttemptService service;

    public WritingAttemptController(WritingAttemptService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<WritingAttemptResponse> submit(@RequestBody WritingAttemptRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(service.submit(request));
    }

    /** Optional AI feedback for one of the caller's attempts (counts against the AI correction limit). */
    @PostMapping("/{attemptId}/ai-feedback")
    public ResponseEntity<WritingAttemptResponse> aiFeedback(@PathVariable String attemptId) throws DataNotFoundException {
        return ResponseEntity.ok(service.requestAiFeedback(attemptId));
    }

    @GetMapping("/progress")
    public ResponseEntity<WritingProgressResponse> progress() {
        return ResponseEntity.ok(service.progress());
    }

    @GetMapping
    public ResponseEntity<List<WritingAttemptResponse>> list(@RequestParam String exerciseId) {
        return ResponseEntity.ok(service.list(exerciseId));
    }
}
