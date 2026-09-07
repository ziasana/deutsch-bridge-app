package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.SaveLexiconRequest;
import com.deutschbridge.backend.model.dto.SrsReviewRequest;
import com.deutschbridge.backend.model.dto.UserWordProgressResponse;
import com.deutschbridge.backend.service.LexiconService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lexicon")
public class LexiconController {

    private final LexiconService lexiconService;

    public LexiconController(LexiconService lexiconService) {
        this.lexiconService = lexiconService;
    }

    @GetMapping
    public ResponseEntity<List<UserWordProgressResponse>> getAll() {
        return ResponseEntity.ok(lexiconService.getAll());
    }

    @PostMapping
    public ResponseEntity<UserWordProgressResponse> save(@RequestBody SaveLexiconRequest request) {
        return ResponseEntity.ok(lexiconService.save(request));
    }

    @GetMapping("/review-queue")
    public ResponseEntity<List<UserWordProgressResponse>> getReviewQueue() {
        return ResponseEntity.ok(lexiconService.getReviewQueue());
    }

    @PostMapping("/review")
    public ResponseEntity<UserWordProgressResponse> review(@RequestBody SrsReviewRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(lexiconService.review(request));
    }
}
