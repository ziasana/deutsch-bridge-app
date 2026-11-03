package com.deutschbridge.backend.service.examsim;

import com.deutschbridge.backend.model.entity.ExamProfile;
import com.deutschbridge.backend.model.examsim.ExamPartConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Fills the exam content cache for every published mock exam right after start-up, in the background, so the first learner who opens the
 * Probeprüfung page does not wait for every part's exercises to be read from the database. Best effort: a failure only means the first
 * request fills the cache itself, as before.
 */
@Component
@Profile("!test")
public class ExamSimulationWarmup {

    private static final Logger log = LoggerFactory.getLogger(ExamSimulationWarmup.class);

    private final ExamProfileService profileService;
    private final ExamPoolService poolService;

    public ExamSimulationWarmup(ExamProfileService profileService, ExamPoolService poolService) {
        this.profileService = profileService;
        this.poolService = poolService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onReady() {
        Thread thread = new Thread(this::warm, "exam-simulation-warmup");
        thread.setDaemon(true);
        thread.start();
    }

    void warm() {
        long start = System.nanoTime();
        try {
            int parts = 0;
            for (ExamProfile profile : profileService.listPublished()) {
                for (ExamPartConfig part : profile.getConfig().partsOrEmpty()) {
                    poolService.eligibleExercises(profile, part);
                    parts++;
                }
            }
            log.info("Exam simulation warm-up read {} parts in {} ms", parts, (System.nanoTime() - start) / 1_000_000);
        } catch (RuntimeException e) {
            log.warn("Exam simulation warm-up skipped: {}", e.getMessage());
        }
    }
}
