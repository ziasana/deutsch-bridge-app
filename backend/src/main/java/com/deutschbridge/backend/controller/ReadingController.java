package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
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

    @GetMapping
    public ResponseEntity<List<ReadingArticleResponse>> getAll(@RequestParam(required = false) LearningLevel level) {
        List<ReadingArticleResponse> articles = level != null
                ? readingArticleService.findByLevelWithLearningProgress(level)
                : readingArticleService.findAllWithLearningProgress();
        return new ResponseEntity<>(articles, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ReadingArticleResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(readingArticleService.findByIdWithLearningProgress(id), HttpStatus.OK);
    }
}
