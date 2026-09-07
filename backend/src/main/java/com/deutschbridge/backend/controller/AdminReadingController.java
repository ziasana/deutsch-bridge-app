package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.GenerateQuizRequest;
import com.deutschbridge.backend.model.dto.ReadingArticleGenerateRequest;
import com.deutschbridge.backend.model.dto.ReadingArticleManualRequest;
import com.deutschbridge.backend.model.dto.ReadingArticleResponse;
import com.deutschbridge.backend.model.dto.SuggestAnnotationsRequest;
import com.deutschbridge.backend.model.dto.SuggestVocabularyRequest;
import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.entity.KeyVocabularyItem;
import com.deutschbridge.backend.model.entity.ReadingQuizQuestion;
import com.deutschbridge.backend.service.ReadingArticleService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reading")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReadingController {

    private final ReadingArticleService readingArticleService;

    public AdminReadingController(ReadingArticleService readingArticleService) {
        this.readingArticleService = readingArticleService;
    }

    @PostMapping("/generate")
    public ResponseEntity<ReadingArticleResponse> generate(@RequestBody ReadingArticleGenerateRequest request) {
        return ResponseEntity.ok(readingArticleService.generate(request.topic(), request.level()));
    }

    @PostMapping("/suggest-vocabulary")
    public ResponseEntity<List<KeyVocabularyItem>> suggestVocabulary(@RequestBody SuggestVocabularyRequest request) {
        return ResponseEntity.ok(readingArticleService.suggestVocabulary(request.content(), request.level()));
    }

    @PostMapping("/suggest-annotations")
    public ResponseEntity<List<Annotation>> suggestAnnotations(@RequestBody SuggestAnnotationsRequest request) {
        return ResponseEntity.ok(readingArticleService.suggestAnnotations(request.content(), request.level()));
    }

    @PostMapping("/generate-quiz")
    public ResponseEntity<List<ReadingQuizQuestion>> generateQuiz(@RequestBody GenerateQuizRequest request) {
        return ResponseEntity.ok(readingArticleService.generateQuiz(request.content(), request.level(), request.annotations()));
    }

    @GetMapping("/{id}/quiz")
    public ResponseEntity<List<ReadingQuizQuestion>> getQuiz(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(readingArticleService.getQuizForAdmin(id));
    }

    @PostMapping
    public ResponseEntity<ReadingArticleResponse> create(@RequestBody ReadingArticleManualRequest request) {
        return ResponseEntity.ok(readingArticleService.createManual(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ReadingArticleResponse> update(
            @PathVariable String id,
            @RequestBody ReadingArticleManualRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(readingArticleService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws DataNotFoundException {
        readingArticleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
