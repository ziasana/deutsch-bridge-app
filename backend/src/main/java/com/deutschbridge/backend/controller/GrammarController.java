package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.GrammarLessonResponse;
import com.deutschbridge.backend.service.GrammarService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/grammar")
public class GrammarController {

    private final GrammarService grammarService;

    public GrammarController(GrammarService grammarService) {
        this.grammarService = grammarService;
    }

    @GetMapping
    public ResponseEntity<List<GrammarLessonResponse>> getAll() {
        return new ResponseEntity<>(grammarService.findAllWithLearningProgress(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<GrammarLessonResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(grammarService.findByIdWithLearningProgress(id), HttpStatus.OK);
    }
}
