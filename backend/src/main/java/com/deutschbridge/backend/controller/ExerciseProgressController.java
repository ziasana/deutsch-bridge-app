package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.dto.ExerciseAnswerRequest;
import com.deutschbridge.backend.model.dto.ExerciseAnswerResponse;
import com.deutschbridge.backend.service.ExerciseProgressService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exercise-progress")
public class ExerciseProgressController {

    private final ExerciseProgressService exerciseProgressService;

    public ExerciseProgressController(ExerciseProgressService exerciseProgressService) {
        this.exerciseProgressService = exerciseProgressService;
    }

    @GetMapping
    public ResponseEntity<List<ExerciseAnswerResponse>> getProgress() {
        return new ResponseEntity<>(exerciseProgressService.getProgress(), HttpStatus.OK);
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> saveAnswer(@RequestBody @Valid ExerciseAnswerRequest request) {
        exerciseProgressService.saveAnswer(request);
        return new ResponseEntity<>(new ApiResponse<>("Answer saved", null), HttpStatus.OK);
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse<Void>> resetProgress(@RequestBody(required = false) List<String> questionKeys) {
        exerciseProgressService.resetProgress(questionKeys);
        return new ResponseEntity<>(new ApiResponse<>("Progress reset", null), HttpStatus.OK);
    }
}
