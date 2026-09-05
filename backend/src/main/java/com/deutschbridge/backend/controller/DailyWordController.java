package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.DailyWordResponse;
import com.deutschbridge.backend.service.DailyWordService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/daily-words")
public class DailyWordController {

    private final DailyWordService dailyWordService;

    public DailyWordController(DailyWordService dailyWordService) {
        this.dailyWordService = dailyWordService;
    }

    @GetMapping
    public ResponseEntity<List<DailyWordResponse>> getTodaysWords() {
        return new ResponseEntity<>(dailyWordService.getTodaysWordsForCurrentUser(), HttpStatus.OK);
    }
}
