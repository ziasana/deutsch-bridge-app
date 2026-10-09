package com.deutschbridge.backend.service.examcontent;

import com.deutschbridge.backend.context.RequestContext;
import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.ExamContentDtos.Issue;
import com.deutschbridge.backend.model.dto.SpeakingGuideDtos.GuideResponse;
import com.deutschbridge.backend.model.dto.SpeakingGuideDtos.SaveResult;
import com.deutschbridge.backend.model.entity.SpeakingGuide;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.SpeakingGuideRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Reads and edits the shared learning content ("Lernbereich") of the Mündlicher Ausdruck Teile. Saving is validated server-side. */
@Service
public class SpeakingGuideService {

    public static final int PARTS = 3;

    private final SpeakingGuideRepository repository;
    private final RequestContext requestContext;
    private final ObjectMapper mapper;

    public SpeakingGuideService(SpeakingGuideRepository repository, RequestContext requestContext, ObjectMapper mapper) {
        this.repository = repository;
        this.requestContext = requestContext;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<GuideResponse> list(LearningLevel level) {
        return repository.findByLevelOrderByPartNumberAsc(level).stream().map(SpeakingGuideService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public GuideResponse get(LearningLevel level, int part) throws DataNotFoundException {
        checkPart(part);
        return repository.findByLevelAndPartNumber(level, part).map(SpeakingGuideService::toResponse)
                .orElseThrow(() -> new DataNotFoundException("No learning content for " + level.getValue() + " Teil " + part + " yet."));
    }

    /** Validates {@code content}; unless {@code dryRun} (or there are errors) it replaces the stored guide of that level and Teil. */
    @Transactional
    public SaveResult save(LearningLevel level, int part, Map<String, Object> content, boolean dryRun) throws DataNotFoundException {
        checkPart(part);
        if (content == null || content.isEmpty()) {
            return new SaveResult(false, List.of(new Issue(ExamContentValidator.ERROR, "CONTENT_MISSING", "$", "The learning content must not be empty.")), null);
        }
        List<Issue> issues = new ArrayList<>();
        JsonNode node = mapper.valueToTree(content);
        Map<String, Object> normalised = ExamSpeakingReader.validateGuide(part, node, issues);
        boolean hasErrors = issues.stream().anyMatch(i -> ExamContentValidator.ERROR.equals(i.severity()));
        if (hasErrors || dryRun) return new SaveResult(false, issues, null);

        SpeakingGuide guide = repository.findByLevelAndPartNumber(level, part).orElseGet(() -> {
            SpeakingGuide g = new SpeakingGuide();
            g.setLevel(level);
            g.setPartNumber(part);
            return g;
        });
        guide.setContent(normalised);
        guide.setUpdatedAt(LocalDateTime.now());
        guide.setUpdatedBy(requestContext.getUserId());
        return new SaveResult(true, issues, toResponse(repository.save(guide)));
    }

    /** Used by the seeder: stores a built-in guide only when that level + Teil has none yet, so admin edits survive restarts. */
    @Transactional
    public boolean seedIfMissing(LearningLevel level, int part, JsonNode json) {
        if (repository.findByLevelAndPartNumber(level, part).isPresent()) return false;
        List<Issue> issues = new ArrayList<>();
        Map<String, Object> normalised = ExamSpeakingReader.validateGuide(part, json, issues);
        if (issues.stream().anyMatch(i -> ExamContentValidator.ERROR.equals(i.severity()))) {
            throw new IllegalStateException("Built-in speaking guide " + level + " Teil " + part + " is invalid: " + issues.get(0).path() + " - " + issues.get(0).message());
        }
        SpeakingGuide guide = new SpeakingGuide();
        guide.setLevel(level);
        guide.setPartNumber(part);
        guide.setContent(normalised);
        repository.save(guide);
        return true;
    }

    private static void checkPart(int part) throws DataNotFoundException {
        if (part < 1 || part > PARTS) throw new DataNotFoundException("Unknown Teil " + part + ".");
    }

    private static GuideResponse toResponse(SpeakingGuide g) {
        return new GuideResponse(g.getLevel().getValue(), g.getPartNumber(), g.getContent(), g.getUpdatedAt());
    }

    /** For tests. */
    Map<String, Object> asMap(JsonNode node) {
        return mapper.convertValue(node, new TypeReference<>() {
        });
    }
}
