package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.SpeakingGuideDtos.GuideResponse;
import com.deutschbridge.backend.model.dto.SpeakingGuideDtos.LearnProgress;
import com.deutschbridge.backend.model.dto.SpeakingGuideDtos.SaveRequest;
import com.deutschbridge.backend.model.dto.SpeakingGuideDtos.SaveResult;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.SpeakingLearnProgressService;
import com.deutschbridge.backend.service.examcontent.SpeakingGuideService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The "Mündlicher Ausdruck lernen" content: read-only for learners, editable (validated) for admins. */
@RestController
public class SpeakingGuideController {

    private final SpeakingGuideService service;
    private final SpeakingLearnProgressService progressService;

    public SpeakingGuideController(SpeakingGuideService service, SpeakingLearnProgressService progressService) {
        this.service = service;
        this.progressService = progressService;
    }

    @GetMapping("/api/speaking/guides")
    public ResponseEntity<List<GuideResponse>> list(@RequestParam(defaultValue = "TELC") ExamType exam, @RequestParam LearningLevel level)
            throws DataNotFoundException {
        return ResponseEntity.ok(service.list(exam, level));
    }

    @GetMapping("/api/speaking/guides/{part}")
    public ResponseEntity<GuideResponse> get(@RequestParam(defaultValue = "TELC") ExamType exam, @RequestParam LearningLevel level, @PathVariable int part)
            throws DataNotFoundException {
        return ResponseEntity.ok(service.get(exam, level, part));
    }

    @GetMapping("/api/speaking/learn-progress")
    public ResponseEntity<List<LearnProgress>> progress(@RequestParam(defaultValue = "TELC") ExamType exam, @RequestParam LearningLevel level) {
        return ResponseEntity.ok(progressService.list(exam, level));
    }

    @PutMapping("/api/speaking/learn-progress/{part}/{station}")
    public ResponseEntity<LearnProgress> saveProgress(@RequestParam(defaultValue = "TELC") ExamType exam, @RequestParam LearningLevel level,
                                                      @PathVariable int part, @PathVariable String station, @RequestBody LearnProgress body) {
        return ResponseEntity.ok(progressService.save(exam, level, part, station, body.correct(), body.total()));
    }

    @DeleteMapping("/api/speaking/learn-progress/{part}")
    public ResponseEntity<Void> resetProgress(@RequestParam(defaultValue = "TELC") ExamType exam, @RequestParam LearningLevel level, @PathVariable int part) {
        progressService.reset(exam, level, part);
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/api/admin/speaking/guides/{part}")
    public ResponseEntity<SaveResult> save(@RequestParam(defaultValue = "TELC") ExamType exam, @RequestParam LearningLevel level, @PathVariable int part,
                                         @RequestBody SaveRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(service.save(exam, level, part, request.content(), Boolean.TRUE.equals(request.dryRun())));
    }
}
