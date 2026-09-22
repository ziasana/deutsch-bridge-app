package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.SelectionClassifyRequest;
import com.deutschbridge.backend.model.dto.SelectionClassifyResponse;
import com.deutschbridge.backend.model.dto.VocabularyCreateRequest;
import com.deutschbridge.backend.model.dto.VocabularyExistsResponse;
import com.deutschbridge.backend.model.dto.VocabularyFromChatCreateRequest;
import com.deutschbridge.backend.model.dto.VocabularyItemResponse;
import com.deutschbridge.backend.model.dto.VocabularyPracticeSessionResponse;
import com.deutschbridge.backend.model.dto.VocabularyRoundRequest;
import com.deutschbridge.backend.model.dto.VocabularyRoundResponse;
import com.deutschbridge.backend.model.dto.VocabularyUpdateRequest;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.VocabularySource;
import com.deutschbridge.backend.service.VocabularyPracticeService;
import com.deutschbridge.backend.service.VocabularyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Unified vocabulary endpoint - replaces the old /api/vocabulary, /api/vocabulary-practice, and
 * /api/vocab controllers/services. All endpoints are scoped to the current authenticated user
 * (see RequestContext), same idiom as ExpressionController/ExpressionService.
 */
@RestController
@RequestMapping("/api/vocabulary")
public class VocabularyController {

    private final VocabularyService vocabularyService;
    private final VocabularyPracticeService vocabularyPracticeService;

    public VocabularyController(VocabularyService vocabularyService, VocabularyPracticeService vocabularyPracticeService) {
        this.vocabularyService = vocabularyService;
        this.vocabularyPracticeService = vocabularyPracticeService;
    }

    @GetMapping
    public ResponseEntity<List<VocabularyItemResponse>> getAll(
            @RequestParam(required = false) VocabularySource source,
            @RequestParam(required = false) LearningLevel level,
            @RequestParam(required = false) Boolean bookmarked
    ) {
        return ResponseEntity.ok(vocabularyService.findAllForUser(source, level, bookmarked));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VocabularyItemResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(vocabularyService.findById(id));
    }

    @PostMapping
    public ResponseEntity<VocabularyItemResponse> create(@RequestBody VocabularyCreateRequest request) {
        return ResponseEntity.ok(vocabularyService.createCustom(request));
    }

    @PostMapping("/from-dictionary/{dictionaryEntryId}")
    public ResponseEntity<VocabularyItemResponse> addFromDictionary(@PathVariable String dictionaryEntryId) throws DataNotFoundException {
        return ResponseEntity.ok(vocabularyService.addFromDictionary(dictionaryEntryId));
    }

    @PostMapping("/from-chat")
    public ResponseEntity<VocabularyItemResponse> createFromChat(@RequestBody VocabularyFromChatCreateRequest request) {
        return ResponseEntity.ok(vocabularyService.createFromChat(request));
    }

    @PostMapping("/classify-selection")
    public ResponseEntity<SelectionClassifyResponse> classifySelection(@RequestBody SelectionClassifyRequest request) {
        return ResponseEntity.ok(vocabularyService.classifySelection(request.selectedText(), request.contextText()));
    }

    @GetMapping("/exists")
    public ResponseEntity<VocabularyExistsResponse> exists(@RequestParam String word) {
        return ResponseEntity.ok(vocabularyService.checkExists(word));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VocabularyItemResponse> update(@PathVariable String id, @RequestBody VocabularyUpdateRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(vocabularyService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws DataNotFoundException {
        vocabularyService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/bookmark")
    public ResponseEntity<VocabularyItemResponse> addBookmark(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(vocabularyService.addBookmark(id));
    }

    @DeleteMapping("/{id}/bookmark")
    public ResponseEntity<VocabularyItemResponse> removeBookmark(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(vocabularyService.removeBookmark(id));
    }

    @GetMapping("/practice/session")
    public ResponseEntity<VocabularyPracticeSessionResponse> getPracticeSession(
            @RequestParam(required = false) String vocabularyItemId
    ) throws DataNotFoundException {
        return ResponseEntity.ok(vocabularyPracticeService.getSession(vocabularyItemId));
    }

    @PostMapping("/practice/round")
    public ResponseEntity<VocabularyRoundResponse> submitPracticeRound(@RequestBody VocabularyRoundRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(vocabularyPracticeService.submitRound(request));
    }
}
