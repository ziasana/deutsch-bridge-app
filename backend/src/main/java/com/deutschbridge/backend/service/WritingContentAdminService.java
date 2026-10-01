package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminWritingGuideItemDto;
import com.deutschbridge.backend.model.dto.AdminWritingPhraseDto;
import com.deutschbridge.backend.model.entity.WritingGuideItem;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.repository.RedemittelExerciseRepository;
import com.deutschbridge.backend.repository.WritingGuideItemRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/** Admin CRUD for the data-driven "Schreiben lernen" content (guide items and Redemittel). */
@Service
public class WritingContentAdminService {

    private final WritingGuideItemRepository guideRepository;
    private final WritingPhraseRepository phraseRepository;
    private final RedemittelExerciseRepository exerciseRepository;
    private final ObjectMapper objectMapper;

    public WritingContentAdminService(WritingGuideItemRepository guideRepository,
                                      WritingPhraseRepository phraseRepository,
                                      RedemittelExerciseRepository exerciseRepository,
                                      ObjectMapper objectMapper) {
        this.exerciseRepository = exerciseRepository;
        this.guideRepository = guideRepository;
        this.phraseRepository = phraseRepository;
        this.objectMapper = objectMapper;
    }

    // ---- guide items ----

    public List<AdminWritingGuideItemDto> listGuideItems(LearningLevel level) {
        return guideRepository.findAll().stream()
                .filter(i -> i.getLevel() == level)
                .sorted(Comparator.comparing(WritingGuideItem::getKind).thenComparingInt(WritingGuideItem::getSortOrder))
                .map(this::toDto).toList();
    }

    public AdminWritingGuideItemDto createGuideItem(AdminWritingGuideItemDto dto) {
        return toDto(guideRepository.save(apply(new WritingGuideItem(), dto)));
    }

    public AdminWritingGuideItemDto updateGuideItem(String id, AdminWritingGuideItemDto dto) throws DataNotFoundException {
        WritingGuideItem item = guideRepository.findById(id).orElseThrow(() -> new DataNotFoundException("Guide item not found!"));
        return toDto(guideRepository.save(apply(item, dto)));
    }

    public void deleteGuideItem(String id) throws DataNotFoundException {
        if (!guideRepository.existsById(id)) throw new DataNotFoundException("Guide item not found!");
        guideRepository.deleteById(id);
    }

    private WritingGuideItem apply(WritingGuideItem item, AdminWritingGuideItemDto dto) {
        if (dto.level() == null || dto.kind() == null || dto.title() == null || dto.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Level, kind and title are required.");
        }
        item.setLevel(dto.level());
        item.setKind(dto.kind());
        item.setTitle(dto.title().strip());
        item.setContent(dto.content() == null || dto.content().isBlank() ? null : dto.content());
        item.setData(dto.data() == null || dto.data().isNull() ? null : dto.data().toString());
        item.setSortOrder(dto.sortOrder());
        item.setActive(dto.active());
        return item;
    }

    private AdminWritingGuideItemDto toDto(WritingGuideItem i) {
        JsonNode data = null;
        if (i.getData() != null) {
            try {
                data = objectMapper.readTree(i.getData());
            } catch (Exception ignored) {
                // Unreadable legacy JSON is shown as empty so the admin can overwrite it.
            }
        }
        return new AdminWritingGuideItemDto(i.getId(), i.getLevel(), i.getKind(), i.getTitle(), i.getContent(), data,
                i.getSortOrder(), i.isActive());
    }

    // ---- phrases ----

    public List<AdminWritingPhraseDto> listPhrases(LearningLevel level) {
        return phraseRepository.findAll().stream()
                .filter(p -> p.getLevel() == level)
                .sorted(Comparator.comparing(WritingPhrase::getCategory).thenComparingInt(WritingPhrase::getSortOrder))
                .map(this::toDto).toList();
    }

    public AdminWritingPhraseDto createPhrase(AdminWritingPhraseDto dto) {
        return toDto(phraseRepository.save(apply(new WritingPhrase(), dto)));
    }

    public AdminWritingPhraseDto updatePhrase(String id, AdminWritingPhraseDto dto) throws DataNotFoundException {
        WritingPhrase phrase = phraseRepository.findById(id).orElseThrow(() -> new DataNotFoundException("Phrase not found!"));
        return toDto(phraseRepository.save(apply(phrase, dto)));
    }

    public void deletePhrase(String id) throws DataNotFoundException {
        if (!phraseRepository.existsById(id)) throw new DataNotFoundException("Phrase not found!");
        exerciseRepository.deleteByPhraseId(id);
        phraseRepository.deleteById(id);
    }

    private WritingPhrase apply(WritingPhrase p, AdminWritingPhraseDto dto) {
        if (dto.level() == null || dto.category() == null || dto.phrase() == null || dto.phrase().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Level, category and phrase are required.");
        }
        p.setLevel(dto.level());
        p.setCategory(dto.category());
        p.setPhrase(dto.phrase().strip());
        p.setExplanation(blankToNull(dto.explanation()));
        p.setExample(blankToNull(dto.example()));
        p.setFormality(dto.formality());
        p.setUsageNote(blankToNull(dto.usageNote()));
        p.setSortOrder(dto.sortOrder());
        p.setActive(dto.active());
        p.setMeaningEn(blankToNull(dto.meaningEn()));
        p.setMeaningFa(blankToNull(dto.meaningFa()));
        p.setGrammarPattern(blankToNull(dto.grammarPattern()));
        p.setCommonMistake(blankToNull(dto.commonMistake()));
        p.setSimilarExpressions(RedemittelText.joinLines(dto.similarExpressions()));
        p.setContexts(RedemittelText.joinContexts(dto.contexts()));
        return p;
    }

    private AdminWritingPhraseDto toDto(WritingPhrase p) {
        return new AdminWritingPhraseDto(p.getId(), p.getLevel(), p.getCategory(), p.getPhrase(), p.getExplanation(),
                p.getExample(), p.getFormality(), p.getUsageNote(), p.getSortOrder(), p.isActive(),
                p.getMeaningEn(), p.getMeaningFa(), p.getGrammarPattern(), p.getCommonMistake(),
                RedemittelText.splitLines(p.getSimilarExpressions()), RedemittelText.splitContexts(p.getContexts()));
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s;
    }
}
