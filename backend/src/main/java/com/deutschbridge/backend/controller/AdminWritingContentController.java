package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminRedemittelExerciseDto;
import com.deutschbridge.backend.model.dto.AdminRedemittelFunctionDto;
import com.deutschbridge.backend.model.dto.AdminWritingGuideItemDto;
import com.deutschbridge.backend.model.dto.AdminWritingPhraseDto;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.dto.RedemittelBulkImportResult;
import com.deutschbridge.backend.service.RedemittelBulkImportService;
import com.deutschbridge.backend.service.RedemittelExerciseAdminService;
import com.fasterxml.jackson.databind.JsonNode;
import com.deutschbridge.backend.service.RedemittelFunctionAdminService;
import com.deutschbridge.backend.service.WritingContentAdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/** Admin CRUD for "Schreiben lernen" content: guide items (format/strategy/structure/examples/patterns/mistakes/checklist) and Redemittel. */
@RestController
@RequestMapping("/api/admin/writing")
@PreAuthorize("hasRole('ADMIN')")
public class AdminWritingContentController {

    private final WritingContentAdminService service;
    private final RedemittelExerciseAdminService exerciseService;
    private final RedemittelFunctionAdminService functionService;
    private final RedemittelBulkImportService bulkImportService;

    public AdminWritingContentController(WritingContentAdminService service, RedemittelExerciseAdminService exerciseService,
                                         RedemittelFunctionAdminService functionService, RedemittelBulkImportService bulkImportService) {
        this.bulkImportService = bulkImportService;
        this.service = service;
        this.exerciseService = exerciseService;
        this.functionService = functionService;
    }

    /** Best-effort bulk import of Redemittel (with optional exercises) - see RedemittelBulkImportService. */
    @PostMapping("/phrases/bulk")
    public ResponseEntity<RedemittelBulkImportResult> bulkImport(@RequestBody List<JsonNode> rows) {
        return ResponseEntity.ok(bulkImportService.bulkImport(rows));
    }

    @GetMapping("/functions")
    public ResponseEntity<List<AdminRedemittelFunctionDto>> listFunctions() {
        return ResponseEntity.ok(functionService.list());
    }

    @PostMapping("/functions")
    public ResponseEntity<AdminRedemittelFunctionDto> createFunction(@RequestBody AdminRedemittelFunctionDto dto) {
        return ResponseEntity.ok(functionService.create(dto));
    }

    @PutMapping("/functions/{id}")
    public ResponseEntity<AdminRedemittelFunctionDto> updateFunction(@PathVariable String id, @RequestBody AdminRedemittelFunctionDto dto) throws DataNotFoundException {
        return ResponseEntity.ok(functionService.update(id, dto));
    }

    @DeleteMapping("/functions/{id}")
    public ResponseEntity<Void> deleteFunction(@PathVariable String id) throws DataNotFoundException {
        functionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /** Exercise count per phrase id, so the admin list can flag Redemittel without practice exercises. */
    @GetMapping("/phrases/exercise-counts")
    public ResponseEntity<Map<String, Long>> exerciseCounts(@RequestParam LearningLevel level) {
        return ResponseEntity.ok(exerciseService.countsForLevel(level));
    }

    @GetMapping("/phrases/{id}/exercises")
    public ResponseEntity<List<AdminRedemittelExerciseDto>> listExercises(@PathVariable String id) throws DataNotFoundException {
        return ResponseEntity.ok(exerciseService.list(id));
    }

    @PutMapping("/phrases/{id}/exercises")
    public ResponseEntity<List<AdminRedemittelExerciseDto>> saveExercises(@PathVariable String id, @RequestBody List<AdminRedemittelExerciseDto> body) throws DataNotFoundException {
        return ResponseEntity.ok(exerciseService.replace(id, body));
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
