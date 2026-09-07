package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.DictionaryEntryResponse;
import com.deutschbridge.backend.model.dto.ReportMissingWordRequest;
import com.deutschbridge.backend.service.DictionaryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dictionary")
public class DictionaryController {

    private final DictionaryService dictionaryService;

    public DictionaryController(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    @GetMapping("/{lemma}")
    public ResponseEntity<DictionaryEntryResponse> lookup(@PathVariable String lemma) {
        return dictionaryService.lookup(lemma)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/{lemma}/report-missing")
    public ResponseEntity<Void> reportMissing(@PathVariable String lemma, @RequestBody(required = false) ReportMissingWordRequest request) {
        dictionaryService.reportMissing(lemma, request != null ? request.note() : null);
        return ResponseEntity.noContent().build();
    }
}
