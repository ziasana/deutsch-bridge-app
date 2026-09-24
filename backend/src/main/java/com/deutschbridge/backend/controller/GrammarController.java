package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.GrammarLessonResponse;
import com.deutschbridge.backend.model.dto.GrammarLevelSummaryResponse;
import com.deutschbridge.backend.model.dto.GrammarLevelViewResponse;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.GrammarCategoryService;
import com.deutschbridge.backend.service.GrammarService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grammar")
public class GrammarController {

    private final GrammarService grammarService;
    private final GrammarCategoryService grammarCategoryService;

    public GrammarController(GrammarService grammarService, GrammarCategoryService grammarCategoryService) {
        this.grammarService = grammarService;
        this.grammarCategoryService = grammarCategoryService;
    }

    /** One level's categories and uncategorized lessons as light rows (no content/quiz). */
    @GetMapping
    public ResponseEntity<GrammarLevelViewResponse> getLevelView(@RequestParam LearningLevel level) {
        return new ResponseEntity<>(grammarCategoryService.findLevelViewForLearner(level), HttpStatus.OK);
    }

    /** Per-level published totals and the current user's learned counts, for the level selector. */
    @GetMapping("/level-summary")
    public ResponseEntity<List<GrammarLevelSummaryResponse>> getLevelSummary() {
        return new ResponseEntity<>(grammarService.getLevelSummary(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GrammarLessonResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(grammarService.findByIdWithLearningProgress(id), HttpStatus.OK);
    }
}
