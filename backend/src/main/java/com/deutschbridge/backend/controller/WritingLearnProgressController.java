package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.model.dto.WritingLearnProgressDto;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.service.WritingLearnProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** The learner's progress through the "Schreiben lernen" path. */
@RestController
@RequestMapping("/api/writing/learn-progress")
public class WritingLearnProgressController {

    private final WritingLearnProgressService service;

    public WritingLearnProgressController(WritingLearnProgressService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<WritingLearnProgressDto>> list(@RequestParam LearningLevel level) {
        return ResponseEntity.ok(service.list(level));
    }

    @PutMapping("/{station}")
    public ResponseEntity<WritingLearnProgressDto> save(@PathVariable String station,
                                                        @RequestParam LearningLevel level,
                                                        @RequestBody WritingLearnProgressDto body) {
        return ResponseEntity.ok(service.save(level, station, body.correct(), body.total()));
    }

    @DeleteMapping
    public ResponseEntity<Void> reset(@RequestParam LearningLevel level) {
        service.reset(level);
        return ResponseEntity.noContent().build();
    }
}
