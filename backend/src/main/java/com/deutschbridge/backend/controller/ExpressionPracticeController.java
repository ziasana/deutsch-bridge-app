package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.*;
import com.deutschbridge.backend.service.ExpressionPracticeService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/expressions/practice")
public class ExpressionPracticeController {

    private final ExpressionPracticeService expressionPracticeService;

    public ExpressionPracticeController(ExpressionPracticeService expressionPracticeService) {
        this.expressionPracticeService = expressionPracticeService;
    }

    @GetMapping("/session")
    public ResponseEntity<PracticeSessionResponse> getSession(@RequestParam(required = false) String expressionId) throws DataNotFoundException {
        if (expressionId != null) {
            return ResponseEntity.ok(expressionPracticeService.getSessionForExpression(expressionId));
        }
        return ResponseEntity.ok(expressionPracticeService.getSession());
    }

    @PostMapping("/recall")
    public ResponseEntity<RecallAnswerResponse> submitRecall(@RequestBody RecallAnswerRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(expressionPracticeService.submitRecall(request));
    }

    @PostMapping("/question")
    public ResponseEntity<QuestionAnswerResponse> submitQuestion(@RequestBody QuestionAnswerRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(expressionPracticeService.submitQuestion(request));
    }

    @PostMapping("/transformation")
    public ResponseEntity<TransformationAnswerResponse> submitTransformation(@RequestBody TransformationAnswerRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(expressionPracticeService.submitTransformation(request));
    }

    @PostMapping("/production")
    public ResponseEntity<ProductionAnswerResponse> submitProduction(@RequestBody ProductionAnswerRequest request) throws DataNotFoundException {
        return ResponseEntity.ok(expressionPracticeService.submitProduction(request));
    }
}
