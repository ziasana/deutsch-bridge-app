package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExerciseLastTimeResponse;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionCompleteRequest;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionResponse;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionResultResponse;
import com.deutschbridge.backend.model.dto.ExamPracticeSessionStartRequest;
import com.deutschbridge.backend.model.dto.ExamTimeManagementRowResponse;
import com.deutschbridge.backend.model.dto.ExamTimeWeekSummaryResponse;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.ExamPracticeSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam/practice-sessions")
public class ExamPracticeSessionController {

    private final ExamPracticeSessionService service;

    public ExamPracticeSessionController(ExamPracticeSessionService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<ExamPracticeSessionResponse> start(@RequestBody ExamPracticeSessionStartRequest request)
            throws DataNotFoundException {
        return ResponseEntity.ok(service.start(request));
    }

    @PostMapping("/{id}/complete")
    public ResponseEntity<ExamPracticeSessionResultResponse> complete(
            @PathVariable String id,
            @RequestBody(required = false) ExamPracticeSessionCompleteRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(service.complete(id, request));
    }

    @GetMapping("/week-summary")
    public ResponseEntity<ExamTimeWeekSummaryResponse> weekSummary() {
        return ResponseEntity.ok(service.weekSummary());
    }

    @GetMapping("/time-management")
    public ResponseEntity<List<ExamTimeManagementRowResponse>> timeManagement(@RequestParam LearningLevel level) {
        return ResponseEntity.ok(service.timeManagement(level));
    }

    @GetMapping("/last-times")
    public ResponseEntity<List<ExamExerciseLastTimeResponse>> lastTimes(@RequestParam ExamSection section,
                                                                        @RequestParam LearningLevel level) {
        return ResponseEntity.ok(service.lastTimes(section, level));
    }
}
