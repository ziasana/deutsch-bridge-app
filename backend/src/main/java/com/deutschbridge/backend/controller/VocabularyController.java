package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.dto.VocabularyRequest;
import com.deutschbridge.backend.model.dto.VocabularyResponse;
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
    public ResponseEntity<List<VocabularyResponse>> getAllVocabularies() {
        return new ResponseEntity<>(vocabularyService.findAll(), HttpStatus.OK);
    }

    @GetMapping("/get-user")
    public ResponseEntity<List<VocabularyResponse>> getUserVocabularies() {
        return new ResponseEntity<>(vocabularyService.getUserVocabularies(), HttpStatus.OK);
    }

   @PostMapping
    public ResponseEntity<ApiResponse<String>> save(@RequestBody VocabularyRequest request) {
        vocabularyService.save(request);
        return new ResponseEntity<>(
                new ApiResponse<>("Vocabulary saved", ""), HttpStatus.CREATED);
    }

    @PutMapping
    public ResponseEntity<ApiResponse<VocabularyResponse>> update(@RequestBody VocabularyRequest request) {
        VocabularyResponse response = vocabularyService.update(request);
        return new ResponseEntity<>(
                new ApiResponse<>("Vocabulary updated", response), HttpStatus.OK);
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<String>> delete(@RequestBody VocabularyRequest request) throws DataNotFoundException {
        vocabularyService.delete(request);
        return new ResponseEntity<>(
                new ApiResponse<>("Vocabulary deleted", ""), HttpStatus.OK);
    }

}
