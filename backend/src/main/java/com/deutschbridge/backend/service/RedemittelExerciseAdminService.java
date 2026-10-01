package com.deutschbridge.backend.service;

import com.deutschbridge.backend.exception.DataNotFoundException;
import com.deutschbridge.backend.model.dto.AdminRedemittelExerciseDto;
import com.deutschbridge.backend.model.entity.RedemittelExercise;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelExerciseType;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.repository.RedemittelExerciseRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

/** Admin CRUD for the practice exercises of a Redemittel. The whole set of a phrase is saved at once. */
@Service
public class RedemittelExerciseAdminService {

    static final int MIN_WRONG = 2;

    private final RedemittelExerciseRepository exerciseRepository;
    private final WritingPhraseRepository phraseRepository;

    public RedemittelExerciseAdminService(RedemittelExerciseRepository exerciseRepository, WritingPhraseRepository phraseRepository) {
        this.exerciseRepository = exerciseRepository;
        this.phraseRepository = phraseRepository;
    }

    public List<AdminRedemittelExerciseDto> list(String phraseId) throws DataNotFoundException {
        requirePhrase(phraseId);
        return exerciseRepository.findByPhraseIdOrderBySortOrderAsc(phraseId).stream().map(RedemittelExerciseAdminService::toDto).toList();
    }

    /** Replaces all exercises of the phrase with the given ones (an empty list removes them). */
    @Transactional
    public List<AdminRedemittelExerciseDto> replace(String phraseId, List<AdminRedemittelExerciseDto> dtos) throws DataNotFoundException {
        requirePhrase(phraseId);
        List<RedemittelExercise> toSave = new ArrayList<>();
        int order = 0;
        for (AdminRedemittelExerciseDto dto : dtos == null ? List.<AdminRedemittelExerciseDto>of() : dtos) {
            toSave.add(toEntity(phraseId, dto, order++));
        }
        exerciseRepository.deleteByPhraseId(phraseId);
        exerciseRepository.flush();
        return exerciseRepository.saveAll(toSave).stream().map(RedemittelExerciseAdminService::toDto).toList();
    }

    /** Number of exercises per phrase id for one level, so the admin list can flag phrases without any. */
    public Map<String, Long> countsForLevel(LearningLevel level) {
        Set<String> ids = new HashSet<>();
        for (WritingPhrase p : phraseRepository.findAll()) {
            if (p.getLevel() == level) ids.add(p.getId());
        }
        Map<String, Long> counts = new HashMap<>();
        for (Object[] row : exerciseRepository.countByPhrase()) {
            if (ids.contains((String) row[0])) counts.put((String) row[0], (Long) row[1]);
        }
        return counts;
    }

    private void requirePhrase(String phraseId) throws DataNotFoundException {
        if (!phraseRepository.existsById(phraseId)) throw new DataNotFoundException("Phrase not found!");
    }

    /** Validates an exercise for its type; the learner UI relies on these shapes. */
    static RedemittelExercise toEntity(String phraseId, AdminRedemittelExerciseDto dto, int order) {
        if (dto.type() == null) throw bad("Exercise type is required.");
        String prompt = strip(dto.prompt());
        String correct = strip(dto.correctAnswer());
        List<String> wrong = RedemittelText.splitLines(RedemittelText.joinLines(dto.wrongAnswers()));

        switch (dto.type()) {
            case MEANING, SITUATION -> {
                if (dto.type() == RedemittelExerciseType.SITUATION && prompt == null) throw bad("A situation needs a prompt.");
                if (correct == null) throw bad("The correct answer is required.");
                if (wrong.size() < MIN_WRONG) throw bad("At least " + MIN_WRONG + " wrong answers are required.");
                Set<String> options = new HashSet<>();
                options.add(correct.toLowerCase(Locale.ROOT));
                for (String w : wrong) {
                    if (!options.add(w.toLowerCase(Locale.ROOT))) throw bad("Answers must all be different.");
                }
            }
            case FILL_BLANK -> {
                if (prompt == null || !prompt.contains("___")) throw bad("The sentence must contain a blank (___).");
                if (correct == null) throw bad("The missing word is required.");
                wrong = List.of();
            }
            case PRODUCTION -> {
                if (prompt == null) throw bad("A topic is required.");
                correct = null;
                wrong = List.of();
            }
            default -> throw bad("This exercise type is generated automatically and cannot be authored.");
        }

        RedemittelExercise e = new RedemittelExercise();
        e.setPhraseId(phraseId);
        e.setType(dto.type());
        e.setPrompt(prompt);
        e.setCorrectAnswer(correct);
        e.setWrongAnswers(RedemittelText.joinLines(wrong));
        e.setSortOrder(order);
        return e;
    }

    static AdminRedemittelExerciseDto toDto(RedemittelExercise e) {
        return new AdminRedemittelExerciseDto(e.getId(), e.getType(), e.getPrompt(), e.getCorrectAnswer(),
                RedemittelText.splitLines(e.getWrongAnswers()), e.getSortOrder());
    }

    private static String strip(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }

    private static ResponseStatusException bad(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }
}
