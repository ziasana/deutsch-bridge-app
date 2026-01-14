package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.dto.VocabularyPracticeRequest;
import com.deutschbridge.backend.model.dto.VocabularyPracticeResponse;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
import com.deutschbridge.backend.service.VocabularyPracticeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocabulary-practice")
public class VocabularyPracticeController {

    private final VocabularyPracticeService vocabularyPracticeService;

    public VocabularyPracticeController(VocabularyPracticeService vocabularyPracticeService) {
        this.vocabularyPracticeService = vocabularyPracticeService;
    }

    @GetMapping
    public ResponseEntity<List<VocabularyResponse>> getUserVocabularyPractice() {
        return new ResponseEntity<>(vocabularyPracticeService.getUserWithPractice(), HttpStatus.OK);
    }

    @GetMapping("/for-practice")
    public ResponseEntity<List<VocabularyPracticeResponse>> getVocabularyForPractice() {
        return new ResponseEntity<>(vocabularyPracticeService.getVocabularyForPractice(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> save(@RequestBody VocabularyPracticeRequest request) throws DataNotFoundException {
        vocabularyPracticeService.save(request);
        return new ResponseEntity<>(
                new ApiResponse<>("Vocabulary practice saved", ""), HttpStatus.CREATED);
    }

}
