package com.deutschbridge.backend.service.cache;

import com.deutschbridge.backend.model.enums.ExamType;
import com.deutschbridge.backend.model.enums.LearningLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Fills the shared content caches a learner opens first (exam lists per exam and level, grammar levels, the first reading page of each
 * level) in the background right after start-up, so the first learner after a restart does not wait for those reads. Best effort: each
 * step is independent and a failure only means that cache is filled by the first request instead, as before.
 */
@Component
@Profile("!test")
public class ContentCacheWarmup {

    private static final Logger log = LoggerFactory.getLogger(ContentCacheWarmup.class);
    private static final int READING_PAGE_SIZE = 8; // the page size of the reading list in the app

    private final ContentCacheService contentCacheService;

    public ContentCacheWarmup(ContentCacheService contentCacheService) {
        this.contentCacheService = contentCacheService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        Thread thread = new Thread(this::warm, "content-cache-warmup");
        thread.setDaemon(true);
        thread.start();
    }

    void warm() {
        long start = System.nanoTime();
        int steps = 0;
        for (LearningLevel level : LearningLevel.values()) {
            steps += step("grammar " + level, () -> contentCacheService.getGrammarLevelContent(level));
            steps += step("reading " + level, () -> contentCacheService.getReadingArticleListPage(level, "", null, 0, READING_PAGE_SIZE));
            for (ExamType examType : new ExamType[]{ExamType.TELC, ExamType.DTZ}) {
                steps += step("exams " + examType + " " + level, () -> contentCacheService.getPublishedExamSummaries(null, level, null, examType));
            }
        }
        log.info("Content cache warm-up finished {} steps in {} ms", steps, (System.nanoTime() - start) / 1_000_000);
    }

    private int step(String name, Runnable work) {
        try {
            work.run();
            return 1;
        } catch (RuntimeException e) {
            log.warn("Content cache warm-up skipped {}: {}", name, e.getMessage());
            return 0;
        }
    }
}
