package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AnswerFeedbackResponse;
import com.deutschbridge.backend.model.dto.AttemptResultResponse;
import com.deutschbridge.backend.model.dto.CompleteAttemptRequest;
import com.deutschbridge.backend.model.dto.StartAttemptResponse;
import com.deutschbridge.backend.model.dto.SubmitAnswerRequest;
import com.deutschbridge.backend.service.ReadingAttemptService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reading")
public class ReadingAttemptController {

    private final ReadingAttemptService readingAttemptService;

    public ReadingAttemptController(ReadingAttemptService readingAttemptService) {
        this.readingAttemptService = readingAttemptService;
    }

    @PostMapping("/{articleId}/attempts")
    public ResponseEntity<StartAttemptResponse> start(@PathVariable String articleId) throws DataNotFoundException {
        return ResponseEntity.ok(readingAttemptService.start(articleId));
    }

    @PostMapping("/attempts/{attemptId}/answers")
    public ResponseEntity<AnswerFeedbackResponse> submitAnswer(
            @PathVariable String attemptId,
            @RequestBody SubmitAnswerRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(readingAttemptService.submitAnswer(attemptId, request));
    }

    @PostMapping("/attempts/{attemptId}/complete")
    public ResponseEntity<AttemptResultResponse> complete(
            @PathVariable String attemptId,
            @RequestBody CompleteAttemptRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(readingAttemptService.complete(attemptId, request));
    }
}
