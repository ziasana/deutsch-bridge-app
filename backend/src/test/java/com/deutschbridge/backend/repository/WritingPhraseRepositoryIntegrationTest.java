package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.RedemittelCollectionItem;
import com.deutschbridge.backend.model.entity.RedemittelProgress;
import com.deutschbridge.backend.model.entity.WritingPhrase;
import com.deutschbridge.backend.model.enums.LearningLevel;
import com.deutschbridge.backend.model.enums.RedemittelStatus;
import com.deutschbridge.backend.model.enums.WritingPhraseCategory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/** Runs the Redemittel learner queries (filters, search, status, collection, user isolation) on a real PostgreSQL. */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class WritingPhraseRepositoryIntegrationTest {

    private static final List<LearningLevel> ALL_LEVELS = List.of(LearningLevel.values());
    private static final List<WritingPhraseCategory> ALL_CATEGORIES = List.of(WritingPhraseCategory.values());
    private static final List<RedemittelStatus> ALL_STATUSES = List.of(RedemittelStatus.values());

    @Autowired private WritingPhraseRepository phraseRepository;
    @Autowired private RedemittelProgressRepository progressRepository;
    @Autowired private RedemittelCollectionRepository collectionRepository;

    private WritingPhrase phrase(LearningLevel level, WritingPhraseCategory category, String text, boolean active) {
        WritingPhrase p = new WritingPhrase();
        p.setLevel(level);
        p.setCategory(category);
        p.setPhrase(text);
        p.setActive(active);
        return phraseRepository.save(p);
    }

    private void progress(String userId, WritingPhrase phrase, RedemittelStatus status) {
        RedemittelProgress p = new RedemittelProgress();
        p.setUserId(userId);
        p.setPhraseId(phrase.getId());
        p.setStatus(status);
        p.setLearnedAt(LocalDateTime.now());
        p.setNextReviewAt(LocalDateTime.now().minusMinutes(1));
        progressRepository.save(p);
    }

    private Set<String> page(String userId, List<LearningLevel> levels, List<WritingPhraseCategory> categories, String search,
                             List<WritingPhraseCategory> searchCategories, boolean includeNew, List<RedemittelStatus> statuses, boolean savedOnly) {
        boolean matchCategories = !searchCategories.isEmpty();
        return phraseRepository.findLearnerPage(userId, levels, categories, "%" + search + "%", matchCategories,
                        matchCategories ? searchCategories : ALL_CATEGORIES, includeNew, statuses, savedOnly, PageRequest.of(0, 5000))
                .getContent().stream().map(WritingPhrase::getId).collect(Collectors.toSet());
    }

    private Set<String> all(String userId) {
        return page(userId, ALL_LEVELS, ALL_CATEGORIES, "", List.of(), true, ALL_STATUSES, false);
    }

    @Test
    @DisplayName("findLearnerPage -> only active Redemittel, filtered by level and category")
    void filtersAndActive() {
        WritingPhrase b1Opinion = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "Ich bin der Meinung, dass …", true);
        WritingPhrase b2Opinion = phrase(LearningLevel.B2, WritingPhraseCategory.OPINION, "Meines Erachtens …", true);
        WritingPhrase b1Reason = phrase(LearningLevel.B1, WritingPhraseCategory.REASON, "Ein wichtiger Grund dafür ist …", true);
        WritingPhrase hidden = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "Versteckt", false);

        Set<String> everything = all("u1");
        assertTrue(everything.containsAll(Set.of(b1Opinion.getId(), b2Opinion.getId(), b1Reason.getId())));
        assertFalse(everything.contains(hidden.getId()));

        assertEquals(Set.of(b1Opinion.getId()), page("u1", List.of(LearningLevel.B1), List.of(WritingPhraseCategory.OPINION), "", List.of(), true, ALL_STATUSES, false)
                .stream().filter(id -> Set.of(b1Opinion.getId(), b2Opinion.getId(), b1Reason.getId()).contains(id)).collect(Collectors.toSet()));
    }

    @Test
    @DisplayName("findLearnerPage -> search matches the expression text and the category label")
    void search() {
        WritingPhrase agree = phrase(LearningLevel.B1, WritingPhraseCategory.AGREEMENT, "Da bin ich ganz deiner Meinung.", true);
        WritingPhrase other = phrase(LearningLevel.B1, WritingPhraseCategory.REASON, "Ein wichtiger Grund dafür ist …", true);

        assertTrue(page("u1", ALL_LEVELS, ALL_CATEGORIES, "ganz deiner", List.of(), true, ALL_STATUSES, false).contains(agree.getId()));

        List<WritingPhraseCategory> byLabel = Arrays.stream(WritingPhraseCategory.values())
                .filter(c -> c.getLabel().toLowerCase().contains("zustimmen")).toList();
        Set<String> found = page("u1", ALL_LEVELS, ALL_CATEGORIES, "zustimmen", byLabel, true, ALL_STATUSES, false);
        assertTrue(found.contains(agree.getId()));
        assertFalse(found.contains(other.getId()));
    }

    @Test
    @DisplayName("findLearnerPage -> status filter: no progress row is NEW, and progress is per user")
    void statusAndUserIsolation() {
        WritingPhrase learning = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "A", true);
        WritingPhrase mastered = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "B", true);
        WritingPhrase fresh = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "C", true);
        progress("u1", learning, RedemittelStatus.LEARNING);
        progress("u1", mastered, RedemittelStatus.MASTERED);
        progress("u2", fresh, RedemittelStatus.MASTERED); // someone else's progress must not count for u1

        Set<String> mine = Set.of(learning.getId(), mastered.getId(), fresh.getId());
        assertEquals(Set.of(fresh.getId()), page("u1", ALL_LEVELS, ALL_CATEGORIES, "", List.of(), true, List.of(RedemittelStatus.values()), false)
                .stream().filter(mine::contains).filter(id -> id.equals(fresh.getId())).collect(Collectors.toSet()));
        assertEquals(Set.of(fresh.getId()), page("u1", ALL_LEVELS, ALL_CATEGORIES, "", List.of(), true, List.of(RedemittelStatus.NEW), false)
                .stream().filter(mine::contains).collect(Collectors.toSet()));
        assertEquals(Set.of(mastered.getId()), page("u1", ALL_LEVELS, ALL_CATEGORIES, "", List.of(), false, List.of(RedemittelStatus.MASTERED), false)
                .stream().filter(mine::contains).collect(Collectors.toSet()));
        assertEquals(Set.of(fresh.getId()), page("u2", ALL_LEVELS, ALL_CATEGORIES, "", List.of(), false, List.of(RedemittelStatus.MASTERED), false)
                .stream().filter(mine::contains).collect(Collectors.toSet()));
    }

    @Test
    @DisplayName("findLearnerPage -> savedOnly lists just the caller's collection")
    void savedOnly() {
        WritingPhrase saved = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "S", true);
        WritingPhrase notSaved = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "N", true);
        WritingPhrase savedByOther = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "O", true);
        for (var entry : List.of(Set.of("u1", saved.getId()), Set.of("u2", savedByOther.getId()))) {
            RedemittelCollectionItem item = new RedemittelCollectionItem();
            item.setUserId(entry.contains("u1") ? "u1" : "u2");
            item.setPhraseId(entry.stream().filter(s -> !s.startsWith("u")).findFirst().orElseThrow());
            collectionRepository.save(item);
        }

        Set<String> mine = page("u1", ALL_LEVELS, ALL_CATEGORIES, "", List.of(), true, ALL_STATUSES, true);
        assertTrue(mine.contains(saved.getId()));
        assertFalse(mine.contains(notSaved.getId()));
        assertFalse(mine.contains(savedByOther.getId()));
    }

    @Test
    @DisplayName("findUnlearned / countDue / findDue -> scoped to the caller")
    void unlearnedAndDue() {
        WritingPhrase learned = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "L", true);
        WritingPhrase unlearned = phrase(LearningLevel.B1, WritingPhraseCategory.OPINION, "U", true);
        progress("u1", learned, RedemittelStatus.LEARNING);
        Set<String> unlearnedIds = phraseRepository.findUnlearned("u1").stream().map(WritingPhrase::getId).collect(Collectors.toSet());
        assertTrue(unlearnedIds.contains(unlearned.getId()));
        assertFalse(unlearnedIds.contains(learned.getId()));
        assertTrue(phraseRepository.findUnlearned("u2").stream().anyMatch(p -> p.getId().equals(learned.getId())));

        assertEquals(1, progressRepository.countDue("u1", LocalDateTime.now()));
        assertEquals(0, progressRepository.countDue("u2", LocalDateTime.now()));
        assertEquals(1, progressRepository.findDue("u1", LocalDateTime.now(), PageRequest.of(0, 10)).size());
    }
}
