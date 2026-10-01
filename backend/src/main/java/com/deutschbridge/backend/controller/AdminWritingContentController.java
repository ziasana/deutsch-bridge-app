package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminWritingGuideItemDto;
import com.deutschbridge.backend.model.dto.AdminWritingPhraseDto;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.WritingContentAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin CRUD for "Schreiben lernen" content: guide items (format/strategy/structure/examples/patterns/mistakes/checklist) and Redemittel. */
@RestController
@RequestMapping("/api/admin/writing")
@PreAuthorize("hasRole('ADMIN')")
public class AdminWritingContentController {

    private final WritingContentAdminService service;

    public AdminWritingContentController(WritingContentAdminService service) {
        this.service = service;
    }

    @GetMapping("/guide-items")
    public ResponseEntity<List<AdminWritingGuideItemDto>> listGuideItems(@RequestParam LearningLevel level) {
        return ResponseEntity.ok(service.listGuideItems(level));
    }

    @PostMapping("/guide-items")
    public ResponseEntity<AdminWritingGuideItemDto> createGuideItem(@RequestBody AdminWritingGuideItemDto dto) {
        return ResponseEntity.ok(service.createGuideItem(dto));
    }

    @PutMapping("/guide-items/{id}")
    public ResponseEntity<AdminWritingGuideItemDto> updateGuideItem(@PathVariable String id, @RequestBody AdminWritingGuideItemDto dto) throws DataNotFoundException {
        return ResponseEntity.ok(service.updateGuideItem(id, dto));
    }

    @DeleteMapping("/guide-items/{id}")
    public ResponseEntity<Void> deleteGuideItem(@PathVariable String id) throws DataNotFoundException {
        service.deleteGuideItem(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/phrases")
    public ResponseEntity<List<AdminWritingPhraseDto>> listPhrases(@RequestParam LearningLevel level) {
        return ResponseEntity.ok(service.listPhrases(level));
    }

    @PostMapping("/phrases")
    public ResponseEntity<AdminWritingPhraseDto> createPhrase(@RequestBody AdminWritingPhraseDto dto) {
        return ResponseEntity.ok(service.createPhrase(dto));
    }

    @PutMapping("/phrases/{id}")
    public ResponseEntity<AdminWritingPhraseDto> updatePhrase(@PathVariable String id, @RequestBody AdminWritingPhraseDto dto) throws DataNotFoundException {
        return ResponseEntity.ok(service.updatePhrase(id, dto));
    }

    @DeleteMapping("/phrases/{id}")
    public ResponseEntity<Void> deletePhrase(@PathVariable String id) throws DataNotFoundException {
        service.deletePhrase(id);
        return ResponseEntity.noContent().build();
    }
}
