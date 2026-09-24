package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
import com.deutschbridge.backend.model.dto.ExamExerciseSummaryResponse;
import com.deutschbridge.backend.model.dto.ExamLevelSummaryResponse;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamTaskType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.ExamExerciseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam")
public class ExamController {

    private final ExamExerciseService examExerciseService;

    public ExamController(ExamExerciseService examExerciseService) {
        this.examExerciseService = examExerciseService;
    }

    /** Lightweight navigation shape (no passages/questions) for lists - section tabs, level selector, Teil listings. */
    @GetMapping
    public ResponseEntity<List<ExamExerciseSummaryResponse>> getAll(
            @RequestParam(required = false) ExamSection section,
            @RequestParam(required = false) LearningLevel level,
            @RequestParam(required = false) ExamTaskType taskType
    ) {
        return new ResponseEntity<>(examExerciseService.findSummary(section, level, taskType), HttpStatus.OK);
    }

    /** Per-level aggregate progress across every practicable section, for the level selector. */
    @GetMapping("/level-summary")
    public ResponseEntity<List<ExamLevelSummaryResponse>> getLevelSummary() {
        return new ResponseEntity<>(examExerciseService.findLevelSummary(), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamExercisePublicResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(examExerciseService.findByIdPublic(id), HttpStatus.OK);
    }
}
