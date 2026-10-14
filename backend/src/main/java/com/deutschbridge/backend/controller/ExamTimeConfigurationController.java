package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamTimeConfigurationResponse;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.ExamTimeConfigurationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Read-only learner access to the recommended Teil times. Writes live under /api/admin. */
@RestController
@RequestMapping("/api/exam-time-configurations")
public class ExamTimeConfigurationController {

    private final ExamTimeConfigurationService service;

    public ExamTimeConfigurationController(ExamTimeConfigurationService service) {
        this.service = service;
    }

    /** Enabled targets for a level of an exam (Telc by default); an empty list means timing is not available for it. */
    @GetMapping
    public ResponseEntity<List<ExamTimeConfigurationResponse>> getForLevel(@RequestParam LearningLevel level,
                                                                          @RequestParam(defaultValue = "TELC") ExamType examType) {
        return ResponseEntity.ok(service.findEnabledForLevel(examType, level));
    }

    @GetMapping("/{examType}/{level}/{section}/{teil}")
    public ResponseEntity<ExamTimeConfigurationResponse> getOne(@PathVariable ExamType examType,
                                                                @PathVariable LearningLevel level,
                                                                @PathVariable ExamSection section,
                                                                @PathVariable int teil) throws DataNotFoundException {
        return ResponseEntity.ok(service.findEnabled(examType, level, section, teil));
    }
}
