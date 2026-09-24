package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingArticlePageResponse;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
import com.deutschbridge.backend.model.dto.ReadingLevelSummaryResponse;
import com.deutschbridge.backend.model.dto.ReadingViewCountResponse;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.ReadingArticleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reading")
public class ReadingController {

    private final ReadingArticleService readingArticleService;

    public ReadingController(ReadingArticleService readingArticleService) {
        this.readingArticleService = readingArticleService;
    }

    /** One page of a single level's lightweight list (no content/tokens/annotations/quiz). page is zero-based. */
    @GetMapping
    public ResponseEntity<ReadingArticlePageResponse> getPage(
            @RequestParam LearningLevel level,
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "8") int size
    ) {
        return new ResponseEntity<>(readingArticleService.findPageWithLearningProgress(level, search, page, size), HttpStatus.OK);
    }

    /** Per-level totals and the current user's learned counts, for the level selector. */
    @GetMapping("/level-summary")
    public ResponseEntity<List<ReadingLevelSummaryResponse>> getLevelSummary() {
        return new ResponseEntity<>(readingArticleService.getLevelSummary(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReadingArticleResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(readingArticleService.findByIdWithLearningProgress(id), HttpStatus.OK);
    }

    @PostMapping("/{id}/view")
    public ResponseEntity<ReadingViewCountResponse> recordView(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(readingArticleService.recordView(id), HttpStatus.OK);
    }
}
