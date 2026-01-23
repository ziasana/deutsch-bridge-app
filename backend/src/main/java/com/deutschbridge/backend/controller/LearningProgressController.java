package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ApiResponse;
import com.deutschbridge.backend.model.dto.LearningProgressRequest;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.service.LearningProgressService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learning-progress")
public class LearningProgressController {

    private final LearningProgressService learningProgressService;

    public LearningProgressController(LearningProgressService learningProgressService) {
        this.learningProgressService = learningProgressService;
    }

    @GetMapping
    public ResponseEntity<List<LearningProgress>> getAll() {
        return new ResponseEntity<>(learningProgressService.findAll(), HttpStatus.OK);
    }


   @PostMapping
    public ResponseEntity<ApiResponse<String>> save(@RequestBody LearningProgressRequest request) throws DataNotFoundException {
        learningProgressService.save(request);
        return new ResponseEntity<>(
                new ApiResponse<>("Learning progress saved", ""), HttpStatus.CREATED);
    }



}
