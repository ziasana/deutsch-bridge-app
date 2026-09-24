package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamFieldPresetRequest;
import com.deutschbridge.backend.model.dto.ExamFieldPresetResponse;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.ExamFieldPresetService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Admin CRUD for reusable exam-exercise field presets (Teil description / default explanation /
 *  default common mistake), scoped by section + level - see ExamSectionManager's preset dropdowns. */
@RestController
@RequestMapping("/api/admin/exam/field-presets")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamFieldPresetController {

    private final ExamFieldPresetService examFieldPresetService;

    public AdminExamFieldPresetController(ExamFieldPresetService examFieldPresetService) {
        this.examFieldPresetService = examFieldPresetService;
    }

    @GetMapping
    public ResponseEntity<List<ExamFieldPresetResponse>> getBySectionAndLevel(
            @RequestParam ExamSection section,
            @RequestParam LearningLevel level
    ) {
        return ResponseEntity.ok(examFieldPresetService.findBySectionAndLevel(section, level));
    }

    @PostMapping
    public ResponseEntity<ExamFieldPresetResponse> create(@RequestBody ExamFieldPresetRequest request) {
        return ResponseEntity.ok(examFieldPresetService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamFieldPresetResponse> update(
            @PathVariable String id,
            @RequestBody ExamFieldPresetRequest request
    ) throws DataNotFoundException {
        return ResponseEntity.ok(examFieldPresetService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable String id) throws DataNotFoundException {
        examFieldPresetService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
