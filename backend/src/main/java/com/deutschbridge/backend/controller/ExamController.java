package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamExercisePublicResponse;
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

    @GetMapping
    public ResponseEntity<List<ExamExercisePublicResponse>> getAll(
            @RequestParam(required = false) ExamSection section,
            @RequestParam(required = false) LearningLevel level,
            @RequestParam(required = false) ExamTaskType taskType
    ) {
        return new ResponseEntity<>(examExerciseService.findAllPublic(section, level, taskType), HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamExercisePublicResponse> getById(@PathVariable String id) throws DataNotFoundException {
        return new ResponseEntity<>(examExerciseService.findByIdPublic(id), HttpStatus.OK);
    }
}
