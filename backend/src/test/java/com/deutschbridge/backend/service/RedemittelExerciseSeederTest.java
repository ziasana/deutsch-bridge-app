package com.deutschbridge.backend.service;

import com.deutschbridge.backend.model.entity.RedemittelExercise;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelExerciseType;
import com.deutschbridge.backend.repository.RedemittelExerciseRepository;
import com.deutschbridge.backend.repository.WritingPhraseRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

class RedemittelExerciseSeederTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private JsonNode b1() throws Exception {
        try (InputStream in = getClass().getResourceAsStream("/writing/redemittel-exercises-B1.json")) {
            return MAPPER.readTree(in);
        }
    }

    /** The built-in B1 phrases, read from the same guide file the app seeds. */
    private List<WritingPhrase> b1Phrases() throws Exception {
        List<WritingPhrase> list = new ArrayList<>();
        try (InputStream in = getClass().getResourceAsStream("/writing/guide-B1.json")) {
            int i = 0;
            for (JsonNode n : MAPPER.readTree(in).path("phrases")) {
                WritingPhrase p = new WritingPhrase();
                p.setId("id" + i++);
                p.setLevel(LearningLevel.B1);
                p.setPhrase(n.path("phrase").asText());
                list.add(p);
            }
        }
        return list;
    }

    private RedemittelExerciseRepository repo(List<WritingPhrase> phrases, WritingPhraseRepository phraseRepo) {
        when(phraseRepo.findAll()).thenReturn(phrases);
        RedemittelExerciseRepository exercises = mock(RedemittelExerciseRepository.class);
        when(exercises.countByPhrase()).thenReturn(List.of());
        return exercises;
    }

    @SuppressWarnings("unchecked")
    private List<RedemittelExercise> seedAll(List<WritingPhrase> phrases, RedemittelExerciseRepository exercises, WritingPhraseRepository phraseRepo) throws Exception {
        RedemittelExerciseSeeder.seed(b1(), phraseRepo, exercises);
        ArgumentCaptor<List<RedemittelExercise>> captor = ArgumentCaptor.forClass(List.class);
        verify(exercises).saveAll(captor.capture());
        return captor.getValue();
    }

    @Test
    @DisplayName("every built-in B1 phrase gets exercises, and every entry passes the admin validation")
    void coversAllB1Phrases() throws Exception {
        WritingPhraseRepository phraseRepo = mock(WritingPhraseRepository.class);
        List<WritingPhrase> phrases = b1Phrases();
        RedemittelExerciseRepository exercises = repo(phrases, phraseRepo);

        List<RedemittelExercise> saved = seedAll(phrases, exercises, phraseRepo);

        Map<String, List<RedemittelExercise>> byPhrase = saved.stream().collect(Collectors.groupingBy(RedemittelExercise::getPhraseId));
        assertEquals(phrases.size(), byPhrase.size(), "every B1 phrase has exercises");
        for (WritingPhrase p : phrases) {
            List<RedemittelExerciseType> types = byPhrase.get(p.getId()).stream().map(RedemittelExercise::getType).toList();
            assertTrue(types.contains(RedemittelExerciseType.MEANING), p.getPhrase());
            assertTrue(types.contains(RedemittelExerciseType.FILL_BLANK), p.getPhrase());
            assertTrue(types.contains(RedemittelExerciseType.PRODUCTION), p.getPhrase());
        }
        assertTrue(saved.stream().anyMatch(e -> e.getType() == RedemittelExerciseType.SITUATION));
    }

    @Test
    @DisplayName("fill-blank answers are single words that make sense, and the sentence keeps its blank")
    void fillBlanksAreSound() throws Exception {
        WritingPhraseRepository phraseRepo = mock(WritingPhraseRepository.class);
        List<WritingPhrase> phrases = b1Phrases();
        List<RedemittelExercise> saved = seedAll(phrases, repo(phrases, phraseRepo), phraseRepo);
        for (RedemittelExercise e : saved) {
            if (e.getType() != RedemittelExerciseType.FILL_BLANK) continue;
            assertTrue(e.getPrompt().contains("___"), e.getPrompt());
            assertFalse(e.getCorrectAnswer().contains(" "), e.getPrompt());
        }
    }

    @Test
    @DisplayName("a phrase that already has exercises is left alone (admin edits are never overwritten)")
    void keepsExistingExercises() throws Exception {
        WritingPhraseRepository phraseRepo = mock(WritingPhraseRepository.class);
        List<WritingPhrase> phrases = b1Phrases();
        RedemittelExerciseRepository exercises = repo(phrases, phraseRepo);
        when(exercises.countByPhrase()).thenReturn(List.<Object[]>of(new Object[]{"id8", 1L}));

        List<RedemittelExercise> saved = seedAll(phrases, exercises, phraseRepo);

        assertTrue(saved.stream().noneMatch(e -> e.getPhraseId().equals("id8")));
        assertTrue(saved.stream().anyMatch(e -> e.getPhraseId().equals("id9")));
    }

    @Test
    @DisplayName("seeding twice adds nothing the second time")
    void idempotent() throws Exception {
        WritingPhraseRepository phraseRepo = mock(WritingPhraseRepository.class);
        List<WritingPhrase> phrases = b1Phrases();
        RedemittelExerciseRepository exercises = repo(phrases, phraseRepo);
        when(exercises.countByPhrase()).thenReturn(phrases.stream().map(p -> new Object[]{p.getId(), 4L}).toList());

        assertEquals(0, RedemittelExerciseSeeder.seed(b1(), phraseRepo, exercises));
        verify(exercises).saveAll(anyList());
    }
}
