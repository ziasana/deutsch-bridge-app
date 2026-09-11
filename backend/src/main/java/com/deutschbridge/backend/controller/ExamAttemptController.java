package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.CompleteExamAttemptRequest;
import com.deutschbridge.backend.model.dto.ExamAnswerFeedbackResponse;
import com.deutschbridge.backend.model.dto.ExamAttemptResultResponse;
import com.deutschbridge.backend.model.dto.StartExamAttemptResponse;
import com.deutschbridge.backend.model.dto.SubmitExamAnswerRequest;
import com.deutschbridge.backend.service.ExamAttemptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/exam")
public class ExamAttemptController {

    private final ExamAttemptService examAttemptService;

    public ExamAttemptController(ExamAttemptService examAttemptService) {
        this.examAttemptService = examAttemptService;
    }

    @PostMapping("/{exerciseId}/attempts")
    public ResponseEntity<StartExamAttemptResponse> start(@PathVariable String exerciseId) throws DataNotFoundException {
        return ResponseEntity.ok(examAttemptService.start(exerciseId));
    }

    @PostMapping("/attempts/{attemptId}/answers")
    public ResponseEntity<ExamAnswerFeedbackResponse> submitAnswer(
            @PathVariable String attemptId,
            @RequestBody SubmitExamAnswerRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(examAttemptService.submitAnswer(attemptId, request));
    }

    @PostMapping("/attempts/{attemptId}/complete")
    public ResponseEntity<ExamAttemptResultResponse> complete(
            @PathVariable String attemptId,
            @RequestBody CompleteExamAttemptRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(examAttemptService.complete(attemptId, request));
    }
}
