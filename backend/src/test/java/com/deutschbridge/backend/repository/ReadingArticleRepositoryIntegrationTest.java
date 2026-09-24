package com.deutschbridge.backend.repository;

import com.deutschbridge.backend.model.entity.Annotation;
import com.deutschbridge.backend.model.entity.LearningProgress;
import com.deutschbridge.backend.model.entity.ReadingArticle;
import com.deutschbridge.backend.model.entity.User;
import com.deutschbridge.backend.model.enums.LearningLevel;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Runs the reading list/summary queries against a real PostgreSQL (Testcontainers) - the paged
 * projection, the native jsonb lemma unpacking, the per-level aggregates and the atomic view bump.
 */
@Testcontainers
@SpringBootTest(properties = "notifications.scheduler.enabled=false")
@ActiveProfiles("test")
@Transactional
class ReadingArticleRepositoryIntegrationTest {

    @Autowired private ReadingArticleRepository readingArticleRepository;
    @Autowired private LearningProgressRepository learningProgressRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EntityManager entityManager;

    private ReadingArticle article(String title, LearningLevel level, LocalDateTime createdAt, String... lemmas) {
        ReadingArticle article = new ReadingArticle();
        article.setTitle(title);
        article.setTopic("topic");
        article.setLevel(level);
        article.setContent("content");
        article.setCreatedAt(createdAt);
        article.setAnnotations(java.util.Arrays.stream(lemmas).map(lemma -> {
            Annotation annotation = new Annotation();
            annotation.setLemma(lemma);
            annotation.ensureId();
            return annotation;
        }).collect(Collectors.toList()));
        return readingArticleRepository.save(article);
    }

    @Test
    @DisplayName("findListPage -> should page one level newest-first and filter by lower-cased title search")
    void findListPage_shouldPageAndSearch() {
        LocalDateTime base = LocalDateTime.of(2026, 1, 1, 0, 0);
        article("Das Haus", LearningLevel.A1, base.plusDays(1));
        article("Der Garten", LearningLevel.A1, base.plusDays(2));
        article("Mein Hausboot", LearningLevel.A1, base.plusDays(3));
        article("Das Haus B2", LearningLevel.B2, base.plusDays(4));

        Page<ReadingArticleListProjection> first = readingArticleRepository.findListPage(LearningLevel.A1, "", PageRequest.of(0, 2));
        assertEquals(3, first.getTotalElements());
        assertEquals(2, first.getTotalPages());
        assertEquals(List.of("Mein Hausboot", "Der Garten"), first.map(ReadingArticleListProjection::getTitle).toList());

        Page<ReadingArticleListProjection> searched = readingArticleRepository.findListPage(LearningLevel.A1, "haus", PageRequest.of(0, 10));
        assertEquals(List.of("Mein Hausboot", "Das Haus"), searched.map(ReadingArticleListProjection::getTitle).toList());
        assertEquals(LearningLevel.A1, searched.getContent().get(0).getLevel());
    }

    @Test
    @DisplayName("findAnnotationLemmas -> should unpack jsonb annotation lemmas and tolerate articles without annotations")
    void findAnnotationLemmas_shouldUnpackJsonb() {
        LocalDateTime now = LocalDateTime.now();
        ReadingArticle withLemmas = article("A", LearningLevel.A1, now, "Haus", "Garten");
        ReadingArticle withoutLemmas = article("B", LearningLevel.A1, now);
        ReadingArticle nullAnnotations = article("C", LearningLevel.A1, now);
        nullAnnotations.setAnnotations(null);
        readingArticleRepository.saveAndFlush(nullAnnotations);

        Map<String, List<String>> lemmas = readingArticleRepository
                .findAnnotationLemmas(List.of(withLemmas.getId(), withoutLemmas.getId(), nullAnnotations.getId()))
                .stream()
                .collect(Collectors.groupingBy(ReadingArticleLemmaProjection::getArticleId,
                        Collectors.mapping(ReadingArticleLemmaProjection::getLemma, Collectors.toList())));

        assertEquals(Map.of(withLemmas.getId(), List.of("Haus", "Garten")), lemmas);
    }

    @Test
    @DisplayName("level aggregates -> should count articles per level and only this user's learned ones")
    void levelAggregates_shouldCountTotalsAndLearned() {
        LocalDateTime now = LocalDateTime.now();
        ReadingArticle a1 = article("A", LearningLevel.A1, now);
        article("B", LearningLevel.A1, now);
        ReadingArticle b1 = article("C", LearningLevel.B1, now);

        User learner = userRepository.save(new User("Learner", "reader-" + System.nanoTime() + "@test.local", "x"));
        User other = userRepository.save(new User("Other", "other-" + System.nanoTime() + "@test.local", "x"));
        learned(learner, a1, true);
        learned(learner, b1, false);
        learned(other, b1, true);

        Map<LearningLevel, Long> totals = toMap(readingArticleRepository.countByLevel());
        assertTrue(totals.get(LearningLevel.A1) >= 2);
        assertTrue(totals.get(LearningLevel.B1) >= 1);

        assertEquals(Map.of(LearningLevel.A1, 1L), toMap(readingArticleRepository.countLearnedByLevelForUser(learner.getId())));
    }

    @Test
    @DisplayName("incrementViewCount -> should bump the counter in place and report missing articles")
    void incrementViewCount_shouldBumpAtomically() {
        ReadingArticle article = article("A", LearningLevel.A1, LocalDateTime.now());

        assertEquals(1, readingArticleRepository.incrementViewCount(article.getId()));
        assertEquals(1, readingArticleRepository.incrementViewCount(article.getId()));
        entityManager.clear();

        assertEquals(2L, readingArticleRepository.findViewCountById(article.getId()).orElseThrow());
        assertEquals(0, readingArticleRepository.incrementViewCount("missing"));
    }

    private void learned(User user, ReadingArticle article, boolean learned) {
        LearningProgress progress = new LearningProgress();
        progress.setUser(user);
        progress.setReading(article);
        progress.setIsLearned(learned);
        learningProgressRepository.save(progress);
    }

    private static Map<LearningLevel, Long> toMap(List<LevelCountProjection> rows) {
        return rows.stream().collect(Collectors.toMap(LevelCountProjection::getLevel, LevelCountProjection::getTotal));
    }
}
