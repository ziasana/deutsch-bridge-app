package com.deutschbridge.backend.controller;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamContentDtos.*;
import com.deutschbridge.backend.model.enums.ExamContentStatus;
import com.deutschbridge.backend.model.enums.ExamSection;
import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.service.examcontent.ExamContentService;
import com.deutschbridge.backend.service.examcontent.ExamGeneratorTopicService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

/** Admin-only API of the exam content pipeline (prompt generator, JSON validate/import, review workflow, export). */
@RestController
@RequestMapping("/api/admin/exam-content")
@PreAuthorize("hasRole('ADMIN')")
public class AdminExamContentController {

    private final ExamContentService service;
    private final ExamGeneratorTopicService topicService;

    public AdminExamContentController(ExamContentService service, ExamGeneratorTopicService topicService) {
        this.service = service;
        this.topicService = topicService;
    }

    /** The saved topic list changes (added topics, removed built-in topics) of one exam part's generator, e.g. partKey DTZ_TEIL_5. */
    public record TopicRequest(String partKey, String topic) {
    }

    public record HiddenTopicRequest(String partKey, String topic, boolean hidden) {
    }

    @GetMapping("/topics")
    public ResponseEntity<ExamGeneratorTopicService.Topics> topics(@RequestParam String partKey) {
        return ResponseEntity.ok(topicService.list(partKey));
    }

    @PostMapping("/topics")
    public ResponseEntity<ExamGeneratorTopicService.Topics> addTopic(@RequestBody TopicRequest request) {
        return ResponseEntity.ok(topicService.add(request.partKey(), request.topic()));
    }

    @PostMapping("/topics/remove")
    public ResponseEntity<ExamGeneratorTopicService.Topics> removeTopic(@RequestBody TopicRequest request) {
        return ResponseEntity.ok(topicService.remove(request.partKey(), request.topic()));
    }

    @PostMapping("/topics/hidden")
    public ResponseEntity<ExamGeneratorTopicService.Topics> hideTopic(@RequestBody HiddenTopicRequest request) {
        return ResponseEntity.ok(topicService.setHidden(request.partKey(), request.topic(), request.hidden()));
    }

    @PostMapping("/topics/restore")
    public ResponseEntity<ExamGeneratorTopicService.Topics> restoreTopics(@RequestParam String partKey) {
        return ResponseEntity.ok(topicService.restoreBuiltIn(partKey));
    }

    @GetMapping("/options")
    public ResponseEntity<OptionsResponse> options() {
        return ResponseEntity.ok(service.options());
    }

    @PostMapping("/prompt")
    public ResponseEntity<PromptResponse> prompt(@RequestBody PromptRequest request) {
        return ResponseEntity.ok(service.buildPrompt(request));
    }

    @GetMapping("/speaking-starter/{part}")
    public ResponseEntity<byte[]> speakingStarter(@PathVariable int part) throws DataNotFoundException {
        String json = service.speakingStarter(part);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename("B1-Muendlicher-Ausdruck-Teil" + part + "-start.json").build().toString())
                .contentType(MediaType.APPLICATION_JSON)
                .body(json.getBytes(StandardCharsets.UTF_8));
    }

    @PostMapping("/validate")
    public ResponseEntity<ValidationReport> validate(@RequestBody ValidateRequest request) {
        return ResponseEntity.ok(service.validate(request.json()));
    }

    @PostMapping("/import")
    public ResponseEntity<ImportResult> importContent(@RequestBody ImportRequest request) {
        return ResponseEntity.ok(service.importContent(request));
    }

    @PostMapping("/status")
    public ResponseEntity<StatusChangeResult> changeStatus(@RequestBody StatusChangeRequest request) {
        return ResponseEntity.ok(service.changeStatus(request));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestParam(required = false) List<String> ids,
            @RequestParam(required = false) ExamType examType,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) ExamSection section,
            @RequestParam(required = false) Integer part,
            @RequestParam(required = false) ExamContentStatus status
    ) throws DataNotFoundException {
        ExamContentService.ExportFile file = service.export(ids, examType, level, section, part, status);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(file.filename()).build().toString())
                .header("X-Exported-Count", String.valueOf(file.exported()))
                .header("X-Skipped-Count", String.valueOf(file.skipped()))
                .contentType(MediaType.APPLICATION_JSON)
                .body(file.content().getBytes(StandardCharsets.UTF_8));
    }
}
