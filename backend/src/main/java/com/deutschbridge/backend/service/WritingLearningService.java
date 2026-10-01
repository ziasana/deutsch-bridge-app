package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.dto.WritingLearningResponse;
import com.deutschbridge.backend.model.entity.WritingGuideItem;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.WritingGuideItemRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class WritingLearningService {

    private static final Logger log = LoggerFactory.getLogger(WritingLearningService.class);

    private final WritingGuideItemRepository guideRepository;
    private final WritingPhraseRepository phraseRepository;
    private final ObjectMapper objectMapper;

    public WritingLearningService(WritingGuideItemRepository guideRepository,
                                  WritingPhraseRepository phraseRepository,
                                  ObjectMapper objectMapper) {
        this.guideRepository = guideRepository;
        this.phraseRepository = phraseRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public WritingLearningResponse getForLevel(LearningLevel level) {
        List<WritingLearningResponse.GuideItem> items = guideRepository
                .findByLevelAndActiveTrueOrderByKindAscSortOrderAsc(level).stream()
                .map(this::toResponse)
                .toList();
        List<WritingLearningResponse.Phrase> phrases = phraseRepository
                .findByLevelAndActiveTrueOrderByCategoryAscSortOrderAsc(level).stream()
                .map(this::toResponse)
                .toList();
        return new WritingLearningResponse(level.name(), items, phrases);
    }

    private WritingLearningResponse.GuideItem toResponse(WritingGuideItem item) {
        return new WritingLearningResponse.GuideItem(item.getId(), item.getKind().name(), item.getTitle(),
                item.getContent(), parse(item), item.getSortOrder());
    }

    private WritingLearningResponse.Phrase toResponse(WritingPhrase p) {
        return new WritingLearningResponse.Phrase(p.getId(), p.getCategory().name(), p.getPhrase(),
                p.getExplanation(), p.getExample(), p.getFormality() == null ? null : p.getFormality().name(),
                p.getUsageNote(), p.getSortOrder());
    }

    private JsonNode parse(WritingGuideItem item) {
        if (item.getData() == null || item.getData().isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(item.getData());
        } catch (Exception e) {
            log.warn("Invalid JSON data on writing guide item {}", item.getId(), e);
            return null;
        }
    }
}
