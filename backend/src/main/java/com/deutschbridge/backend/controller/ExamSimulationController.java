package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.examsim.ExamSimulationDtos.*;
import com.deutschbridge.backend.service.examsim.ExamSimulationOverviewService;
import com.deutschbridge.backend.service.examsim.ExamSimulationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Learner endpoints of the full exam simulation. Every attempt operation is scoped to the authenticated user; attempts of
 * other users are reported as not found. The client never sends scores, correctness, remaining time or pass/fail.
 */
@RestController
@RequestMapping("/api/exam-simulation")
public class ExamSimulationController {

    private final ExamSimulationService service;
    private final ExamSimulationOverviewService overviewService;
    private final RequestContext requestContext;

    public ExamSimulationController(ExamSimulationService service, ExamSimulationOverviewService overviewService, RequestContext requestContext) {
        this.service = service;
        this.overviewService = overviewService;
        this.requestContext = requestContext;
    }

    @GetMapping("/profiles")
    public ResponseEntity<List<ProfileOverview>> profiles() {
        return ResponseEntity.ok(overviewService.list(requestContext.getUserId()));
    }

    @GetMapping("/profiles/{profileId}")
    public ResponseEntity<ProfileOverview> profile(@PathVariable String profileId) throws DataNotFoundException {
        return ResponseEntity.ok(overviewService.get(requestContext.getUserId(), profileId));
    }

    @PostMapping("/attempts")
    public ResponseEntity<AttemptState> start(@RequestBody StartAttemptRequest request) throws DataNotFoundException {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.start(requestContext.getUserId(), request.profileId()));
    }

    @GetMapping("/attempts")
    public ResponseEntity<HistoryResponse> history() {
        return ResponseEntity.ok(service.history(requestContext.getUserId()));
    }

    @GetMapping("/attempts/{attemptId}")
    public ResponseEntity<AttemptState> state(@PathVariable String attemptId) throws DataNotFoundException {
        return ResponseEntity.ok(service.getState(requestContext.getUserId(), attemptId));
    }

    @PostMapping("/attempts/{attemptId}/resume")
    public ResponseEntity<AttemptState> resume(@PathVariable String attemptId) throws DataNotFoundException {
        return ResponseEntity.ok(service.resume(requestContext.getUserId(), attemptId));
    }

    /** Idempotent upsert of answers; safe to retry after a network failure. */
    @PutMapping("/attempts/{attemptId}/answers")
    public ResponseEntity<SaveAnswersResponse> saveAnswers(@PathVariable String attemptId, @RequestBody SaveAnswersRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(service.saveAnswers(requestContext.getUserId(), attemptId, request));
    }

    /** Counts one play of a listening clip; the client may only start the audio after this succeeds. */
    @PostMapping("/attempts/{attemptId}/parts/{partKey}/audio/{passageId}/play")
    public ResponseEntity<AudioPlayResponse> playAudio(@PathVariable String attemptId, @PathVariable String partKey, @PathVariable String passageId) throws DataNotFoundException {
        return ResponseEntity.ok(service.playAudio(requestContext.getUserId(), attemptId, partKey, passageId));
    }

    @PostMapping("/attempts/{attemptId}/sections/current/complete")
    public ResponseEntity<AttemptState> completeSection(@PathVariable String attemptId) throws DataNotFoundException {
        return ResponseEntity.ok(service.completeCurrentStage(requestContext.getUserId(), attemptId));
    }

    @PostMapping("/attempts/{attemptId}/submit")
    public ResponseEntity<ResultResponse> submit(@PathVariable String attemptId) throws DataNotFoundException {
        return ResponseEntity.ok(service.submit(requestContext.getUserId(), attemptId));
    }

    @PostMapping("/attempts/{attemptId}/cancel")
    public ResponseEntity<AttemptSummary> cancel(@PathVariable String attemptId) throws DataNotFoundException {
        return ResponseEntity.ok(service.cancel(requestContext.getUserId(), attemptId));
    }

    @GetMapping("/attempts/{attemptId}/result")
    public ResponseEntity<ResultResponse> result(@PathVariable String attemptId) throws DataNotFoundException {
        return ResponseEntity.ok(service.getResult(requestContext.getUserId(), attemptId));
    }
}
