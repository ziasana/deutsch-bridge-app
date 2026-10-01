package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelStatus;
import com.deutschbridge.backend.model.enums.WritingPhraseCategory;
import com.deutschbridge.backend.service.RedemittelPracticeService;
import com.deutschbridge.backend.service.RedemittelService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Learner access to the Redemittel module. All progress and collection data belongs to the authenticated user. */
@RestController
@RequestMapping("/api/redemittel")
public class RedemittelController {

    private final RedemittelService service;
    private final RedemittelPracticeService practiceService;

    public RedemittelController(RedemittelService service, RedemittelPracticeService practiceService) {
        this.service = service;
        this.practiceService = practiceService;
    }

    @GetMapping("/hub")
    public ResponseEntity<RedemittelHubResponse> hub() {
        return ResponseEntity.ok(service.hub());
    }

    /** `saved=true` lists only the caller's collection ("Meine Redemittel"). */
    @GetMapping
    public ResponseEntity<RedemittelPageResponse> list(
            @RequestParam(required = false) LearningLevel level,
            @RequestParam(required = false) WritingPhraseCategory category,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false) RedemittelStatus status,
            @RequestParam(required = false, defaultValue = "false") boolean saved,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        return ResponseEntity.ok(service.list(level, category, search, status, saved, page, size));
    }

    @GetMapping("/today")
    public ResponseEntity<List<RedemittelDto>> today() {
        return ResponseEntity.ok(service.today());
    }

    @GetMapping("/review")
    public ResponseEntity<RedemittelSessionResponse> review(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(practiceService.reviewSession(limit));
    }

    @GetMapping("/practice")
    public ResponseEntity<RedemittelSessionResponse> practice(@RequestParam(required = false) List<String> ids,
                                                              @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(practiceService.practiceSession(ids, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<RedemittelDto> get(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(service.get(id));
    }

    @PostMapping("/{id}/learn")
    public ResponseEntity<RedemittelDto> learn(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(service.learn(id));
    }

    @PostMapping("/{id}/save")
    public ResponseEntity<RedemittelDto> save(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(service.save(id));
    }

    @DeleteMapping("/{id}/save")
    public ResponseEntity<RedemittelDto> unsave(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(service.unsave(id));
    }

    @PostMapping("/{id}/practice")
    public ResponseEntity<RedemittelAnswerResponse> practiceAnswer(@PathVariable String id, @RequestBody RedemittelAnswerRequest body) throws DataNotFoundException {
        return ResponseEntity.ok(practiceService.practice(id, body));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<RedemittelAnswerResponse> reviewAnswer(@PathVariable String id, @RequestBody RedemittelAnswerRequest body) throws DataNotFoundException {
        return ResponseEntity.ok(practiceService.review(id, body));
    }
}
