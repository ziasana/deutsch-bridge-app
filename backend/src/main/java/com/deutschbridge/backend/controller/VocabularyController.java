package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.dto.VocabularyRequest;
import com.deutschbridge.backend.model.entity.Vocabulary;
import com.deutschbridge.backend.service.VocabularyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocabulary")
public class VocabularyController {

    private final VocabularyService vocabularyService;

    public VocabularyController(VocabularyService vocabularyService) {
        this.vocabularyService = vocabularyService;
    }

    @GetMapping
    public ResponseEntity<List<Vocabulary>> getAllVocabularies() {
        return new ResponseEntity<>(vocabularyService.findAll(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ApiResponse> save(@RequestBody VocabularyRequest request) {
        vocabularyService.save(request);
        return new ResponseEntity<>(
                new ApiResponse<>("Vocabulary saved", ""), HttpStatus.CREATED);
    }

    @PutMapping
    public ResponseEntity<ApiResponse> update(@RequestBody VocabularyRequest request) {
        vocabularyService.update(request);
        return new ResponseEntity<>(
                new ApiResponse<>("Vocabulary updated", ""), HttpStatus.OK);
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse> delete(@RequestBody VocabularyRequest request) throws DataNotFoundException {
        vocabularyService.delete(request);
        return new ResponseEntity<>(
                new ApiResponse<>("Vocabulary deleted", ""), HttpStatus.OK);
    }

}
