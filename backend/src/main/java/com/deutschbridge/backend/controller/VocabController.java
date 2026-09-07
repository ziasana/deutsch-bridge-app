package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.SaveVocabRequest;
import com.deutschbridge.backend.model.dto.UserVocabResponse;
import com.deutschbridge.backend.service.DictionaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vocab")
public class VocabController {

    private final DictionaryService dictionaryService;

    public VocabController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    @GetMapping
    public ResponseEntity<List<UserVocabResponse>> getAll() {
        return ResponseEntity.ok(dictionaryService.getUserVocab());
    }

    @PostMapping
    public ResponseEntity<UserVocabResponse> save(@RequestBody SaveVocabRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(dictionaryService.saveToVocab(request.entryId()));
    }

    @DeleteMapping("/{entryId}")
    public ResponseEntity<Void> remove(@PathVariable String entryId) {
        dictionaryService.removeFromVocab(entryId);
        return ResponseEntity.noContent().build();
    }
}
