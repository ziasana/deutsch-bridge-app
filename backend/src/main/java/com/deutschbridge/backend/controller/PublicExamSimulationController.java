package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.examsim.ExamSimulationDtos.PublicProfile;
import com.deutschbridge.backend.service.examsim.ExamSimulationOverviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Unauthenticated, read-only list of the published mock exams for the public /mock-test page. Starting one still needs a login. */
@RestController
@RequestMapping("/api/public/exam-simulation")
public class PublicExamSimulationController {

    private final ExamSimulationOverviewService overviewService;

    public PublicExamSimulationController(ExamSimulationOverviewService overviewService) {
        this.overviewService = overviewService;
    }

    @GetMapping("/profiles")
    public ResponseEntity<List<PublicProfile>> profiles() {
        return ResponseEntity.ok(overviewService.listPublic());
    }
}
